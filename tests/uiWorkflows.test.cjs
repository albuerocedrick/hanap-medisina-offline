const test = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const { act } = require('react-test-renderer');
const { environment } = require('./helpers/renderApp.cjs');

const textContent = node => typeof node === 'string' || typeof node === 'number' ? String(node)
  : node?.children?.map(textContent).join('') ?? '';
const hasText = (tree, text) => tree.root.findAllByType('Text').some(node => textContent(node) === text);
const button = (tree, label) => tree.root.findAll(node => ['Pressable', 'TouchableOpacity'].includes(node.type)
  && (node.props.accessibilityLabel === label || textContent(node) === label))[0];
const press = async node => { assert.ok(node, 'expected an actionable control'); await act(async () => { await node.props.onPress(); }); };
const close = tree => act(() => tree.unmount());
const libraryPath = 'app/(tabs)/library/index.tsx';
const historyPath = 'app/(tabs)/history/index.tsx';
const profilePath = 'app/(tabs)/profile.tsx';
const english = env => env.load('src/i18n/en.ts').default;
const library = env => env.load('src/store/useLibraryStore.ts').useLibraryStore;
const history = env => env.load('src/store/useHistoryStore.ts').useHistoryStore;
const profile = env => env.load('src/store/useProfileStore.ts').useProfileStore;
const renderedPlantIds = tree => tree.root.findByType('FlatList').props.data.flat().map(plant => plant.id);
const scan = (id, date, favorite = false) => ({ id, imageUri: `file:///documents/${id}.jpg`, plantId: 'lagundi', plantName: 'Lagundi', confidence: 0.9, scannedAt: date, isFavorite: favorite });
const scans = () => [scan('older', '2026-10-13T00:00:00Z'), scan('newer', '2026-10-15T00:00:00Z', true)];
const component = (env, filename, name) => {
  const value = env.load(filename)[name];
  return value.type ?? value;
};

test('onboarding next/back preserves progress and final start completes the persisted flow', async () => {
  const env = environment();
  const t = english(env);
  const store = env.load('src/store/useOnboardingStore.ts').useOnboardingStore;
  const tree = await env.mount('src/components/onboarding/Onboarding.tsx');
  try {
    assert.ok(hasText(tree, t.onboard_welcome));
    assert.equal(button(tree, t.onboard_back), undefined);
    await press(button(tree, t.onboard_next));
    assert.ok(hasText(tree, t.onboard_prepare));
    await press(button(tree, t.onboard_back));
    assert.ok(hasText(tree, t.onboard_welcome));
    await press(button(tree, t.onboard_next));
    await press(button(tree, t.onboard_next));
    assert.ok(hasText(tree, t.onboard_capture));
    assert.equal(store.getState().completed, false);
    await press(button(tree, t.onboard_start));
    assert.equal(store.getState().completed, true);
    assert.equal(JSON.parse(env.memory.get('hanap-medisina-onboarding-v1')).state.completed, true);
  } finally { close(tree); }
});

test('onboarding skip completes immediately and replay allows a fresh welcome sequence', async () => {
  const env = environment();
  const t = english(env);
  const store = env.load('src/store/useOnboardingStore.ts').useOnboardingStore;
  let tree = await env.mount('src/components/onboarding/Onboarding.tsx');
  try {
    await press(button(tree, t.onboard_skip));
    assert.equal(store.getState().completed, true);
    close(tree);
    await act(async () => store.getState().replay());
    tree = await env.mount('src/components/onboarding/Onboarding.tsx');
    assert.equal(store.getState().completed, false);
    assert.ok(hasText(tree, t.onboard_welcome));
  } finally { close(tree); }
});

test('profile editing rejects blank names and unchanged values, then saves trimmed valid input', async () => {
  const env = environment();
  const t = english(env);
  const saved = [];
  let closed = 0;
  const tree = await env.mount('src/components/profile/edit-profile-modal.tsx', {
    visible: true, currentFirstName: 'Ana', currentLastName: 'Santos', onSave: (...values) => saved.push(values), onClose: () => { closed++; },
  });
  try {
    assert.equal(button(tree, t.profile_save_changes).props.disabled, true);
    await act(async () => tree.root.findAllByType('TextInput')[0].props.onChangeText('   '));
    assert.ok(hasText(tree, t.profile_name_required));
    await press(button(tree, t.profile_save_changes));
    assert.deepEqual(saved, []);
    assert.equal(closed, 0);
    await act(async () => {
      tree.root.findAllByType('TextInput')[0].props.onChangeText('  Maria  ');
      tree.root.findAllByType('TextInput')[1].props.onChangeText('   ');
    });
    assert.equal(button(tree, t.profile_save_changes).props.disabled, false);
    await press(button(tree, t.profile_save_changes));
    assert.deepEqual(saved, [['Maria', '']]);
    assert.equal(closed, 1);
  } finally { close(tree); }
});

