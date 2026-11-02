const test = require('node:test');
const assert = require('node:assert/strict');
const { act } = require('react-test-renderer');
const { environment } = require('./helpers/renderApp.cjs');

const ids = rows => rows.map(row => row.id).sort();
const illnessIds = ['eczema', 'arthritis', 'common-cold', 'diabetes', 'hypertension', 'asthma', 'bronchitis',
  'flu', 'dengue', 'ringworm', 'intestinal-worms', 'gout', 'acne', 'boils-abscesses', 'scabies', 'mumps',
  'rheumatism', 'scurvy', 'skin-ulcers', 'urinary-tract-infection', 'malaria', 'stomach-ulcers',
  'athletes-foot', 'anemia', 'wound-infection'].sort();

for (const language of ['en', 'tl']) test(`${language} illness browsing excludes raw symptoms, injuries and wellness claims, and counts the exact linked plants`, async () => {
  const env = environment();
  env.load('src/store/useSettingsStore.ts').useSettingsStore.getState().setLanguage(language);
  const library = env.load('src/services/localLibrary.ts');
  const { getIllnessLabel } = env.load('src/services/illnessCatalog.ts');
  const { useLibraryStore: store } = env.load('src/store/useLibraryStore.ts');
  const cards = library.getAllIllnesses(language);
  assert.deepEqual(ids(cards), illnessIds);
  assert.deepEqual(env.load('src/services/localFeed.ts').getHomeFeed(language).symptoms, cards);
  for (const card of cards) {
    assert.equal(card.label, getIllnessLabel(card.id, language));
    assert.equal(library.getPlantsBySymptom(card.id).length, card.plantCount, `${card.id} count must match its destination`);
    store.getState().setActiveSymptom(card.id);
    assert.deepEqual(ids(store.getState().getDisplayedPlants()), ids(library.getPlantsBySymptom(card.id)));
  }
  assert.deepEqual(ids(library.getPlantsBySymptom('diabetes')), ['banaba', 'insulin-plant', 'mango']);
  assert.deepEqual(ids(library.getPlantsBySymptom('flu')), ['oregano'], 'flu-like symptoms do not establish a flu association');
  assert.deepEqual(ids(library.getPlantsBySymptom('malaria')), ['makabuhay'], 'malaria symptoms do not establish a malaria association');
  assert.deepEqual(ids(library.getPlantsBySymptom('anemia')), ['alugbati'], 'prevention is not an illness-use association');
  assert.deepEqual(ids(library.getPlantsBySymptom('common-cold')), ['calamansi', 'litlit', 'oregano', 'sambong', 'serpentina', 'suha']);
  const original = require(`../src/data/plants_${language}.json`);
  assert.deepEqual(library.getAllPlants().find(p => p.id === 'malunggay').details.preparation,
    original.find(p => p.id === 'malunggay').details.preparation, 'original profile preparation information stays intact');
});

test('illness IDs and plant associations stay the same across translations', () => {
  const env = environment();
  const library = env.load('src/services/localLibrary.ts');
  const en = library.getAllIllnesses('en');
  const tl = library.getAllIllnesses('tl');
  for (const card of en) assert.equal(tl.find(item => item.id === card.id).plantCount, card.plantCount);
  assert.equal(tl.find(item => item.id === 'asthma').label, 'Hika');
  assert.equal(tl.find(item => item.id === 'eczema').label, 'Eksema');
});

test('selecting an illness clears stale search and favorites without clearing them on reset', () => {
  const env = environment();
  const { useLibraryStore: store } = env.load('src/store/useLibraryStore.ts');
  store.getState().setSearchQuery('mango');
  store.getState().setShowFavoritesOnly(true);
  store.getState().setActiveSymptom('eczema');
  assert.equal(store.getState().searchQuery, '');
  assert.equal(store.getState().showFavoritesOnly, false);
  assert.deepEqual(ids(store.getState().getDisplayedPlants()), ['aloe-vera', 'dila-dila', 'guyabano', 'katakataka']);
  store.getState().setSearchQuery('mango');
  store.getState().setShowFavoritesOnly(true);
  store.getState().setActiveSymptom(null);
  assert.equal(store.getState().searchQuery, 'mango');
  assert.equal(store.getState().showFavoritesOnly, true);
});

test('upgrading an old persisted feed replaces wellness and symptom cards with illness cards', async () => {
  const env = environment();
  env.memory.set('hanapmedisina-feed-store', JSON.stringify({ version: 0, state: {
    symptoms: [{ id: 'immune-support', label: 'Immune support', plantCount: 3, icon: 'leaf-outline' }],
    weeklyTrivia: [{ id: 'cached', text: 'Cached trivia' }], preparationGroups: [], lastFetchedAt: 100,
  } }));
  const store = env.load('src/store/useFeedStore.ts').useFeedStore;
  await store.persist.rehydrate();
  assert.deepEqual(ids(store.getState().symptoms), illnessIds);
  assert.equal(store.getState().weeklyTrivia[0].text, 'Cached trivia');
  assert.equal(JSON.parse(env.memory.get('hanapmedisina-feed-store')).version, 1);
});

test('Home and See all open illnesses by stable ID and Library shows their localized names', async () => {
  const env = environment();
  const feed = env.load('src/store/useFeedStore.ts').useFeedStore;
  feed.getState().fetchHomeFeed('en');
  const store = env.load('src/store/useLibraryStore.ts').useLibraryStore;
  const tree = await env.mount('src/components/home/SymptomGrid.tsx');
  try {
    const card = tree.root.findAll(node => node.type === 'Pressable' && node.props.accessibilityLabel?.startsWith('Eczema,'))[0];
    assert.ok(card, 'home exposes an accessible illness card');
    await act(async () => card.props.onPress());
    assert.equal(store.getState().activeSymptom, 'eczema');
    assert.equal(env.state.routes.at(-1), '/(tabs)/library');
  } finally { act(() => tree.unmount()); }
  const all = await env.mount('app/symptoms.tsx');
  try {
    const asthma = all.root.findAll(node => node.type === 'Pressable' && node.props.accessibilityLabel?.startsWith('Asthma,'))[0];
    assert.ok(asthma);
    await act(async () => asthma.props.onPress());
    assert.equal(store.getState().activeSymptom, 'asthma');
    env.load('src/store/useSettingsStore.ts').useSettingsStore.getState().setLanguage('tl');
    const library = await env.mount('app/(tabs)/library/index.tsx');
    try {
      const text = library.root.findAllByType('Text').flatMap(node => node.children.filter(child => typeof child === 'string')).join(' ');
      assert.ok(text.includes('Hika'), 'filter banner resolves the ID in the active language');
      assert.ok(!text.includes('asthma'), 'internal illness ID must not leak into the banner');
    } finally { act(() => library.unmount()); }
  } finally { act(() => all.unmount()); }
});
