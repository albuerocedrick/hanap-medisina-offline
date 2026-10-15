const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function load(relativePath, dependencies = {}) {
  const filename = path.resolve(__dirname, '..', relativePath);
  const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const loaded = { exports: {} };
  new Function('require', 'module', 'exports', '__DEV__', output)(name => {
    assert.ok(name in dependencies, `unmocked dependency ${name}`);
    return dependencies[name];
  }, loaded, loaded.exports, false);
  return loaded.exports;
}

const { ScanSession } = load('src/lib/scanSession.ts');
test('scan session holds its capture lock after focus loss until native work settles', () => {
  const session = new ScanSession();
  const first = session.start();
  assert.equal(session.start(), null);
  session.invalidate();
  assert.equal(session.isCurrent(first), false);
  assert.equal(session.start(), null, 'focus changes cannot unlock an in-flight capture');
  session.finish();
  const second = session.start();
  assert.ok(second > first);
  assert.equal(session.isCurrent(second), true);
});

test('sheet dismissal blocks a new scan until the actual exit animation ends', () => {
  const session = new ScanSession();
  session.start();
  session.openSheet();
  session.finish();
  assert.equal(session.start(), null);
  assert.equal(session.closeSheet(), true);
  assert.equal(session.start(), null);
  assert.equal(session.closeSheet(), false);
  session.finishClosing();
  assert.ok(session.start() !== null);
});

test('TFLite loads once for concurrent consumers, ignores late loads after cleanup, and drops its final cached reference', async () => {
  const cleanups = [];
  const updates = [];
  let resolveLoad;
  let loads = 0;
  const hook = load('src/hooks/useTFLite.ts', {
    react: { useEffect(callback) { cleanups.push(callback()); }, useState(initial) { return [initial, value => updates.push(value)]; } },
    'expo-asset': { Asset: { loadAsync: async () => [{ localUri: 'labels.txt' }] } },
    'expo-file-system': { readAsStringAsync: async () => 'Plant\nUnknown\n' },
    'react-native-fast-tflite': { loadTensorflowModel: () => {
      loads++;
      return new Promise(resolve => { resolveLoad = resolve; });
    } },
    '../../assets/model/labels.txt': 1,
    '../../assets/model/medicinal_model_oct_9.tflite': 2,
  }).useTFLite;
  hook();
  hook();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(loads, 1);
  cleanups[0]();
  resolveLoad({ outputs: [{ shape: [1, 2] }] });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(updates.length, 1, 'unmounted consumers must not receive model state');
  assert.deepEqual(updates[0].labels, ['Plant', 'Unknown']);
  cleanups[1]();
  hook();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(loads, 2, 'the cache must release the model after the last consumer leaves');
  cleanups[2]();
  resolveLoad({ outputs: [{ shape: [1, 2] }] });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(updates.length, 1);
});