test('canceling profile edits leaves the real profile intact and reopening discards the draft', async () => {
  const env = environment();
  const t = english(env);
  const store = profile(env);
  const tree = await env.mount(profilePath);
  const Edit = component(env, 'src/components/profile/edit-profile-modal.tsx', 'EditProfileModal');
  try {
    await press(button(tree, t.profile_edit));
    await act(async () => tree.root.findAllByType('TextInput')[0].props.onChangeText('Unsaved'));
    await act(async () => tree.root.findByType(Edit).props.onClose());
    assert.equal(store.getState().firstName, 'Plant');
    await press(button(tree, t.profile_edit));
    assert.equal(tree.root.findAllByType('TextInput')[0].props.value, 'Plant');
    await act(async () => tree.root.findAllByType('TextInput')[0].props.onChangeText('Ana'));
    await press(button(tree, t.profile_save_changes));
    assert.equal(store.getState().firstName, 'Ana');
    assert.ok(hasText(tree, 'Ana Explorer'));
    assert.equal(tree.root.findByType(Edit).props.visible, false);
  } finally { close(tree); }
});

test('language sheet selects only changed languages, closes for the current choice, and tolerates failed haptics', async () => {
  const env = environment();
  const selected = [];
  let closed = 0;
  const tree = await env.mount('src/components/ui/LanguageSheet.tsx', { visible: true, current: 'en', onSelect: value => selected.push(value), onClose: () => { closed++; } });
  try {
    const radios = () => tree.root.findAllByType('Pressable').filter(node => node.props.accessibilityRole === 'radio');
    assert.deepEqual(radios().map(node => node.props.accessibilityState.checked), [true, false]);
    await press(button(tree, 'English'));
    assert.deepEqual(selected, []);
    assert.equal(closed, 1);
    env.state.hapticsError = new Error('haptics unavailable');
    await press(button(tree, 'Tagalog'));
    assert.deepEqual(selected, ['tl']);
    assert.equal(closed, 2);
    assert.equal(env.state.haptics, 1);
  } finally { close(tree); }
});

test('profile language choice updates real settings, translated text and the persisted language', async () => {
  const env = environment();
  const t = english(env);
  const tree = await env.mount(profilePath);
  try {
    await press(button(tree, `${t.profile_language}: English`));
    await press(button(tree, 'Tagalog'));
    const store = env.load('src/store/useSettingsStore.ts').useSettingsStore;
    assert.equal(store.getState().language, 'tl');
    const tl = env.load('src/i18n/tl.ts').default;
    assert.ok(hasText(tree, tl.profile_title));
    assert.equal(JSON.parse(env.memory.get('hanap-medisina-settings')).state.language, 'tl');
    assert.equal(tree.root.findAllByType('Sheet').length, 0);
  } finally { close(tree); }
});

test('profile reset requires confirmation; cancellation retains data and confirmation restores defaults', async () => {
  const env = environment();
  const t = english(env);
  const store = profile(env);
  await store.persist.rehydrate();
  store.getState().updateProfile({ firstName: 'Ana', lastName: 'Santos', avatarUri: 'file:///avatar.jpg' });
  const tree = await env.mount(profilePath);
  try {
    await press(button(tree, t.profile_reset));
    await press(button(tree, t.cancel));
    assert.equal(store.getState().firstName, 'Ana');
    await press(button(tree, t.profile_reset));
    await press(button(tree, t.profile_reset_confirm));
    assert.equal(store.getState().firstName, 'Plant');
    assert.equal(store.getState().lastName, 'Explorer');
    assert.equal(store.getState().avatarUri, null);
  } finally { close(tree); }
});

async function pickAvatar(env, tree) {
  const Avatar = component(env, 'src/components/profile/profile-avatar.tsx', 'ProfileAvatar');
  await act(async () => { await tree.root.findByType(Avatar).props.onEditPress(); });
}

