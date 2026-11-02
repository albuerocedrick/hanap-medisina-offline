const test = require('node:test');
const assert = require('node:assert/strict');
const { act } = require('react-test-renderer');
const { environment } = require('./helpers/renderApp.cjs');

const ids = tree => tree.root.findByType('FlatList').props.data.flat().map(plant => plant.id);
const clearButton = (tree, label) => tree.root.findAllByType('TouchableOpacity')
  .find(node => node.props.accessibilityLabel === label);

test('library X remains available while typing and cancels pending search before restoring the catalog', async context => {
  context.mock.timers.enable({ apis: ['setTimeout'] });
  const env = environment();
  const store = env.load('src/store/useLibraryStore.ts').useLibraryStore;
  const t = env.load('src/i18n/en.ts').default;
  const tree = await env.mount('app/(tabs)/library/index.tsx');
  try {
    const catalogIds = store.getState().plants.map(plant => plant.id);
    await act(async () => tree.root.findByType('TextInput').props.onFocus());
    await act(async () => tree.root.findByType('TextInput').props.onChangeText('Lagundi'));
    assert.ok(tree.root.findAllByType('ActivityIndicator').length > 0);
    const clear = clearButton(tree, t.home_search_clear);
    assert.ok(clear, 'clear remains visible while search is pending');
    await act(async () => clear.props.onPress());
    await act(async () => context.mock.timers.tick(500));
    assert.equal(tree.root.findByType('TextInput').props.value, '');
    assert.equal(store.getState().searchQuery, '');
    assert.deepEqual(ids(tree), catalogIds);
    assert.equal(clearButton(tree, t.home_search_clear), undefined);
    assert.equal(env.state.keyboardDismisses, 1);
  } finally {
    act(() => tree.unmount());
    context.mock.timers.reset();
  }
});

test('library X clears submitted matches and no-match searches after the keyboard closes', async () => {
  const env = environment();
  const store = env.load('src/store/useLibraryStore.ts').useLibraryStore;
  const t = env.load('src/i18n/en.ts').default;
  const tree = await env.mount('app/(tabs)/library/index.tsx');
  try {
    const catalogIds = store.getState().plants.map(plant => plant.id);
    for (const query of ['Lagundi', 'no-such-plant-98765']) {
      await act(async () => tree.root.findByType('TextInput').props.onChangeText(query));
      await act(async () => tree.root.findByType('TextInput').props.onSubmitEditing());
      assert.equal(store.getState().searchQuery, query);
      assert.equal(ids(tree).length, query === 'Lagundi' ? 1 : 0);
      await act(async () => clearButton(tree, t.home_search_clear).props.onPress());
      assert.equal(tree.root.findByType('TextInput').props.value, '');
      assert.deepEqual(ids(tree), catalogIds);
    }
  } finally { act(() => tree.unmount()); }
});