test('capture triggers use the latest callback without replaying a consumed trigger after model load', async () => {
  const React = require('react');
  const { act, create } = require('react-test-renderer');
  const listeners = new Set();
  let state = { captureTrigger: 0, isProcessing: false, setIsProcessing(value) {
    state = { ...state, isProcessing: value };
    for (const listener of listeners) listener();
  } };
  function useCameraStore(selector) {
    return React.useSyncExternalStore(callback => { listeners.add(callback); return () => listeners.delete(callback); }, () => selector(state));
  }
  useCameraStore.getState = () => state;
  let ready = false;
  let photos = 0;
  let finishPhoto;
  const flashes = [];
  const camera = { current: { takePhoto: options => {
    photos++;
    flashes.push(options.flash);
    return new Promise(resolve => { finishPhoto = resolve; });
  } } };
  let controller;
  const actions = [];
  const translations = key => key;
  const router = { push: route => actions.push(route) };
  const hook = load('src/hooks/useScanController.ts', {
    react: React,
    'expo-crypto': { randomUUID: () => 'capture-uuid' },
    'expo-file-system': { documentDirectory: 'file:///documents/', makeDirectoryAsync: async () => {},
      deleteAsync: async () => {}, copyAsync: async () => {} },
    'expo-router': { useRouter: () => router },
    'react-native': { Alert: { alert() {} } },
    '@/src/i18n/useTranslation': { useTranslation: () => ({ t: translations }) },
    '@/src/lib/scanSession': { ScanSession },
    '@/src/services/localLibrary': { getAllPlants: () => [{ id: 'plant', name: 'Plant' }] },
    '@/src/services/modelLabels': { getPlantIdForModelLabel: () => 'plant' },
    '@/src/store/useCameraStore': { useCameraStore },
    '@/src/store/useHistoryStore': { useHistoryStore: selector => selector({ addScan: value => actions.push(value) }) },
    '@/src/hooks/useTFLite': { useTFLite: () => ({ model: ready ? {} : null, labels: ready ? ['Plant'] : [], loading: !ready, error: null }) },
    '@/src/hooks/useScanInference': { useScanInference: () => async () => ({ index: 0, confidence: 0.8 }) },
  }).useScanController;
  function Harness({ active = true, flash = 'off' }) { controller = hook(camera, active, flash); return null; }
  let renderer;
  await act(async () => { renderer = create(React.createElement(Harness)); });
  await act(async () => {
    state = { ...state, captureTrigger: 1 };
    for (const listener of listeners) listener();
  });
  assert.equal(photos, 0, 'model-not-ready trigger should be consumed');
  ready = true;
  await act(async () => { renderer.update(React.createElement(Harness, { flash: 'on' })); });
  assert.equal(photos, 0, 'model readiness must not replay the old trigger');
  await act(async () => {
    state = { ...state, captureTrigger: 2 };
    for (const listener of listeners) listener();
  });
  assert.equal(photos, 1);
  assert.equal(flashes[0], 'on', 'the trigger must use the latest flash setting');
  await act(async () => { await controller.capture(); });
  assert.equal(photos, 1, 'direct capture and tab trigger share the same lock');
  await act(async () => { renderer.update(React.createElement(Harness, { active: false })); });
  await act(async () => { renderer.update(React.createElement(Harness)); });
  await act(async () => { await controller.capture(); });
  assert.equal(photos, 1, 'focus loss cannot release an uncancellable capture');
  await act(async () => { finishPhoto({ path: '/old.jpg' }); });
  assert.equal(controller.sheetState, 'hidden', 'late photo must not resurrect an abandoned scan');
  assert.equal(actions.length, 0, 'abandoned scans must not create history entries');
  let accepted;
  await act(async () => { accepted = controller.capture(); });
  await act(async () => { finishPhoto({ path: '/accepted.jpg' }); await accepted; });
  assert.equal(controller.sheetState, 'success');
  assert.equal(actions.length, 1);
  assert.equal(actions[0].imageUri, 'file:///documents/scans/capture_capture-uuid.jpg');
  await act(async () => { controller.viewDetails(); });
  assert.equal(controller.isDismissing, true);
  assert.equal(actions.length, 1, 'navigation must wait for the sheet exit callback');
  await act(async () => { await controller.capture(); });
  assert.equal(photos, 2, 'dismissal must block direct capture');
  await act(async () => { controller.onClosed(); });
  assert.equal(actions[1], '/(tabs)/library/plant');
  assert.equal(controller.photoUri, null);
  await act(async () => { renderer.unmount(); });
});