test('avatar permission denied and picker canceled never copy or overwrite the saved photo', async () => {
  const env = environment();
  const store = profile(env);
  await store.persist.rehydrate();
  store.getState().setAvatar('file:///original.jpg');
  const tree = await env.mount(profilePath);
  try {
    env.state.permission = 'denied';
    await pickAvatar(env, tree);
    assert.equal(env.state.pickerCalls, 0);
    assert.equal(env.state.alerts.length, 1);
    env.state.permission = 'granted';
    await pickAvatar(env, tree);
    assert.equal(env.state.pickerCalls, 1);
    assert.deepEqual(env.state.copies, []);
    assert.equal(store.getState().avatarUri, 'file:///original.jpg');
  } finally { close(tree); }
});

test('avatar copy failure keeps the old image and a later successful copy updates the profile', async () => {
  const env = environment();
  const store = profile(env);
  await store.persist.rehydrate();
  store.getState().setAvatar('file:///original.jpg');
  env.state.picker = { canceled: false, assets: [{ uri: 'content://new-image', fileName: 'new.jpg' }] };
  env.state.copyError = new Error('disk full');
  const tree = await env.mount(profilePath);
  try {
    await pickAvatar(env, tree);
    assert.equal(store.getState().avatarUri, 'file:///original.jpg');
    assert.equal(env.state.alerts.length, 1);
    env.state.copyError = null;
    await pickAvatar(env, tree);
    assert.equal(store.getState().avatarUri, 'file:///documents/profile/new.jpg');
    assert.deepEqual(env.state.copies.at(-1), { from: 'content://new-image', to: 'file:///documents/profile/new.jpg' });
  } finally { close(tree); }
});

for (const failure of ['permissionError', 'pickerError']) {
  test(`avatar ${failure} displays recovery and preserves the saved photo`, async () => {
    const env = environment();
    const store = profile(env);
    await store.persist.rehydrate();
    store.getState().setAvatar('file:///original.jpg');
    env.state[failure] = new Error('native photo picker unavailable');
    const tree = await env.mount(profilePath);
    try {
      await assert.doesNotReject(pickAvatar(env, tree));
      assert.equal(store.getState().avatarUri, 'file:///original.jpg');
      assert.equal(env.state.alerts.length, 1);
      assert.deepEqual(env.state.copies, []);
    } finally { close(tree); }
  });
}

test('rapid avatar edit taps open one native picker and release the guard after cancellation', async () => {
  const env = environment();
  let releasePermission;
  const permission = new Promise(resolve => { releasePermission = resolve; });
  env.mocks['expo-image-picker'].requestMediaLibraryPermissionsAsync = async () => {
    env.state.permissionCalls++;
    await permission;
    return { status: 'granted' };
  };
  const tree = await env.mount(profilePath);
  const Avatar = component(env, 'src/components/profile/profile-avatar.tsx', 'ProfileAvatar');
  try {
    let first;
    let second;
    act(() => {
      const pick = tree.root.findByType(Avatar).props.onEditPress;
      first = pick();
      second = pick();
    });
    assert.equal(env.state.permissionCalls, 1);
    await act(async () => { releasePermission(); await Promise.all([first, second]); });
    assert.equal(env.state.pickerCalls, 1);
    await pickAvatar(env, tree);
    assert.equal(env.state.permissionCalls, 2);
    assert.equal(env.state.pickerCalls, 2);
  } finally { releasePermission(); close(tree); }
});

test('library real search clears hidden category filters, returns matching cards, and cancel restores all plants', async () => {
  const env = environment();
  const t = english(env);
  const store = library(env);
  const tree = await env.mount(libraryPath);
  try {
    const catalog = store.getState().plants;
    const category = catalog[0].categories[0];
    await act(async () => store.getState().setActiveCategory(category));
    assert.deepEqual(renderedPlantIds(tree), catalog.filter(plant => plant.categories.includes(category)).map(plant => plant.id));
    await act(async () => tree.root.findByType('TextInput').props.onFocus());
    assert.equal(hasText(tree, t.lib_title), false);
    assert.equal(tree.root.findAll(node => node.props.accessibilityRole === 'menu').length, 0);
    await act(async () => tree.root.findByType('TextInput').props.onChangeText('Lagundi'));
    await act(async () => tree.root.findByType('TextInput').props.onSubmitEditing());
    assert.equal(store.getState().activeCategory, null);
    assert.ok(renderedPlantIds(tree).includes('lagundi'));
    assert.equal(renderedPlantIds(tree).length, 1);
    await press(button(tree, t.lib_cancel));
    assert.equal(store.getState().searchQuery, '');
    assert.equal(tree.root.findByType('TextInput').props.value, '');
    assert.deepEqual(renderedPlantIds(tree), catalog.map(plant => plant.id));
    assert.ok(hasText(tree, t.lib_title));
  } finally { close(tree); }
});

