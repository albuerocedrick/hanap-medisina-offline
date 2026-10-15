const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const { act, create } = require('react-test-renderer');

// Keep native substitutes at the boundary; execute the actual hooks and their
// React effects, including cancellation and ownership of temporary files.
function load(relativePath, dependencies = {}) {
  const filename = path.resolve(__dirname, '..', relativePath);
  const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const loaded = { exports: {} };
  new Function('require', 'module', 'exports', '__DEV__', output)(name => {
    assert.ok(Object.hasOwn(dependencies, name), `unmocked dependency ${name}`);
    return dependencies[name];
  }, loaded, loaded.exports, false);
  return loaded.exports;
}
const { ScanSession } = load('src/lib/scanSession.ts');
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
const flush = () => new Promise(resolve => setImmediate(resolve));

async function scanner(t, options = {}) {
  const listeners = new Set();
  const events = { photos: [], inferred: [], directories: [], copied: [], deleted: [], scans: [], routes: [], alerts: [] };
  let state = { captureTrigger: 0, isProcessing: false, setIsProcessing(value) {
    state = { ...state, isProcessing: value };
    listeners.forEach(listener => listener());
  } };
  function useCameraStore(selector) {
    return React.useSyncExternalStore(callback => { listeners.add(callback); return () => listeners.delete(callback); }, () => selector(state));
  }
  useCameraStore.getState = () => state;
  const camera = { current: options.noCamera ? null : { takePhoto: async args => {
    events.photos.push(args);
    return options.takePhoto ? options.takePhoto(args) : { path: '/capture.jpg' };
  } } };
  const infer = async uri => {
    events.inferred.push(uri);
    return options.infer ? options.infer(uri) : { index: 0, confidence: 0.8 };
  };
  const plants = options.plants ?? [{ id: 'plant', name: 'Plant' }];
  const router = { push: route => events.routes.push(route) };
  const translate = key => key;
  const hook = load('src/hooks/useScanController.ts', {
    react: React,
    'expo-crypto': { randomUUID: () => 'test-uuid' },
    'expo-file-system': { documentDirectory: 'file:///documents/',
      makeDirectoryAsync: async (...args) => { events.directories.push(args); if (options.makeDirectory) await options.makeDirectory(...args); },
      copyAsync: async args => { events.copied.push(args); if (options.copy) await options.copy(args); },
      deleteAsync: async (uri, settings) => { events.deleted.push({ uri, settings }); if (options.delete) await options.delete(uri); },
    },
    'expo-router': { useRouter: () => router },
    'react-native': { Alert: { alert: (...args) => events.alerts.push(args) } },
    '@/src/i18n/useTranslation': { useTranslation: () => ({ t: translate }) },
    '@/src/lib/scanSession': { ScanSession },
    '@/src/services/localLibrary': { getAllPlants: () => plants },
    '@/src/services/modelLabels': { getPlantIdForModelLabel: label => label === 'Plant' ? 'plant' : null },
    '@/src/store/useCameraStore': { useCameraStore },
    '@/src/store/useHistoryStore': { useHistoryStore: selector => selector({ addScan: scan => {
      if (options.addScan) options.addScan(scan);
      events.scans.push(scan);
    } }) },
    '@/src/hooks/useTFLite': { useTFLite: () => options.modelState ?? { model: {}, labels: ['Plant'], loading: false, error: null } },
    '@/src/hooks/useScanInference': { useScanInference: () => infer },
  }).useScanController;
  let controller;
  let props = { active: true, flash: 'off' };
  function Harness(settings) { controller = hook(camera, settings.active, settings.flash); return null; }
  let renderer;
  await act(async () => { renderer = create(React.createElement(Harness, props)); });
  let alive = true;
  async function unmount() {
    if (!alive) return;
    alive = false;
    await act(async () => renderer.unmount());
  }
  t.after(unmount);
  return {
    get current() { return controller; }, events, plants,
    async capture() { await act(async () => { await controller.capture(); }); },
    async beginCapture() {
      let pending;
      await act(async () => { pending = controller.capture(); await flush(); });
      return { pending };
    },
    async update(next) { props = { ...props, ...next }; await act(async () => renderer.update(React.createElement(Harness, props))); },
    async invoke(name) { await act(async () => controller[name]()); },
    unmount,
  };
}