test('camera retry remounts the native session while preserving a live result sheet through its exit callback', async () => {
  const React = require('react');
  const { act, create } = require('react-test-renderer');
  const listeners = new Set();
  let state = { captureTrigger: 0, isProcessing: false, setIsProcessing(value) {
    state = { ...state, isProcessing: value };
    for (const listener of listeners) listener();
  } };
  function useCameraStore(selector) {
    return React.useSyncExternalStore(callback => { listeners.add(callback); return () => listeners.delete(callback); }, () => selector(state));
  }
  useCameraStore.getState = () => state;
  const translations = key => key;
  const useTranslation = () => ({ t: translations });
  const router = { push() {} };
  const controllerHook = load('src/hooks/useScanController.ts', {
    react: React,
    'expo-crypto': { randomUUID: () => 'uuid' },
    'expo-file-system': { documentDirectory: 'file:///documents/', makeDirectoryAsync: async () => {}, deleteAsync: async () => {}, copyAsync: async () => {} },
    'expo-router': { useRouter: () => router },
    'react-native': { Alert: { alert() {} } },
    '@/src/i18n/useTranslation': { useTranslation },
    '@/src/lib/scanSession': { ScanSession },
    '@/src/services/localLibrary': { getAllPlants: () => [{ id: 'plant', name: 'Plant' }] },
    '@/src/services/modelLabels': { getPlantIdForModelLabel: () => 'plant' },
    '@/src/store/useCameraStore': { useCameraStore },
    '@/src/store/useHistoryStore': { useHistoryStore: selector => selector({ addScan() {} }) },
    '@/src/hooks/useTFLite': { useTFLite: () => ({ model: {}, labels: ['Plant'], loading: false, error: null }) },
    '@/src/hooks/useScanInference': { useScanInference: () => async () => ({ index: 0, confidence: 0.8 }) },
  }).useScanController;
  let controller;
  let cameraMounts = 0;
  const Camera = React.forwardRef((props, ref) => {
    React.useImperativeHandle(ref, () => ({ takePhoto: async () => ({ path: '/plant.jpg' }) }), []);
    React.useEffect(() => { cameraMounts++; }, []);
    return React.createElement('Camera', props);
  });
  let sheetMounts = 0;
  let sheetUnmounts = 0;
  let finishExit;
  function Sheet(props) {
    const previous = React.useRef(props.sheetState);
    React.useEffect(() => { sheetMounts++; return () => { sheetUnmounts++; }; }, []);
    React.useEffect(() => {
      if (previous.current !== 'hidden' && props.sheetState === 'hidden') finishExit = props.onClosed;
      previous.current = props.sheetState;
    }, [props.sheetState, props.onClosed]);
    return React.createElement('ScanBottomSheet', props);
  }
  const useOnboardingStore = selector => selector({ cameraGuideSeen: true });
  useOnboardingStore.getState = () => ({ markCameraGuideSeen() {} });
  const device = { hasFlash: true, supportsFocus: true };
  const Screen = load('app/(tabs)/scan.tsx', {
    react: React, 'react/jsx-runtime': require('react/jsx-runtime'),
    '@expo/vector-icons': { Ionicons: 'Icon' },
    '@react-navigation/native': { useIsFocused: () => true },
    'react-native': { ActivityIndicator: 'ActivityIndicator', AppState: { currentState: 'active', addEventListener: () => ({ remove() {} }) },
      StyleSheet: { absoluteFill: {} }, Text: 'Text', TouchableOpacity: 'TouchableOpacity', TouchableWithoutFeedback: 'TouchableWithoutFeedback',
      View: 'View', useWindowDimensions: () => ({ width: 400, height: 800 }) },
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 0, bottom: 0 }) },
    'react-native-vision-camera': { Camera, useCameraDevice: () => device, useCameraPermission: () => ({ hasPermission: true, requestPermission() {} }) },
    '@/src/components/onboarding/CaptureGuide': { CaptureGuide: () => null },
    '@/src/components/scan/PermissionGate': { PermissionGate: () => null },
    '@/src/components/scan/ScanBottomSheet': { ScanBottomSheet: Sheet },
    '@/src/components/scan/ScanReticle': { ScanReticle: () => null },
    '@/src/components/scan/scan.styles': { scanStyles: {} },
    '@/src/hooks/useScanController': { useScanController: (...args) => { controller = controllerHook(...args); return controller; } },
    '@/src/i18n/useTranslation': { useTranslation },
    '@/src/store/useOnboardingStore': { useOnboardingStore },
    '@/src/theme/useTheme': { useTheme: () => ({}) },
  }).default;
  let renderer;
  await act(async () => { renderer = create(React.createElement(Screen)); });
  await act(async () => { await controller.capture(); });
  assert.equal(controller.sheetState, 'success');
  await act(async () => { renderer.root.findByType('Camera').props.onError(new Error('transient native session error')); });
  assert.equal(controller.sheetState, 'hidden');
  assert.equal(controller.isDismissing, true);
  assert.equal(sheetMounts, 1);
  assert.equal(sheetUnmounts, 0, 'camera failures must preserve the sheet until the native exit animation completes');
  assert.equal(typeof finishExit, 'function');
  await act(async () => { renderer.root.findByProps({ accessibilityLabel: 'scan_try_again' }).props.onPress(); });
  assert.equal(cameraMounts, 2, 'retry must create a fresh native camera session');
  assert.equal(controller.isDismissing, true, 'retry must respect the still-exiting sheet');
  await act(async () => { await controller.capture(); });
  assert.equal(controller.sheetState, 'hidden');
  await act(async () => { finishExit(); });
  assert.equal(controller.isDismissing, false);
  await act(async () => { await controller.capture(); });
  assert.equal(controller.sheetState, 'success', 'capture must recover after retry and sheet exit');
  await act(async () => { renderer.unmount(); });
});