test('search commits only the latest debounced text and cancels pending updates when cleared or unmounted', async context => {
  context.mock.timers.enable({ apis: ['setTimeout'] });
  const env = environment();
  const store = library(env);
  const committed = [];
  const tree = await env.mount('src/components/library/search-bar.tsx', { debounceMs: 320, onSearch: value => committed.push(value) });
  let mounted = true;
  try {
    const input = () => tree.root.findByType('TextInput');
    await act(async () => input().props.onChangeText('Lag'));
    await act(async () => context.mock.timers.tick(200));
    assert.equal(store.getState().searchQuery, '');
    await act(async () => input().props.onChangeText('Lagundi'));
    await act(async () => context.mock.timers.tick(319));
    assert.equal(store.getState().searchQuery, '');
    await act(async () => context.mock.timers.tick(1));
    assert.equal(store.getState().searchQuery, 'Lagundi');
    assert.deepEqual(committed, ['Lagundi']);
    await act(async () => input().props.onChangeText('Sambong'));
    await press(button(tree, english(env).lib_cancel));
    await act(async () => context.mock.timers.tick(400));
    assert.equal(store.getState().searchQuery, '');
    assert.deepEqual(committed, ['Lagundi', '']);
    await act(async () => input().props.onChangeText('Oregano'));
    close(tree);
    mounted = false;
    await act(async () => context.mock.timers.tick(400));
    assert.equal(store.getState().searchQuery, '');
    assert.deepEqual(committed, ['Lagundi', '']);
  } finally { if (mounted) close(tree); context.mock.timers.reset(); }
});

test('library category pills update selected state and All restores the full catalog', async () => {
  const env = environment();
  const t = english(env);
  const store = library(env);
  const tree = await env.mount(libraryPath);
  try {
    const pills = () => tree.root.findAllByType('TouchableOpacity').filter(node => node.props.accessibilityLabel?.startsWith(t.a11y_filter.split('{label}')[0]));
    assert.ok(pills().length > 1);
    await press(pills()[1]);
    assert.equal(pills()[1].props.accessibilityState.selected, true);
    assert.ok(renderedPlantIds(tree).length < store.getState().plants.length);
    assert.ok(tree.root.findByType('FlatList').props.data.flat().every(plant => plant.categories.includes(store.getState().activeCategory)));
    await press(pills()[0]);
    assert.equal(store.getState().activeCategory, null);
    assert.equal(renderedPlantIds(tree).length, store.getState().plants.length);
  } finally { close(tree); }
});

test('library list/grid keeps order and an odd last grid row without dropping plants; cards navigate to details', async () => {
  const env = environment();
  const t = english(env);
  const store = library(env);
  const tree = await env.mount(libraryPath);
  try {
    const ids = renderedPlantIds(tree);
    const first = store.getState().plants[0];
    await press(button(tree, first.name));
    assert.equal(env.state.routes.at(-1), `/(tabs)/library/${first.id}`);
    await press(button(tree, t.a11y_grid_view));
    assert.equal(store.getState().viewMode, 'grid');
    assert.deepEqual(renderedPlantIds(tree), ids);
    const oddSample = store.getState().plants.slice(0, 3);
    await act(async () => store.setState({ plants: oddSample }));
    assert.deepEqual(renderedPlantIds(tree), oddSample.map(plant => plant.id));
    assert.equal(tree.root.findByType('FlatList').props.data.at(-1).length, 1);
    await press(button(tree, t.a11y_list_view));
    assert.equal(store.getState().viewMode, 'list');
    assert.deepEqual(renderedPlantIds(tree), oddSample.map(plant => plant.id));
  } finally { close(tree); }
});