for (const [name, settings, error] of [
  ['missing label asset URI', { uri: null }, /Failed to load model labels/],
  ['unreadable labels', { readError: new Error('labels I/O') }, /labels I\/O/],
  ['native model load rejection', { modelError: 'native model unavailable' }, /native model unavailable/],
  ['label/output dimension mismatch', { outputShape: [1, 9] }, /does not match/],
  ['missing output tensor', { outputShape: null }, /does not match/],
]) {
  test(`model initialization surfaces ${name} without leaving a loading spinner`, async () => {
    const updates = [];
    const cleanups = [];
    const hook = load('src/hooks/useTFLite.ts', {
      react: { useEffect: callback => cleanups.push(callback()), useState: initial => [initial, value => updates.push(value)] },
      'expo-asset': { Asset: { loadAsync: async () => [{ localUri: settings.uri === null ? null : 'file:///labels.txt' }] } },
      'expo-file-system': { readAsStringAsync: async () => { if (settings.readError) throw settings.readError; return ' Plant \r\n Unknown\n\n'; } },
      'react-native-fast-tflite': { loadTensorflowModel: async () => {
        if (settings.modelError) throw settings.modelError;
        return { outputs: settings.outputShape === null ? [] : [{ shape: settings.outputShape ?? [1, 2] }] };
      } },
      '../../assets/model/labels.txt': 1, '../../assets/model/medicinal_model_oct_9.tflite': 2,
    }).useTFLite;
    hook();
    await flush();
    assert.equal(updates.length, 1);
    assert.equal(updates[0].loading, false);
    assert.equal(updates[0].model, null);
    assert.deepEqual(updates[0].labels, []);
    assert.match(updates[0].error.message, error);
    cleanups.forEach(cleanup => cleanup());
  });
}

test('a failed shared model load is retried after all consumers leave', async () => {
  const updates = [];
  const cleanups = [];
  let loads = 0;
  const hook = load('src/hooks/useTFLite.ts', {
    react: { useEffect: callback => cleanups.push(callback()), useState: initial => [initial, value => updates.push(value)] },
    'expo-asset': { Asset: { loadAsync: async () => [{ localUri: 'labels.txt' }] } },
    'expo-file-system': { readAsStringAsync: async () => 'Plant\nUnknown' },
    'react-native-fast-tflite': { loadTensorflowModel: async () => {
      if (++loads === 1) throw new Error('transient load failure');
      return { outputs: [{ shape: [1, 2] }] };
    } },
    '../../assets/model/labels.txt': 1, '../../assets/model/medicinal_model_oct_9.tflite': 2,
  }).useTFLite;
  hook(); hook();
  await flush();
  assert.equal(loads, 1);
  assert.equal(updates.length, 2);
  cleanups.splice(0).forEach(cleanup => cleanup());
  hook();
  await flush();
  assert.equal(loads, 2);
  assert.equal(updates.at(-1).error, null);
  assert.deepEqual(updates.at(-1).labels, ['Plant', 'Unknown']);
  cleanups.forEach(cleanup => cleanup());
});

test('inactive, missing camera, missing model and empty labels block native capture', async t => {
  for (const [name, options, props] of [
    ['inactive screen', {}, { active: false }],
    ['missing camera', { noCamera: true }, {}],
    ['model loading', { modelState: { model: null, labels: [], loading: true, error: null } }, {}],
    ['empty labels', { modelState: { model: {}, labels: [], loading: false, error: null } }, {}],
  ]) await t.test(name, async child => {
    const app = await scanner(child, options);
    await app.update(props);
    await app.capture();
    assert.equal(app.events.photos.length, 0);
    assert.equal(app.current.sheetState, 'hidden');
    assert.equal(app.current.isProcessing, false);
  });
});

