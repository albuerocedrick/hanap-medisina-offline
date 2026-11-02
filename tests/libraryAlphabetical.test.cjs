const test = require('node:test');
const assert = require('node:assert/strict');
const { act } = require('react-test-renderer');
const { environment } = require('./helpers/renderApp.cjs');

const libraryPath = 'app/(tabs)/library/index.tsx';
const expected = {
  en: 'aloe-vera alugbati banaba bayabas calamansi dila-dila gumamela guyabano insulin-plant kamaria kamias katakataka lagundi litlit madre-cacao makabuhay malunggay mango niyog-niyogan oregano pandan pansit-pansitan sambong serpentina suha tamarind tanglad tawa-tawa tsaang-gubat tuba-tuba'.split(' '),
  tl: 'alugbati banaba bayabas dila-dila gumamela guyabano insulin-plant calamansi kamaria kamias katakataka lagundi litlit madre-cacao makabuhay malunggay mango niyog-niyogan oregano pandan pansit-pansitan aloe-vera sambong tamarind serpentina suha tanglad tawa-tawa tsaang-gubat tuba-tuba'.split(' '),
};
const ids = plants => plants.map(plant => plant.id);
const rendered = tree => tree.root.findByType('FlatList').props.data.flat();
const button = (tree, label) => tree.root.findAllByType('TouchableOpacity')
  .find(node => node.props.accessibilityLabel === label);
const press = async node => {
  assert.ok(node, 'expected the requested Library control');
  await act(async () => node.props.onPress());
};

for (const language of ['en', 'tl']) {
  test(`${language} catalog is cached in display-name A–Z order without mutating bundled JSON`, () => {
    const bundled = require(`../src/data/plants_${language}.json`);
    const originalIds = ids(bundled);
    const originalRecords = [...bundled];
    const env = environment();
    const { getPlantCatalog } = env.load('src/services/plantCatalog.ts');
    const catalog = getPlantCatalog(language);
    assert.deepEqual(ids(catalog), expected[language]);
    assert.notStrictEqual(catalog, bundled);
    assert.deepEqual(ids(bundled), originalIds, 'sorting must not rewrite the shared JSON array');
    assert.ok(bundled.every((plant, index) => plant === originalRecords[index]));
    assert.strictEqual(getPlantCatalog(language), catalog, 'repeat reads reuse the language cache');
  });

  test(`${language} Library keeps list, grid, filters, favorites and cleared search in A–Z order`, async () => {
    const env = environment();
    const store = env.load('src/store/useLibraryStore.ts').useLibraryStore;
    const settings = env.load('src/store/useSettingsStore.ts').useSettingsStore;
    const stop = env.load('src/store/dataLanguageSync.ts').initializeDataLanguageSync();
    await act(async () => settings.getState().setLanguage(language));
    const t = env.load(`src/i18n/${language}.ts`).default;
    const tree = await env.mount(libraryPath);
    try {
      const catalog = store.getState().plants;
      const assertOrderedSubset = subset => assert.deepEqual(ids(subset), expected[language].filter(id => subset.some(plant => plant.id === id)));
      assert.deepEqual(ids(rendered(tree)), expected[language]);
      await press(button(tree, t.a11y_grid_view));
      assert.deepEqual(ids(rendered(tree)), expected[language]);

      const category = catalog.flatMap(plant => plant.categories)
        .find(value => catalog.filter(plant => plant.categories.includes(value)).length > 1);
      assert.ok(category, 'exercise a filter with multiple matching plants');
      await act(async () => store.getState().setActiveCategory(category));
      assert.deepEqual(ids(rendered(tree)), expected[language].filter(id => catalog.find(plant => plant.id === id).categories.includes(category)));
      await act(async () => store.getState().setActiveCategory(null));

      const favoriteIds = [expected[language].at(-1), expected[language][0], expected[language][9]];
      await act(async () => store.getState().replaceFavorites(favoriteIds));
      await press(button(tree, t.a11y_show_favorites));
      assert.deepEqual(ids(rendered(tree)), expected[language].filter(id => favoriteIds.includes(id)));
      await press(button(tree, t.a11y_show_all_plants));

      await act(async () => tree.root.findByType('TextInput').props.onChangeText('ma'));
      await act(async () => tree.root.findByType('TextInput').props.onSubmitEditing());
      const matches = rendered(tree);
      assert.ok(matches.length > 1, 'exercise a search with several plant-name matches');
      assert.ok(matches.length < catalog.length, 'search must still filter the catalog');
      assertOrderedSubset(matches);
      await press(button(tree, t.home_search_clear));
      assert.equal(store.getState().searchQuery, '');
      assert.deepEqual(ids(rendered(tree)), expected[language]);
      await press(button(tree, t.a11y_list_view));
      assert.deepEqual(ids(rendered(tree)), expected[language]);
    } finally {
      act(() => tree.unmount());
      stop();
    }
  });
}