test('library favorites-only updates reactively when saved plants are added and removed', async () => {
  const env = environment();
  const t = english(env);
  const store = library(env);
  await store.getState().loadFavorites();
  const tree = await env.mount(libraryPath);
  try {
    const plant = store.getState().plants[0];
    await press(button(tree, t.a11y_show_favorites));
    assert.deepEqual(renderedPlantIds(tree), []);
    await act(async () => store.getState().toggleFavorite(plant));
    assert.deepEqual(renderedPlantIds(tree), [plant.id]);
    await act(async () => store.getState().toggleFavorite(plant));
    assert.deepEqual(renderedPlantIds(tree), []);
    await press(button(tree, t.a11y_show_all_plants));
    assert.equal(renderedPlantIds(tree).length, store.getState().plants.length);
  } finally { close(tree); }
});

test('library empty search, loading, error/retry and pull-to-refresh recover to the bundled catalog', async () => {
  const env = environment();
  const t = english(env);
  const store = library(env);
  const tree = await env.mount(libraryPath);
  try {
    await act(async () => store.getState().setSearchQuery('zzzz-no-such-plant'));
    assert.ok(hasText(tree, t.lib_no_match_title));
    await act(async () => store.setState({ searchQuery: '', plants: [], isLoadingPlants: true }));
    assert.ok(hasText(tree, t.lib_loading));
    await act(async () => store.setState({ isLoadingPlants: false, plantsError: new Error('catalog failed') }));
    assert.ok(hasText(tree, 'catalog failed'));
    await press(button(tree, t.lib_try_again));
    assert.ok(renderedPlantIds(tree).length > 0);
    assert.equal(store.getState().plantsError, null);
    await act(async () => store.setState({ plantsError: new Error('stale error') }));
    await act(async () => tree.root.findByType('FlatList').props.refreshControl.props.onRefresh());
    assert.equal(store.getState().plantsError, null);
    assert.ok(renderedPlantIds(tree).length > 0);
  } finally { close(tree); }
});

test('library scan route parameter opens its scan sheet and closing clears the selection', async () => {
  const env = environment();
  env.state.params = { scanId: 'scan-route' };
  const tree = await env.mount(libraryPath);
  try {
    assert.equal(tree.root.findByType('ScanDetailSheet').props.scanId, 'scan-route');
    assert.equal(tree.root.findByType('ScanDetailSheet').props.visible, true);
    await act(async () => tree.root.findByType('ScanDetailSheet').props.onClose());
    assert.equal(tree.root.findByType('ScanDetailSheet').props.visible, false);
  } finally { close(tree); }
});

test('plant details loads real bundled preparation/research/cultivation and opens comparison with the selected plant', async () => {
  const env = environment();
  env.state.params = { id: 'lagundi' };
  const t = english(env);
  const tree = await env.mount('app/(tabs)/library/[id].tsx');
  try {
    const plant = env.load('src/services/localLibrary.ts').getPlantById('lagundi');
    assert.ok(hasText(tree, plant.name));
    assert.equal(tree.root.findByType(component(env, 'src/components/plant-details/details-tab.tsx', 'DetailsTab')).props.details, plant.details);
    for (const [tab, exportName, filename, field] of [
      ['research', 'ResearchTab', 'research-tab.tsx', 'research'],
      ['cultivation', 'CultivationTab', 'cultivation-tab.tsx', 'cultivationGuide'],
    ]) {
      await press(button(tree, t[`details_tab_${tab}`]));
      assert.equal(tree.root.findByType(component(env, `src/components/plant-details/${filename}`, exportName)).props[field], plant[field]);
      assert.equal(button(tree, t[`details_tab_${tab}`]).props.accessibilityState.selected, true);
    }
    await press(button(tree, t.details_tab_compare));
    const compare = tree.root.findByType(component(env, 'src/components/plant-details/compare-tab.tsx', 'CompareTab'));
    assert.equal(compare.props.currentPlantId, 'lagundi');
    assert.deepEqual(compare.props.lookAlikePlants.map(item => item.id).sort(), plant.lookAlikeIds.slice().sort());
    if (compare.props.lookAlikePlants.length) {
      const target = compare.props.lookAlikePlants[0];
      await press(button(tree, t.compare_with.replace('{name}', target.name)));
      assert.deepEqual(env.state.routes.at(-1), { pathname: '/(tabs)/library/comparison', params: { plantAId: 'lagundi', plantBId: target.id } });
    }
    await press(button(tree, t.details_compare_btn));
    assert.deepEqual(env.state.routes.at(-1).params, { plantAId: 'lagundi', pickMode: 'true' });
  } finally { close(tree); }
});

