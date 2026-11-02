const test = require('node:test');
const assert = require('node:assert/strict');
const { act } = require('react-test-renderer');
const { environment } = require('./helpers/renderApp.cjs');

const profilePath = 'app/(tabs)/profile.tsx';
const sheetPath = 'src/components/profile/profile-photo-success-sheet.tsx';
const textContent = node => typeof node === 'string' || typeof node === 'number' ? String(node)
  : node?.children?.map(textContent).join('') ?? '';
const profile = env => env.load('src/store/useProfileStore.ts').useProfileStore;
const avatar = env => env.load('src/components/profile/profile-avatar.tsx').ProfileAvatar;
const close = tree => act(() => tree.unmount());

test('profile has no photo credits action or sheet', async () => {
  const env = environment();
  const tree = await env.mount(profilePath);
  try {
    const t = env.load('src/i18n/en.ts').default;
    const Menu = env.load('src/components/profile/profile-menu-item.tsx').ProfileMenuItem;
    assert.deepEqual(tree.root.findAllByType(Menu).map(node => node.props.label), [
      t.profile_edit, `${t.profile_language}: English`, t.onboard_replay, t.profile_reset,
    ]);
    assert.equal(tree.root.findAllByType('PhotoCreditsSheet').length, 0);
    assert.equal(tree.root.findAllByType('Sheet').length, 0);
  } finally { close(tree); }
});

test('profile success waits for the copied image, previews the saved URI, and dismisses without undoing it', async () => {
  const env = environment();
  const store = profile(env);
  await store.persist.rehydrate();
  store.getState().setAvatar('file:///original.jpg');
  env.state.picker = { canceled: false, assets: [{ uri: 'content://new-image', fileName: 'new.jpg' }] };
  let finishCopy;
  const copying = new Promise(resolve => { finishCopy = resolve; });
  env.mocks['expo-file-system'].copyAsync = async options => {
    env.state.copies.push(options);
    await copying;
  };
  const tree = await env.mount(profilePath);
  try {
    let pending;
    await act(async () => { pending = tree.root.findByType(avatar(env)).props.onEditPress(); });
    assert.equal(env.state.copies.length, 1);
    assert.equal(store.getState().avatarUri, 'file:///original.jpg');
    assert.equal(tree.root.findAllByType('Sheet').length, 0, 'cannot report success before the file has saved');
    await act(async () => { finishCopy(); await pending; });

    const t = env.load('src/i18n/en.ts').default;
    const savedUri = 'file:///documents/profile/new.jpg';
    const sheet = tree.root.findByType('Sheet');
    assert.equal(sheet.props.title, t.profile_photo_updated_title);
    assert.equal(store.getState().avatarUri, savedUri);
    assert.equal(tree.root.findByProps({ accessibilityLabel: t.profile_photo_preview }).props.source.uri, savedUri);
    assert.deepEqual(env.state.alerts, [], 'successful selection uses the themed sheet instead of a native alert');
    const done = tree.root.findAllByType('Pressable').find(node => textContent(node) === t.profile_photo_done);
    assert.equal(done.props.accessibilityRole, 'button');
    await act(async () => done.props.onPress());
    assert.equal(tree.root.findAllByType('Sheet').length, 0);
    assert.equal(store.getState().avatarUri, savedUri);
    assert.equal(JSON.parse(env.memory.get('hanapmedisina-offline-profile')).state.avatarUri, savedUri);

    await act(async () => { await tree.root.findByType(avatar(env)).props.onEditPress(); });
    await act(async () => tree.root.findByType('Sheet').props.onClose());
    assert.equal(tree.root.findAllByType('Sheet').length, 0, 'backdrop/back dismissal uses the same close callback');
  } finally { finishCopy(); close(tree); }
});

test('failed or canceled profile image selection never opens the success sheet and retry can succeed', async () => {
  const env = environment();
  const store = profile(env);
  await store.persist.rehydrate();
  store.getState().setAvatar('file:///original.jpg');
  const tree = await env.mount(profilePath);
  const pick = () => act(async () => { await tree.root.findByType(avatar(env)).props.onEditPress(); });
  try {
    await pick();
    assert.equal(tree.root.findAllByType('Sheet').length, 0);
    env.state.picker = { canceled: false, assets: [{ uri: 'content://new-image', fileName: 'new.jpg' }] };
    env.state.copyError = new Error('disk full');
    await pick();
    assert.equal(store.getState().avatarUri, 'file:///original.jpg');
    assert.equal(tree.root.findAllByType('Sheet').length, 0);
    assert.equal(env.state.alerts.length, 1);
    env.state.copyError = null;
    await pick();
    assert.equal(tree.root.findAllByType('Sheet').length, 1);
    assert.equal(env.state.alerts.length, 1);
  } finally { close(tree); }
});

for (const mode of ['light', 'dark']) {
  test(`profile photo success follows ${mode} theme with a readable action and translated preview`, async () => {
    const env = environment();
    const tokens = env.load('src/theme/tokens.ts')[`${mode}Theme`];
    env.mocks['@/src/theme/useTheme'] = { useTheme: () => ({ ...tokens, isDark: mode === 'dark' }) };
    env.load('src/store/useSettingsStore.ts').useSettingsStore.getState().setLanguage('tl');
    let dismissed = 0;
    const tree = await env.mount(sheetPath, { visible: true, avatarUri: 'file:///saved.jpg', onClose: () => { dismissed++; } });
    try {
      const t = env.load('src/i18n/tl.ts').default;
      assert.equal(tree.root.findByType('Sheet').props.title, t.profile_photo_updated_title);
      assert.equal(tree.root.findByProps({ accessibilityLabel: t.profile_photo_preview }).props.source.uri, 'file:///saved.jpg');
      const done = tree.root.findByType('Pressable');
      assert.equal(done.props.style({ pressed: false }).backgroundColor, tokens.accent);
      assert.equal(done.findByType('Text').props.style.color, tokens.textOnAccent);
      assert.ok(done.props.style({ pressed: false }).minHeight >= 48);
      assert.equal(textContent(done), t.profile_photo_done);
      await act(async () => done.props.onPress());
      assert.equal(dismissed, 1);
    } finally { close(tree); }
  });
}