test('Library search stays alphabetical when an exact name would otherwise outrank an earlier partial match', async () => {
  const env = environment();
  const store = env.load('src/store/useLibraryStore.ts').useLibraryStore;
  const tree = await env.mount(libraryPath);
  try {
    const base = store.getState().plants[0];
    const plants = [
      { ...base, id: 'test-mint', name: 'Mint', scientificName: 'Testus primus', details: { ...base.details, localName: '' } },
      { ...base, id: 'test-yellow', name: 'Yellow Mint', scientificName: 'Testus secundus', details: { ...base.details, localName: '' } },
      { ...base, id: 'test-apple', name: 'apple mint', scientificName: 'Testus tertius', details: { ...base.details, localName: '' } },
    ];
    await act(async () => store.setState({ plants }));
    const { searchPlantNames } = env.load('src/services/plantSearch.ts');
    assert.equal(searchPlantNames(plants, 'mint')[0].id, 'test-mint', 'fixture exercises exact-name relevance');
    await act(async () => tree.root.findByType('TextInput').props.onChangeText('mint'));
    await act(async () => tree.root.findByType('TextInput').props.onSubmitEditing());
    assert.deepEqual(ids(rendered(tree)), ['test-apple', 'test-mint', 'test-yellow']);
    assert.deepEqual(ids(plants), ['test-mint', 'test-yellow', 'test-apple'], 'display sorting leaves its input intact');
  } finally { act(() => tree.unmount()); }
});

test('catalog ordering ignores display-name capitalization and selector sorting preserves memoization', async () => {
  const env = environment();
  const sample = ['zebra', 'Banana', 'apple', 'Apricot'].map((name, index) => ({ id: `sample-${index}`, name }));
  env.mocks['../data/plants_en.json'] = sample;
  const { getPlantCatalog } = env.load('src/services/plantCatalog.ts');
  assert.deepEqual(getPlantCatalog('en').map(plant => plant.name), ['apple', 'Apricot', 'Banana', 'zebra']);
  assert.deepEqual(sample.map(plant => plant.name), ['zebra', 'Banana', 'apple', 'Apricot']);

  const actual = environment();
  const { useLibraryStore: store, selectDisplayedPlants } = actual.load('src/store/useLibraryStore.ts');
  await store.persist.rehydrate();
  store.getState().setSearchQuery('a');
  const before = selectDisplayedPlants(store.getState());
  store.getState().setViewMode('grid');
  assert.strictEqual(selectDisplayedPlants(store.getState()), before);
  await store.getState().replaceFavorites(['mango']);
  assert.strictEqual(selectDisplayedPlants(store.getState()), before);
  store.getState().setShowFavoritesOnly(true);
  assert.notStrictEqual(selectDisplayedPlants(store.getState()), before);
  assert.deepEqual(ids(selectDisplayedPlants(store.getState())), ['mango']);
});