test('plant detail favorites react to both direct taps and external store changes, and failed images show a fallback', async () => {
  const env = environment();
  env.state.params = { id: 'lagundi' };
  const t = english(env);
  const store = library(env);
  await store.getState().loadFavorites();
  const tree = await env.mount('app/(tabs)/library/[id].tsx');
  try {
    assert.equal(button(tree, t.a11y_add_favorite).props.accessibilityState.selected, false);
    await press(button(tree, t.a11y_add_favorite));
    assert.equal(store.getState().favoriteIds.has('lagundi'), true);
    assert.equal(button(tree, t.a11y_remove_favorite).props.accessibilityState.selected, true);
    await act(async () => store.getState().replaceFavorites([]));
    assert.equal(button(tree, t.a11y_add_favorite).props.accessibilityState.selected, false);
    const image = () => tree.root.findAllByType('Image')[0];
    assert.ok(image().props.source.uri.startsWith('asset://'));
    await act(async () => image().props.onError());
    assert.equal(image().props.source, '../../../assets/images/plant-placeholder.jpg');
  } finally { close(tree); }
});

test('unknown plant details show a recovery message with a functioning cold-link back action', async () => {
  const env = environment();
  env.state.params = { id: 'not-a-real-plant' };
  const t = english(env);
  const tree = await env.mount('app/(tabs)/library/[id].tsx');
  try {
    assert.ok(hasText(tree, t.details_error_not_found));
    assert.equal(tree.root.findAllByType('ActivityIndicator').length, 0);
    await press(button(tree, t.a11y_back));
    assert.equal(env.state.replacements.at(-1), '/(tabs)/library');
    env.state.canGoBack = true;
    await press(button(tree, t.details_go_back));
    assert.equal(env.state.routes.at(-1), 'back');
  } finally { close(tree); }
});

async function historyEnvironment() {
  const env = environment();
  const store = history(env);
  await store.persist.rehydrate();
  store.setState({ scans: scans() });
  const tree = await env.mount(historyPath);
  return { env, store, tree, Header: component(env, 'src/components/history/history-header.tsx', 'HistoryHeader'),
    Card: component(env, 'src/components/history/history-card.tsx', 'HistoryCard'),
    Delete: component(env, 'src/components/ui/DeleteConfirmationModal.tsx', 'DeleteConfirmationModal') };
}

test('history changes sort/favorite tab/layout using real store data and opens the selected scan', async () => {
  const { env, store, tree, Header, Card } = await historyEnvironment();
  try {
    const ids = () => tree.root.findByType('FlatList').props.data.map(item => item.id);
    assert.deepEqual(ids(), ['newer', 'older']);
    await act(async () => tree.root.findByType(Header).props.onSortChange());
    assert.deepEqual(ids(), ['older', 'newer']);
    await act(async () => tree.root.findByType(Header).props.onTabChange('favorites'));
    assert.deepEqual(ids(), ['newer']);
    await act(async () => store.getState().toggleFavorite('older'));
    assert.deepEqual(ids(), ['older', 'newer']);
    const card = tree.root.findAllByType(Card)[0];
    const originalRAF = global.requestAnimationFrame;
    global.requestAnimationFrame = callback => callback();
    try { await act(async () => card.props.onPress(card.props.item)); }
    finally { global.requestAnimationFrame = originalRAF; }
    assert.equal(tree.root.findByType('ScanDetailSheet').props.scanId, 'older');
    await act(async () => tree.root.findByType('ScanDetailSheet').props.onClose());
    assert.equal(tree.root.findByType('ScanDetailSheet').props.visible, false);
    await act(async () => tree.root.findByType(Header).props.onViewModeChange());
    assert.equal(tree.root.findByType('FlatList').props.numColumns, 2);
    assert.equal(store.getState().viewMode, 'grid');
  } finally { close(tree); }
});