for (const phase of ['capture', 'inference']) test(`${phase} rejection shows a recoverable failure and releases the processing lock`, async t => {
  let fail = true;
  const options = phase === 'capture' ? { takePhoto: async () => {
    if (fail) throw new Error('native camera failure');
    return { path: '/recovered.jpg' };
  } } : { infer: async () => {
    if (fail) throw new Error('worker failure');
    return { index: 0, confidence: 0.8 };
  } };
  const app = await scanner(t, options);
  await app.capture();
  assert.equal(app.current.sheetState, 'error');
  assert.equal(app.current.failed, true);
  assert.equal(app.current.isProcessing, false);
  assert.equal(app.events.scans.length, 0);
  await app.invoke('dismiss');
  await app.invoke('onClosed');
  if (phase === 'inference') assert.ok(app.events.deleted.some(entry => entry.uri === 'file:///capture.jpg'));
  fail = false;
  await app.capture();
  assert.equal(app.current.sheetState, 'success');
  assert.equal(app.current.failed, false);
  assert.equal(app.events.scans.length, 1);
});

test('Unknown, missing catalog entries, invalid indices and confidence below 35% never save a scan', async t => {
  for (const [name, options] of [
    ['Unknown label', { modelState: { model: {}, labels: ['Unknown'], loading: false }, infer: async () => ({ index: 0, confidence: 0.99 }) }],
    ['catalog entry missing', { plants: [] }],
    ['out of range index', { infer: async () => ({ index: 10, confidence: 0.99 }) }],
    ['under threshold', { infer: async () => ({ index: 0, confidence: 0.349999 }) }],
  ]) await t.test(name, async child => {
    const app = await scanner(child, options);
    await app.capture();
    assert.equal(app.current.sheetState, 'error');
    assert.equal(app.current.failed, false, 'unrecognized leaves use recognition guidance, rather than a runtime failure');
    assert.equal(app.current.result, null);
    assert.equal(app.events.copied.length, 0);
    assert.equal(app.events.scans.length, 0);
    assert.equal(app.current.isProcessing, false);
  });
});

test('confidence at 35% is accepted and already-prefixed photo URIs are preserved', async t => {
  const app = await scanner(t, { takePhoto: async () => ({ path: 'file:///camera/already.jpg' }), infer: async () => ({ index: 0, confidence: 0.35 }) });
  await app.capture();
  assert.equal(app.current.sheetState, 'success');
  assert.equal(app.current.result.confidence, 0.35);
  assert.deepEqual(app.events.inferred, ['file:///camera/already.jpg']);
  assert.equal(app.events.scans[0].imageUri, 'file:///documents/scans/capture_test-uuid.jpg');
  assert.equal(app.current.saveStatus, 'scan_saved');
});

for (const phase of ['directory', 'copy', 'history']) test(`${phase} save failure preserves a readable recognition and reports that history was not saved`, async t => {
  const reject = () => { throw new Error('storage unavailable'); };
  const app = await scanner(t, phase === 'directory' ? { makeDirectory: reject } : phase === 'copy' ? { copy: reject } : { addScan: reject });
  await app.capture();
  assert.equal(app.current.sheetState, 'success');
  assert.equal(app.current.result.plantId, 'plant');
  assert.equal(app.current.photoUri, 'file:///capture.jpg');
  assert.equal(app.current.saveStatus, 'scan_save_failed');
  assert.equal(app.current.isProcessing, false);
  assert.equal(app.events.scans.length, 0);
  if (phase !== 'directory') assert.ok(app.events.deleted.some(entry => entry.uri === 'file:///documents/scans/capture_test-uuid.jpg'));
  await app.invoke('viewDetails');
  assert.deepEqual(app.events.routes, []);
  await app.invoke('onClosed');
  assert.deepEqual(app.events.routes, ['/(tabs)/library/plant']);
});

