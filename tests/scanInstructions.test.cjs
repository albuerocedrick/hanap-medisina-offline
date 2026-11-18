const test = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const { act } = require('react-test-renderer');
const { environment } = require('./helpers/renderApp.cjs');

const screenPath = 'app/(tabs)/scan.tsx';
const textContent = node => typeof node === 'string' || typeof node === 'number' ? String(node)
  : node?.children?.map(textContent).join('') ?? '';

async function scanner(language = 'en', savedOnboarding, reducedMotion = true) {
  const env = environment();
  env.mocks['@expo/vector-icons'].MaterialCommunityIcons = 'MaterialCommunityIcons';
  if (savedOnboarding) env.memory.set('hanap-medisina-onboarding-v1', savedOnboarding);
  const state = { focused: true, active: false, captures: 0, cameraListener: null };
  const theme = env.load('src/theme/tokens.ts').lightTheme;
  env.mocks['@/src/theme/useTheme'] = { useTheme: () => ({ ...theme, isDark: false }) };
  env.mocks['react-native'].TouchableWithoutFeedback = 'TouchableWithoutFeedback';
  env.mocks['react-native'].Modal = 'Modal';
  Object.assign(env.mocks['react-native-reanimated'], {
    useReducedMotion: () => reducedMotion,
    Easing: { linear: value => value },
    withTiming: value => value,
    cancelAnimation() {},
  });
  env.mocks['react-native'].AppState = { currentState: 'active', addEventListener: (_, listener) => {
    state.cameraListener = listener;
    return { remove() {} };
  } };
  env.mocks['@react-navigation/native'] = { useIsFocused: () => state.focused };
  const cameraDevice = { hasFlash: true, supportsFocus: true };
  env.mocks['react-native-vision-camera'] = {
    Camera: 'Camera', useCameraDevice: () => cameraDevice,
    useCameraPermission: () => ({ hasPermission: true, requestPermission: async () => true }),
  };
  env.mocks['@/src/components/scan/ScanBottomSheet'] = { ScanBottomSheet: () => null };
  env.mocks['@/src/hooks/useScanController'] = { useScanController: (_, active) => {
    state.active = active;
    return { modelReady: true, isProcessing: false, isDismissing: false, sheetState: 'hidden', loading: false,
      capture: () => { state.captures++; }, dismiss() {}, onClosed() {}, viewDetails() {},
    };
  } };
  env.load('src/store/useSettingsStore.ts').useSettingsStore.getState().setLanguage(language);
  await env.load('src/store/useOnboardingStore.ts').useOnboardingStore.persist.rehydrate();
  const translations = env.load(`src/i18n/${language}.ts`).default;
  const Component = env.load(screenPath).default;
  const tree = await env.mount(screenPath);
  return { env, state, tree, translations,
    button: key => tree.root.findByProps({ accessibilityLabel: translations[key] }),
    async focus(value) {
      state.focused = value;
      await act(async () => tree.update(React.createElement(Component)));
    },
  };
}

for (const language of ['en', 'tl']) test(`scanner shows clear ${language} instructions before allowing capture`, async () => {
  const app = await scanner(language);
  try {
    const content = textContent(app.tree.root);
    for (const key of ['capture_guide', 'scan_intro_frame', 'scan_intro_small_plant', 'scan_intro_light', 'scan_intro_focus']) {
      assert.ok(content.includes(app.translations[key]));
    }
    assert.equal(app.tree.root.findByType('Modal').props.animationType, 'none');
    const carousel = app.tree.root.findAllByType('ScrollView').find(node => node.props.horizontal);
    assert.equal(carousel.props.pagingEnabled, true);
    assert.equal(carousel.findAllByType('Pressable').length, 0,
      'the start action stays outside scrolling instructions so large text cannot push it offscreen');
    await act(async () => app.button('scan_intro_small_plant').props.onPress());
    const smallPlantSlide = carousel.findAllByType('View').find(node => node.props.importantForAccessibility === 'auto');
    assert.ok(textContent(smallPlantSlide).includes(app.translations.scan_intro_small_plant_body));
    assert.ok(textContent(smallPlantSlide).includes(app.translations.scan_demo_one_photo_taken));
    assert.equal(smallPlantSlide.findAllByType('Image').length, 1);
    assert.equal(app.state.captures, 0, 'the demo does not take a real photo');
    assert.equal(app.state.active, false, 'tab-trigger capture must be blocked while the intro is visible');
    assert.equal(app.tree.root.findAllByProps({ accessibilityLabel: app.translations.capture_photo }).length, 0);
    await act(async () => app.button('scan_intro_start').props.onPress());
    assert.equal(app.button('capture_photo').props.disabled, true, 'wait for native camera initialization');
    await act(async () => app.tree.root.findByType('Camera').props.onInitialized());
    assert.equal(app.state.active, true);
    assert.equal(app.button('capture_photo').props.disabled, false);
    await act(async () => app.button('capture_photo').props.onPress());
    assert.equal(app.state.captures, 1);
    assert.equal(app.tree.root.findAllByProps({ accessibilityLabel: app.translations.scan_intro_start }).length, 0);
  } finally { act(() => app.tree.unmount()); }
});