test('history long-press selects, canceling deletion retains scans, and canceling selection clears it', async () => {
  const { store, tree, Header, Card, Delete } = await historyEnvironment();
  try {
    await act(async () => { const card = tree.root.findAllByType(Card)[0]; card.props.onLongPress(card.props.item); });
    assert.equal(tree.root.findByType(Header).props.isSelecting, true);
    assert.equal(tree.root.findByType(Header).props.selectedCount, 1);
    await act(async () => tree.root.findByType(Header).props.onDeleteSelected());
    assert.equal(tree.root.findByType(Delete).props.visible, true);
    await act(async () => tree.root.findByType(Delete).props.onCancel());
    assert.equal(tree.root.findByType(Delete).props.visible, false);
    assert.equal(store.getState().scans.length, 2);
    assert.equal(tree.root.findByType(Header).props.selectedCount, 1);
    await act(async () => tree.root.findByType(Header).props.onCancelSelection());
    assert.equal(tree.root.findByType(Header).props.isSelecting, false);
    assert.equal(tree.root.findByType(Header).props.selectedCount, 0);
  } finally { close(tree); }
});

test('history batch delete retains only failed selections for a successful retry', async () => {
  const { env, store, tree, Header, Card, Delete } = await historyEnvironment();
  try {
    await act(async () => { const card = tree.root.findAllByType(Card)[0]; card.props.onLongPress(card.props.item); });
    await act(async () => tree.root.findAllByType(Card)[1].props.onToggleSelect('older'));
    assert.equal(tree.root.findByType(Header).props.selectedCount, 2);
    env.state.failedDeletes.add('file:///documents/older.jpg');
    await act(async () => tree.root.findByType(Header).props.onDeleteSelected());
    await act(async () => { await tree.root.findByType(Delete).props.onConfirm(); });
    assert.deepEqual(store.getState().scans.map(item => item.id), ['older']);
    assert.equal(tree.root.findByType(Header).props.selectedCount, 1);
    assert.equal(tree.root.findByType(Header).props.isSelecting, true);
    assert.equal(tree.root.findByType(Delete).props.visible, false);
    assert.equal(env.state.alerts.length, 1);
    env.state.failedDeletes.clear();
    await act(async () => tree.root.findByType(Header).props.onDeleteSelected());
    await act(async () => { await tree.root.findByType(Delete).props.onConfirm(); });
    assert.deepEqual(store.getState().scans, []);
    assert.equal(tree.root.findByType(Header).props.isSelecting, false);
    assert.equal(tree.root.findByType(Header).props.selectedCount, 0);
  } finally { close(tree); }
});

test('history single scan delete remains pending until confirmation and removes only that record', async () => {
  const { env, store, tree, Card, Delete } = await historyEnvironment();
  try {
    await act(async () => tree.root.findAllByType(Card)[0].props.onDelete('newer'));
    assert.equal(store.getState().scans.length, 2);
    assert.equal(tree.root.findByType(Delete).props.itemName, 'Lagundi');
    await act(async () => { await tree.root.findByType(Delete).props.onConfirm(); });
    assert.deepEqual(store.getState().scans.map(item => item.id), ['older']);
    assert.deepEqual(env.state.deletions, ['file:///documents/newer.jpg']);
  } finally { close(tree); }
});

test('delete confirmation prevents duplicate native deletion while busy and permits retry after a rejection', async () => {
  const env = environment();
  const t = english(env);
  let calls = 0;
  let reject;
  let succeeds = false;
  let canceled = 0;
  const tree = await env.mount('src/components/ui/DeleteConfirmationModal.tsx', {
    visible: true, itemName: 'Lagundi', onCancel: () => { canceled++; },
    onConfirm: () => { calls++; return succeeds ? Promise.resolve() : new Promise((_, rejectPromise) => { reject = rejectPromise; }); },
  });
  try {
    let pending;
    act(() => { pending = button(tree, t.history_delete).props.onPress(); });
    assert.equal(button(tree, t.history_delete).props.disabled, true);
    await act(async () => tree.root.findByType('Sheet').props.onClose());
    assert.equal(canceled, 0, 'sheet dismissal is blocked while deletion is pending');
    await act(async () => button(tree, t.history_delete).props.onPress());
    assert.equal(calls, 1);
    await act(async () => { reject(new Error('disk error')); await pending; });
    assert.ok(hasText(tree, t.history_delete_failed));
    assert.equal(button(tree, t.history_delete).props.disabled, false);
    succeeds = true;
    await press(button(tree, t.history_delete));
    assert.equal(calls, 2);
    assert.equal(hasText(tree, t.history_delete_failed), false);
  } finally { close(tree); }
});
