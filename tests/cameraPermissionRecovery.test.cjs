const test = require('node:test');
const assert = require('node:assert/strict');
const { act } = require('react-test-renderer');
const { environment } = require('./helpers/renderApp.cjs');

const gatePath = 'src/components/scan/PermissionGate.tsx';
const button = tree => tree.root.findByType('TouchableOpacity');
const textContent = node => typeof node === 'string' ? node
  : node?.children?.map(textContent).join('') ?? '';

function setup() {
  const env = environment();
  env.mocks['@/src/i18n/useTranslation'] = { useTranslation: () => ({ t: key => key }) };
  return env;
}

test('denied camera permission offers Settings instead of repeating a blocked permission prompt', async () => {
  const env = setup();
  let requests = 0;
  let settings = 0;
  env.mocks['react-native'].Linking = { openSettings: async () => { settings++; } };
  const tree = await env.mount(gatePath, { onRequest: async () => { requests++; return false; } });
  try {
    assert.equal(button(tree).props.accessibilityLabel, 'scan_perm_btn');
    await act(async () => { await button(tree).props.onPress(); });
    assert.equal(requests, 1);
    assert.ok(textContent(tree.root).includes('scan_perm_settings_body'));
    assert.equal(button(tree).props.accessibilityLabel, 'scan_perm_settings_btn');
    await act(async () => { await button(tree).props.onPress(); });
    assert.equal(settings, 1);
    assert.equal(requests, 1, 'recovery must use settings rather than request the same denied permission again');
  } finally { act(() => tree.unmount()); }
});

test('camera permission requests cannot overlap and a granted request does not offer Settings', async () => {
  const env = setup();
  let finish;
  let requests = 0;
  const permission = new Promise(resolve => { finish = resolve; });
  const tree = await env.mount(gatePath, { onRequest: () => { requests++; return permission; } });
  try {
    let pending;
    await act(async () => {
      const press = button(tree).props.onPress;
      pending = press();
      await press();
    });
    assert.equal(requests, 1);
    assert.equal(button(tree).props.disabled, true);
    assert.deepEqual(button(tree).props.accessibilityState, { disabled: true, busy: true });
    assert.equal(tree.root.findAllByType('ActivityIndicator').length, 1);
    await act(async () => { finish(true); await pending; });
    assert.equal(button(tree).props.disabled, false);
    assert.equal(button(tree).props.accessibilityLabel, 'scan_perm_btn');
    assert.equal(tree.root.findAllByProps({ accessibilityRole: 'alert' }).length, 0);
  } finally { finish(true); act(() => tree.unmount()); }
});

test('permission and Settings failures are shown inline and actions remain retryable', async () => {
  const env = setup();
  let failRequest = true;
  let failSettings = true;
  env.mocks['react-native'].Linking = { openSettings: async () => {
    if (failSettings) throw new Error('settings unavailable');
  } };
  const tree = await env.mount(gatePath, { onRequest: async () => {
    if (failRequest) throw new Error('permission service failed');
    return false;
  } });
  try {
    await act(async () => { await button(tree).props.onPress(); });
    assert.equal(textContent(tree.root.findByProps({ accessibilityRole: 'alert' })), 'scan_perm_error');
    assert.equal(button(tree).props.disabled, false);
    assert.equal(button(tree).props.accessibilityLabel, 'scan_perm_btn');
    failRequest = false;
    await act(async () => { await button(tree).props.onPress(); });
    assert.equal(tree.root.findAllByProps({ accessibilityRole: 'alert' }).length, 0);
    await act(async () => { await button(tree).props.onPress(); });
    assert.equal(textContent(tree.root.findByProps({ accessibilityRole: 'alert' })), 'scan_perm_error');
    assert.equal(button(tree).props.accessibilityLabel, 'scan_perm_settings_btn');
    failSettings = false;
    await act(async () => { await button(tree).props.onPress(); });
    assert.equal(tree.root.findAllByProps({ accessibilityRole: 'alert' }).length, 0);
  } finally { act(() => tree.unmount()); }
});