for (const phase of ['capture', 'inference', 'storage']) test(`leaving the screen during ${phase} discards late work and cleans files before allowing a fresh capture`, async t => {
  const pending = deferred();
  const options = phase === 'capture' ? { takePhoto: () => pending.promise }
    : phase === 'inference' ? { infer: () => pending.promise } : { copy: () => pending.promise };
  const app = await scanner(t, options);
  const operation = await app.beginCapture();
  assert.equal(app.current.isProcessing, true);
  if (phase === 'storage') {
    await app.invoke('dismiss');
    assert.equal(app.current.sheetState, 'success', 'storage owns the preview until it settles');
    assert.equal(app.current.isDismissing, false);
  }
  await app.update({ active: false });
  if (phase !== 'capture') await app.invoke('onClosed');
  await app.update({ active: true });
  await app.capture();
  assert.equal(app.events.photos.length, 1, 'returning focus cannot start concurrent uncancellable work');
  await act(async () => {
    pending.resolve(phase === 'capture' ? { path: '/late.jpg' } : { index: 0, confidence: 0.8 });
    await operation.pending;
  });
  assert.equal(app.current.sheetState, 'hidden');
  assert.equal(app.current.result, null);
  assert.equal(app.current.isProcessing, false);
  assert.equal(app.events.scans.length, 0);
  assert.equal(app.events.routes.length, 0);
  assert.ok(app.events.deleted.some(entry => entry.uri === (phase === 'capture' ? 'file:///late.jpg' : 'file:///capture.jpg')));
  if (phase === 'storage') assert.ok(app.events.deleted.some(entry => entry.uri === 'file:///documents/scans/capture_test-uuid.jpg'));
  await app.capture();
  assert.equal(app.current.sheetState, 'success');
  assert.equal(app.events.scans.length, 1);
});

test('unmounting during inference deletes the preview and ignores the worker result', async t => {
  const worker = deferred();
  const app = await scanner(t, { infer: () => worker.promise });
  const operation = await app.beginCapture();
  await app.unmount();
  assert.ok(app.events.deleted.some(entry => entry.uri === 'file:///capture.jpg'));
  await act(async () => { worker.resolve({ index: 0, confidence: 0.9 }); await operation.pending; });
  assert.equal(app.events.scans.length, 0);
  assert.equal(app.events.copied.length, 0);
});

test('successful dismissal deletes only the temporary preview and loss of focus cancels pending navigation', async t => {
  const app = await scanner(t);
  await app.capture();
  await app.invoke('viewDetails');
  assert.equal(app.current.isDismissing, true);
  await app.update({ active: false });
  await app.invoke('onClosed');
  assert.deepEqual(app.events.routes, []);
  assert.ok(app.events.deleted.some(entry => entry.uri === 'file:///capture.jpg'));
  assert.ok(!app.events.deleted.some(entry => entry.uri === 'file:///documents/scans/capture_test-uuid.jpg'), 'history retains ownership of its saved image');
});

function inferenceHarness(options = {}) {
  const calls = { manipulations: [], deleted: [], workers: [] };
  const useScanInference = load('src/hooks/useScanInference.ts', {
    react: { useMemo: callback => callback(), useCallback: callback => callback },
    'expo-file-system': { deleteAsync: async (uri, settings) => { calls.deleted.push({ uri, settings }); if (options.deleteError) throw new Error('cleanup failed'); } },
    'expo-image-manipulator': { SaveFormat: { JPEG: 'jpeg' }, manipulateAsync: async (...args) => {
      calls.manipulations.push(args);
      const index = calls.manipulations.length;
      if (options.failAt === index) throw new Error(`manipulation ${index} failed`);
      return index === 1 ? { uri: options.sameUri ? 'file:///original.jpg' : 'file:///upright.jpg', width: options.width ?? 1200, height: options.height ?? 1600 }
        : { uri: 'file:///resized.jpg', base64: options.missingBase64 ? undefined : 'encoded-jpeg' };
    } },
    'react-native-worklets-core': { Worklets: { createContext: name => ({ name }) }, useWorklet: () => async base64 => {
      calls.workers.push(base64);
      if (options.workerError) throw new Error('worker failed');
      return { index: 1, confidence: 0.8 };
    } },
    '@/src/lib/jpegDecoder.worklet': { decodeScanJpeg() {} },
    '@/src/services/scanInference': { bestScanOutput() {}, decodeScanBase64() {}, makeScanInput() {} },
  }).useScanInference;
  return { infer: useScanInference({}), calls };
}

test('native preprocessing preserves portrait and landscape aspect ratios and removes both generated JPEGs', async () => {
  for (const [width, height, expected] of [[1200, 1600, { width: 168, height: 224 }], [1600, 1200, { width: 224, height: 168 }], [1, 4000, { width: 1, height: 224 }]]) {
    const app = inferenceHarness({ width, height });
    assert.deepEqual(await app.infer('file:///original.jpg'), { index: 1, confidence: 0.8 });
    assert.deepEqual(app.calls.manipulations[1][1], [{ resize: expected }]);
    assert.deepEqual(app.calls.workers, ['encoded-jpeg']);
    assert.deepEqual(app.calls.deleted.map(entry => entry.uri).sort(), ['file:///resized.jpg', 'file:///upright.jpg']);
    assert.ok(app.calls.deleted.every(entry => entry.settings.idempotent));
  }
});