test('photo tips suspend capture and scanner instructions return on a later visit', async () => {
  const app = await scanner();
  try {
    await act(async () => {
      app.tree.root.findByType('Camera').props.onInitialized();
      app.button('scan_intro_start').props.onPress();
    });
    assert.equal(app.state.active, true);
    await act(async () => app.button('capture_help').props.onPress());
    assert.equal(app.state.active, false);
    await act(async () => app.tree.root.findByType('Modal').props.onRequestClose());
    assert.equal(app.state.active, true);
    await app.focus(false);
    assert.equal(app.state.active, false);
    await app.focus(true);
    assert.ok(app.button('scan_intro_start'));
    assert.equal(app.state.active, false);
    await act(async () => app.button('scan_intro_start').props.onPress());
    assert.equal(app.state.active, true);
  } finally { act(() => app.tree.unmount()); }
});

test('scan guide loops across swipe boundaries and updates its selected slide', async () => {
  const app = await scanner();
  try {
    const carousel = app.tree.root.findAllByType('ScrollView').find(node => node.props.horizontal);
    const slideWidth = carousel.props.contentOffset.x;
    for (const [edge, key] of [[0, 'scan_intro_focus'], [5, 'scan_intro_frame']]) {
      await act(async () => carousel.props.onMomentumScrollEnd({ nativeEvent: { contentOffset: { x: edge * slideWidth } } }));
      assert.equal(app.button(key).props.accessibilityState.selected, true);
    }
    await act(async () => app.button('scan_intro_light').props.onPress());
    assert.equal(app.button('scan_intro_light').props.accessibilityState.selected, true);
  } finally { act(() => app.tree.unmount()); }
});

test('the carousel auto-advances, wraps, and stops in the background', async context => {
  context.mock.timers.enable({ apis: ['setTimeout'] });
  const app = await scanner('en', undefined, false);
  const advance = async () => {
    await act(async () => context.mock.timers.tick(6500));
    await act(async () => context.mock.timers.tick(140));
  };
  try {
    for (const key of ['scan_intro_small_plant', 'scan_intro_light', 'scan_intro_focus', 'scan_intro_frame']) {
      await advance();
      assert.equal(app.button(key).props.accessibilityState.selected, true);
    }
    await act(async () => app.state.cameraListener('background'));
    await advance();
    assert.equal(app.button('scan_intro_frame').props.accessibilityState.selected, true);
    await act(async () => app.state.cameraListener('active'));
    await advance();
    assert.equal(app.button('scan_intro_small_plant').props.accessibilityState.selected, true);
  } finally { act(() => app.tree.unmount()); }
});

test('the checkbox survives a restart and can be cleared from Photo tips', async () => {
  const app = await scanner();
  let savedOnboarding;
  try {
    assert.equal(app.button('scan_guide_skip').props.accessibilityState.checked, false);
    await act(async () => app.button('scan_guide_skip').props.onPress());
    await act(async () => app.button('scan_intro_start').props.onPress());
    await app.focus(false);
    await app.focus(true);
    assert.equal(app.tree.root.findAllByType('Modal').length, 0);
    savedOnboarding = app.env.memory.get('hanap-medisina-onboarding-v1');
  } finally { act(() => app.tree.unmount()); }

  const restarted = await scanner('en', savedOnboarding);
  try {
    assert.equal(restarted.tree.root.findAllByType('Modal').length, 0);
    await act(async () => restarted.button('capture_help').props.onPress());
    assert.equal(restarted.button('scan_guide_skip').props.accessibilityState.checked, true);
    await act(async () => restarted.button('scan_guide_skip').props.onPress());
    await act(async () => restarted.tree.root.findByType('Modal').props.onRequestClose());
    await restarted.focus(false);
    await restarted.focus(true);
    assert.equal(restarted.button('scan_guide_skip').props.accessibilityState.checked, false);
  } finally { act(() => restarted.tree.unmount()); }
});

test('camera retry keeps capture disabled until the replacement camera initializes', async () => {
  const app = await scanner();
  try {
    await act(async () => {
      app.tree.root.findByType('Camera').props.onInitialized();
      app.button('scan_intro_start').props.onPress();
    });
    await act(async () => app.tree.root.findByType('Camera').props.onError(new Error('camera unavailable')));
    assert.equal(app.state.active, false);
    assert.equal(app.tree.root.findAllByType('Camera').length, 0);
    await act(async () => app.button('scan_try_again').props.onPress());
    assert.equal(app.button('capture_photo').props.disabled, true);
    assert.equal(app.state.active, false);
    await act(async () => app.tree.root.findByType('Camera').props.onInitialized());
    assert.equal(app.state.active, true);
    assert.equal(app.button('capture_photo').props.disabled, false);
  } finally { act(() => app.tree.unmount()); }
});
