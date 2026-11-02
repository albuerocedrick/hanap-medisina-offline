const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const React = require('react');
const { act } = require('react-test-renderer');
const { createLoader } = require('./helpers/loadTypeScript.cjs');
const { environment } = require('./helpers/renderApp.cjs');

const {
  MASCOT_SPRITE_METRICS: metrics,
  MASCOT_SLOT_WIDTH: slotWidth,
  MASCOT_SLOT_HEIGHT: slotHeight,
  getMascotLayout,
  getMascotFrameOffset,
} = createLoader().load('src/components/home/mascotLayout.ts');

const assetNames = {
  idle: 'idle', goingSleep: 'going-to-sleep', sleeping: 'sleep-idle', wakeup: 'wakeup',
  happy: 'happy', thinking: 'thinking', excited: 'excited', winking: 'winking', peaceful: 'peaceful',
};
function assetSize(name) {
  const png = fs.readFileSync(path.join(__dirname, '../assets/images/home-mascot', `herbi-${assetNames[name]}.png`));
  assert.equal(png.subarray(1, 4).toString(), 'PNG');
  return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
}
function layout(name, density = 1) {
  const size = assetSize(name);
  return getMascotLayout(metrics[name], size.width * density, size.height * density);
}
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} ≈ ${expected}`);

test('sprite calibration matches the dimensions of all nine bundled PNGs', () => {
  for (const [name, value] of Object.entries(metrics)) {
    assert.deepEqual(assetSize(name), { width: value.referenceWidth, height: value.referenceHeight }, name);
    assert.equal(value.frames, value.cols * value.rows);
  }
});

test('reclining Herbi keeps the standing body scale instead of zooming to fill a shorter frame', () => {
  const idle = layout('idle');
  const lyingDown = layout('sleeping');
  near(lyingDown.scale, idle.scale);
  near(lyingDown.scale, layout('goingSleep').scale);
  near(idle.scale * metrics.idle.uprightHeight, 107);
  assert.ok(lyingDown.height < idle.height * 0.9, 'sleep should naturally be lower than the upright pose');
  assert.ok(lyingDown.width < 110, 'the sleeping pose must not expand to the old ~128px width');
  near(layout('wakeup').scale * metrics.wakeup.uprightHeight, idle.scale * metrics.idle.uprightHeight);
});

test('all poses fit the fixed mascot slot and preserve their geometry at different asset resolutions', () => {
  for (const name of Object.keys(metrics)) {
    const standard = layout(name);
    assert.ok(standard.width > 0 && standard.width <= slotWidth, name);
    assert.ok(standard.height > 0 && standard.height <= slotHeight, name);
    for (const density of [0.5, 2, 3]) {
      const scaled = layout(name, density);
      near(scaled.width, standard.width);
      near(scaled.height, standard.height);
      near(scaled.sheetWidth, standard.sheetWidth);
      near(scaled.sheetHeight, standard.sheetHeight);
    }
  }
});

test('first, last and timing-end sprite offsets select exactly one valid cell without row bleed', () => {
  for (const name of Object.keys(metrics)) {
    const current = layout(name);
    const first = getMascotFrameOffset(0, current);
    near(first.translateX, 0);
    near(first.translateY, 0);
    const last = getMascotFrameOffset(current.frames - 1, current);
    near(last.translateX + current.sheetWidth, current.width);
    near(last.translateY + current.sheetHeight, current.height);
    assert.deepEqual(getMascotFrameOffset(current.frames, current), last);
    assert.deepEqual(getMascotFrameOffset(current.frames + 100, current), last);
    assert.deepEqual(getMascotFrameOffset(-5, current), first);
    assert.deepEqual(getMascotFrameOffset(NaN, current), first);
    for (let frame = 0; frame < current.frames; frame++) {
      const offset = getMascotFrameOffset(frame + 0.9, current);
      assert.ok(offset.translateX <= 0 && offset.translateY <= 0);
      assert.ok(offset.translateX + current.sheetWidth >= current.width - 1e-8);
      assert.ok(offset.translateY + current.sheetHeight >= current.height - 1e-8);
    }
  }
});

function mascotEnvironment({ reduced = true, focused = true } = {}) {
  const env = environment();
  const state = { active: 'active', focused, reduced, loops: [], timing: [], cancellations: 0, removed: 0 };
  let onAppState;
  env.mocks['react-native'].AppState = {
    currentState: state.active,
    addEventListener: (_event, callback) => { onAppState = callback; return { remove: () => { state.removed++; } }; },
  };
  env.mocks['react-native'].Image.resolveAssetSource = source => {
    const name = Object.keys(assetNames).find(key => source.endsWith(`herbi-${assetNames[key]}.png`));
    return assetSize(name);
  };
  env.mocks['@react-navigation/native'] = { useIsFocused: () => state.focused };
  const reanimated = env.mocks['react-native-reanimated'];
  Object.assign(reanimated.default, { Image: 'AnimatedImage', Text: 'AnimatedText' });
  Object.assign(reanimated, {
    LinearTransition: reanimated.FadeIn,
    useSharedValue: value => React.useRef({ value }).current,
    useReducedMotion: () => state.reduced,
    withTiming: (value, options, finished) => { state.timing.push({ value, options, finished }); return value; },
    withRepeat: (value, count) => { state.loops.push(count); return value; },
    Easing: { linear: value => value },
    runOnJS: callback => callback,
    cancelAnimation: () => { state.cancellations++; },
  });
  return { ...env, state, appState: next => onAppState(next) };
}
const mascotPath = 'src/components/home/MascotChatSlot.tsx';
const renderedLayout = tree => tree.root.findByType('AnimatedImage').parent.props.style;

test('real mascot component keeps sleep compact and wakes correctly with reduced motion', async context => {
  context.mock.timers.enable({ apis: ['setTimeout', 'setInterval', 'Date'], now: 100000 });
  const env = mascotEnvironment();
  const tree = await env.mount(mascotPath);
  try {
    const idle = renderedLayout(tree);
    await act(async () => context.mock.timers.tick(30000));
    assert.ok(tree.root.findByType('AnimatedImage').props.source.endsWith('herbi-going-to-sleep.png'));
    await act(async () => context.mock.timers.tick(1200));
    assert.ok(tree.root.findByType('AnimatedImage').props.source.endsWith('herbi-sleep-idle.png'));
    const sleeping = renderedLayout(tree);
    near(sleeping.width, layout('sleeping').width);
    assert.ok(sleeping.height < idle.height);
    await act(async () => tree.root.findByType('Pressable').props.onPress());
    assert.ok(tree.root.findByType('AnimatedImage').props.source.endsWith('herbi-wakeup.png'));
    await act(async () => context.mock.timers.tick(1200));
    assert.ok(tree.root.findByType('AnimatedImage').props.source.endsWith('herbi-idle.png'));
    assert.deepEqual(env.state.loops, [], 'reduced motion must never start sprite animation');
  } finally { act(() => tree.unmount()); }
  assert.equal(env.state.removed, 1);
});

test('mascot playback remains bounded and stops while backgrounded, unfocused or hidden', async context => {
  context.mock.timers.enable({ apis: ['setTimeout', 'setInterval', 'Date'], now: 100000 });
  const env = mascotEnvironment({ reduced: false });
  const Component = env.load(mascotPath).MascotChatSlot;
  const tree = await env.mount(mascotPath);
  try {
    assert.deepEqual(env.state.loops, [3]);
    await act(async () => env.appState('background'));
    await act(async () => context.mock.timers.tick(60000));
    assert.ok(tree.root.findByType('AnimatedImage').props.source.endsWith('herbi-idle.png'));
    assert.deepEqual(env.state.loops, [3]);
    await act(async () => env.appState('active'));
    assert.deepEqual(env.state.loops, [3, 3]);
    env.state.focused = false;
    await act(async () => tree.update(React.createElement(Component)));
    await act(async () => context.mock.timers.tick(60000));
    assert.deepEqual(env.state.loops, [3, 3]);
    env.state.focused = true;
    await act(async () => tree.update(React.createElement(Component, { visible: false })));
    await act(async () => context.mock.timers.tick(60000));
    assert.deepEqual(env.state.loops, [3, 3]);
    assert.ok(env.state.cancellations >= 4);
  } finally { act(() => tree.unmount()); }
});