for (const [name, options, message, expectedDeleted] of [
  ['upright normalization failure', { failAt: 1 }, /manipulation 1/, []],
  ['resize failure', { failAt: 2 }, /manipulation 2/, ['file:///upright.jpg']],
  ['missing resized base64', { missingBase64: true }, /Image resize failed/, ['file:///resized.jpg', 'file:///upright.jpg']],
  ['worker rejection', { workerError: true }, /worker failed/, ['file:///resized.jpg', 'file:///upright.jpg']],
]) test(`preprocessing cleans up correctly after ${name}`, async () => {
  const app = inferenceHarness(options);
  await assert.rejects(app.infer('file:///original.jpg'), message);
  assert.deepEqual(app.calls.deleted.map(entry => entry.uri).sort(), expectedDeleted);
});

test('preprocessing never deletes the original capture and cleanup failures cannot hide a recognition', async () => {
  const app = inferenceHarness({ sameUri: true, deleteError: true });
  assert.deepEqual(await app.infer('file:///original.jpg'), { index: 1, confidence: 0.8 });
  assert.deepEqual(app.calls.deleted.map(entry => entry.uri), ['file:///resized.jpg']);
});

test('the actual inference callback rejects unsupported native tensors and missing or nonfinite outputs', async t => {
  const helpers = load('src/services/scanInference.ts');
  for (const [name, model, error] of [
    ['model unavailable', null, /Model not ready/],
    ['missing input', { inputs: [], outputs: [] }, /Unsupported model input shape/],
    ['wrong tensor shape', { inputs: [{ shape: [1, 256, 256, 3] }] }, /Unsupported model input shape/],
    ['unsupported input type', { inputs: [{ shape: [1, 224, 224, 3], dataType: 'float16' }] }, /Unsupported model input type/],
    ['no output tensor', { inputs: [{ shape: [1, 224, 224, 3], dataType: 'float32' }], runSync: () => [] }, /returned no output/],
    ['nonfinite probabilities', { inputs: [{ shape: [1, 224, 224, 3], dataType: 'float32' }], outputs: [{ dataType: 'float32' }], runSync: () => [new Float32Array([NaN, Infinity])] }, /no valid probabilities/],
  ]) await t.test(name, async () => {
    const deleted = [];
    let manipulations = 0;
    const hook = load('src/hooks/useScanInference.ts', {
      react: { useMemo: callback => callback(), useCallback: callback => callback },
      'expo-file-system': { deleteAsync: async uri => deleted.push(uri) },
      'expo-image-manipulator': { SaveFormat: { JPEG: 'jpeg' }, manipulateAsync: async () => ++manipulations === 1
        ? { uri: 'file:///upright.jpg', width: 1, height: 1 }
        : { uri: 'file:///resized.jpg', base64: 'AA==' } },
      'react-native-worklets-core': { Worklets: { createContext: () => ({}) }, useWorklet: (context, callback) => callback },
      '@/src/lib/jpegDecoder.worklet': { decodeScanJpeg: () => ({ width: 1, height: 1, data: new Uint8Array([0, 0, 0, 255]) }) },
      '@/src/services/scanInference': helpers,
    }).useScanInference;
    await assert.rejects(hook(model)('file:///original.jpg'), error);
    assert.deepEqual(deleted.sort(), ['file:///resized.jpg', 'file:///upright.jpg']);
  });
});

