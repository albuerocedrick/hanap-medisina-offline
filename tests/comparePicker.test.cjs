const test = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const { act } = require('react-test-renderer');
const { environment } = require('./helpers/renderApp.cjs');

const comparisonPath = 'app/(tabs)/library/comparison.tsx';
const textContent = node => typeof node === 'string' ? node : node?.children?.map(textContent).join('') ?? '';
const flatten = style => Array.isArray(style) ? Object.assign({}, ...style.map(flatten)) : style ?? {};
const control = (tree, label) => tree.root.findAllByType('TouchableOpacity')
  .find(node => node.props.accessibilityLabel === label || textContent(node) === label);
const input = tree => tree.root.findByType('TextInput');
const choices = tree => tree.root.findByType('FlatList').props.data.map(plant => plant.id);
const press = async node => { assert.ok(node, 'expected an actionable control'); await act(async () => node.props.onPress()); };
const close = tree => act(() => tree.unmount());

function setup(mode = 'light') {
  const env = environment();
  const tokens = env.load('src/theme/tokens.ts');
  const theme = { ...(mode === 'dark' ? tokens.darkTheme : tokens.lightTheme), isDark: mode === 'dark' };
  env.mocks['@/src/theme/useTheme'] = { useTheme: () => theme };
  // The harness leaves native Modal rendering to each test that needs it.
  env.mocks['react-native'].Modal = ({ visible, children, ...props }) => visible ? React.createElement('Modal', props, children) : null;
  const store = env.load('src/store/useLibraryStore.ts').useLibraryStore;
  const t = env.load('src/i18n/en.ts').default;
  env.state.params = { plantAId: 'oregano', pickMode: 'true' };
  return { env, store, t, theme };
}

test('comparison searches immediately, supports scientific names and clears without changing Library filters', async () => {
  const { env, store, t } = setup();
  store.setState({ searchQuery: 'Oregano', activeCategory: 'hidden-category', activeSymptom: 'hidden-symptom', showFavoritesOnly: true });
  const tree = await env.mount(comparisonPath);
  try {
    const allChoices = store.getState().plants.filter(plant => plant.id !== 'oregano').map(plant => plant.id);
    assert.deepEqual(choices(tree), allChoices);
    await act(async () => input(tree).props.onChangeText('Lagundi'));
    assert.deepEqual(choices(tree), ['lagundi']);
    await act(async () => input(tree).props.onChangeText('Vitex negundo'));
    assert.deepEqual(choices(tree), ['lagundi']);
    await act(async () => input(tree).props.onChangeText('Sambong'));
    assert.deepEqual(choices(tree), ['sambong']);
    await act(async () => input(tree).props.onChangeText('zzzz-no-such-plant'));
    assert.deepEqual(choices(tree), []);
    assert.ok(tree.root.findAllByType('Text').some(node => textContent(node) === t.lib_no_match_title));
    await press(control(tree, t.home_search_clear));
    assert.equal(input(tree).props.value, '');
    assert.deepEqual(choices(tree), allChoices);
    assert.equal(store.getState().searchQuery, 'Oregano');
    assert.equal(store.getState().activeCategory, 'hidden-category');
    assert.equal(store.getState().activeSymptom, 'hidden-symptom');
    assert.equal(store.getState().showFavoritesOnly, true);
  } finally { close(tree); }
});

test('comparison excludes the primary plant, selects a result with the keyboard open and resets when changing plants', async () => {
  const { env, t } = setup();
  const tree = await env.mount(comparisonPath);
  try {
    await act(async () => input(tree).props.onChangeText('Oregano'));
    assert.deepEqual(choices(tree), []);
    await act(async () => input(tree).props.onChangeText('Lagundi'));
    assert.equal(tree.root.findByType('FlatList').props.keyboardShouldPersistTaps, 'handled');
    await press(control(tree, 'Lagundi'));
    assert.equal(tree.root.findAllByType('Modal').length, 0);
    assert.ok(tree.root.findAllByType('Text').some(node => textContent(node) === 'Oregano (Cuban Oregano) vs Lagundi'));
    assert.ok(env.state.keyboardDismisses > 0);
    await press(control(tree, t.compare_change));
    assert.equal(input(tree).props.value, '');
    assert.ok(choices(tree).includes('sambong'));
    await act(async () => tree.root.findByType('Modal').props.onRequestClose());
    assert.equal(tree.root.findAllByType('Modal').length, 0);
    assert.deepEqual(env.state.routes, []);
    assert.deepEqual(env.state.replacements, []);
  } finally { close(tree); }
});

test('comparison initial picker back exits safely and missing primary data shows a recovery message', async () => {
  const { env, t } = setup();
  env.state.params = { pickMode: 'true' };
  const tree = await env.mount(comparisonPath);
  try {
    await act(async () => tree.root.findByType('Modal').props.onRequestClose());
    assert.deepEqual(env.state.replacements, ['/(tabs)/library']);
    assert.equal(tree.root.findAllByType('ActivityIndicator').length, 0);
    assert.ok(tree.root.findAllByType('Text').some(node => textContent(node) === t.compare_primary_missing));
  } finally { close(tree); }
});

for (const mode of ['light', 'dark']) {
  test(`${mode} comparison selection uses matching theme colors and clear search controls`, async () => {
    const { env, t, theme } = setup(mode);
    const tab = await env.mount('src/components/plant-details/compare-tab.tsx', {
      currentPlantId: 'oregano', currentPlantName: 'Oregano', lookAlikePlants: [],
    });
    const picker = await env.mount(comparisonPath);
    try {
      const action = control(tab, t.details_compare_btn);
      const label = action.findByType('Text');
      const surface = label.parent;
      assert.equal(flatten(surface.props.style).backgroundColor, theme.selectionSurface);
      assert.equal(flatten(label.props.style).color, theme.selectionText);
      await press(action);
      assert.equal(env.state.routes.at(-1).pathname, '/(tabs)/library/comparison');
      assert.equal(flatten(input(picker).props.style).color, theme.textPrimary);
      assert.equal(input(picker).props.placeholderTextColor, theme.textSecondary);
      assert.equal(flatten(input(picker).parent.props.style).backgroundColor, theme.surfaceTint);
      await act(async () => input(picker).props.onChangeText('Lagundi'));
      assert.equal(control(picker, t.home_search_clear).findByType('Ionicons').props.color, theme.accent);
    } finally { close(tab); close(picker); }
  });
}