test('the scan screen gates native camera activity on permission, focus, foreground, guide and device availability', async t => {
  let permission = false, focused = true, guideSeen = false, device = { hasFlash: true, supportsFocus: true };
  let requests = 0, guideMarks = 0, appStateListener, controllerActive;
  const onboardingListeners = new Set();
  function useOnboardingStore(selector) {
    return React.useSyncExternalStore(callback => { onboardingListeners.add(callback); return () => onboardingListeners.delete(callback); }, () => selector({ cameraGuideSeen: guideSeen }));
  }
  useOnboardingStore.getState = () => ({ markCameraGuideSeen() { guideMarks++; guideSeen = true; onboardingListeners.forEach(callback => callback()); } });
  const Camera = React.forwardRef((props, ref) => { React.useImperativeHandle(ref, () => ({ takePhoto() {} }), []); return React.createElement('Camera', props); });
  const identity = key => key;
  const Screen = load('app/(tabs)/scan.tsx', {
    react: React, 'react/jsx-runtime': require('react/jsx-runtime'),
    '@expo/vector-icons': { Ionicons: 'Icon' },
    '@react-navigation/native': { useIsFocused: () => focused },
    'react-native': { ActivityIndicator: 'Spinner', AppState: { currentState: 'active', addEventListener: (name, callback) => { appStateListener = callback; return { remove() { appStateListener = null; } }; } },
      StyleSheet: { absoluteFill: {} }, Text: 'Text', TouchableOpacity: 'Button', TouchableWithoutFeedback: 'Touchable', View: 'View', useWindowDimensions: () => ({ width: 400, height: 800 }) },
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 0, bottom: 0 }) },
    'react-native-vision-camera': { Camera, useCameraDevice: () => device, useCameraPermission: () => ({ hasPermission: permission, requestPermission: async () => { requests++; } }) },
    '@/src/components/onboarding/CaptureGuide': { CaptureGuide: props => React.createElement('Guide', props) },
    '@/src/components/scan/PermissionGate': { PermissionGate: props => React.createElement('Permission', props) },
    '@/src/components/scan/ScanBottomSheet': { ScanBottomSheet: props => React.createElement('Sheet', props) },
    '@/src/components/scan/ScanReticle': { ScanReticle: () => null },
    '@/src/components/scan/scan.styles': { scanStyles: {} },
    '@/src/hooks/useScanController': { useScanController: (camera, active) => {
      controllerActive = active;
      return { modelReady: true, sheetState: 'hidden', isProcessing: false, isDismissing: false, loading: false, capture() {} };
    } },
    '@/src/i18n/useTranslation': { useTranslation: () => ({ t: identity }) },
    '@/src/store/useOnboardingStore': { useOnboardingStore },
    '@/src/theme/useTheme': { useTheme: () => ({}) },
  }).default;
  let renderer;
  await act(async () => { renderer = create(React.createElement(Screen)); });
  t.after(async () => act(async () => renderer.unmount()));
  const refresh = async () => act(async () => renderer.update(React.createElement(Screen)));
  assert.equal(controllerActive, false);
  assert.equal(renderer.root.findAllByType('Camera').length, 0);
  await act(async () => renderer.root.findByType('Permission').props.onRequest());
  assert.equal(requests, 1);
  assert.equal(controllerActive, false, 'a denied permission request must leave capture inactive');
  assert.equal(renderer.root.findAllByType('Camera').length, 0);
  permission = true;
  await refresh();
  assert.equal(renderer.root.findByType('Guide').props.visible, true);
  assert.equal(renderer.root.findByType('Camera').props.isActive, false);
  await act(async () => renderer.root.findByType('Guide').props.onClose());
  assert.equal(guideMarks, 1);
  assert.equal(controllerActive, true);
  assert.equal(renderer.root.findByType('Camera').props.isActive, true);
  await act(async () => appStateListener('background'));
  assert.equal(controllerActive, false);
  await act(async () => appStateListener('active'));
  assert.equal(controllerActive, true);
  focused = false;
  await refresh();
  assert.equal(controllerActive, false);
  focused = true;
  await refresh();
  assert.equal(controllerActive, true);
  await act(async () => renderer.root.findByProps({ accessibilityLabel: 'capture_help' }).props.onPress());
  assert.equal(controllerActive, false);
  await act(async () => renderer.root.findByType('Guide').props.onClose());
  assert.equal(controllerActive, true);
  device = null;
  await refresh();
  assert.equal(controllerActive, false);
  assert.equal(renderer.root.findAllByType('Camera').length, 0);
  assert.ok(renderer.root.findByProps({ accessibilityRole: 'alert' }));
});
