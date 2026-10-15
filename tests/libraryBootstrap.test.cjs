const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const ts = require('typescript');
const memory = new Map();
const storage = { getItem: async key => memory.get(key) ?? null, setItem: async (key, value) => { memory.set(key, value); }, removeItem: async key => { memory.delete(key); } };
const modules = new Map();
function load(filename) {
  filename = path.resolve(filename);
  if (modules.has(filename)) return modules.get(filename).exports;
  const module = { exports: {} };
  modules.set(filename, module);
  const normalRequire = createRequire(filename);
  const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
  const requireMock = name => {
    if (name === '@react-native-async-storage/async-storage') return storage;
    if (name === 'react-native') return { Image: { resolveAssetSource: asset => ({ uri: `asset://${asset}` }) } };
    if (/\.(jpg|png)$/.test(name)) return name;
    if (name.startsWith('@/')) {
      const candidate = path.resolve(__dirname, '..', name.slice(2));
      return load(fs.existsSync(`${candidate}.ts`) ? `${candidate}.ts` : path.join(candidate, 'index.ts'));
    }
    if (name.startsWith('.') && !name.endsWith('.json')) {
      const candidate = path.resolve(path.dirname(filename), name);
      return load(fs.existsSync(`${candidate}.ts`) ? `${candidate}.ts` : path.join(candidate, 'index.ts'));
    }
    return normalRequire(name);
  };
  new Function('require', 'module', 'exports', source)(requireMock, module, module.exports);
  return module.exports;
}
const { useLibraryStore: store } = load('src/store/useLibraryStore.ts');
const catalog = require('../src/data/plants_en.json');
const ids = rows => rows.map(row => row.id).sort();

test('first launch exposes every bundled plant before any refresh', () => {
  assert.deepEqual(ids(store.getState().getDisplayedPlants()), ids(catalog));
});

test('legacy single-plant cache cannot replace the catalog during hydration', async () => {
  memory.set('library-store', JSON.stringify({ state: { plants: [catalog[0]], favorites: [catalog[0]], viewMode: 'grid', activeCategory: 'old filter', showFavoritesOnly: true }, version: 0 }));
  await store.persist.rehydrate();
  assert.deepEqual(ids(store.getState().getDisplayedPlants()), ids(catalog));
  assert.equal(store.getState().activeCategory, null);
  assert.equal(store.getState().showFavoritesOnly, false);
  assert.equal(store.getState().viewMode, 'grid');
  assert.ok(store.getState().isFavorite(catalog[0].id));
  assert.ok(store.getState().favorites[0].imageUrl.startsWith('asset://'));
});

test('category, symptom and remedy filters leave the complete catalog available', () => {
  const category = catalog[0].categories[0];
  store.getState().setActiveCategory(category);
  assert.deepEqual(ids(store.getState().getDisplayedPlants()), ids(catalog.filter(plant => plant.categories.includes(category))));
  assert.equal(store.getState().plants.length, catalog.length);
  store.getState().setActiveSymptom('cough');
  assert.ok(store.getState().getDisplayedPlants().some(plant => plant.id === 'lagundi'));
  assert.ok(store.getState().getDisplayedPlants().length < catalog.length);
  assert.equal(store.getState().plants.length, catalog.length);
  store.getState().setActivePreparationMethod('Poultice');
  assert.ok(store.getState().getDisplayedPlants().length > 0);
  assert.equal(store.getState().plants.length, catalog.length);
  store.getState().setActivePreparationMethod(null);
  assert.deepEqual(ids(store.getState().getDisplayedPlants()), ids(catalog));
});

test('starting a plant-name search clears hidden browse filters and keeps matches available', () => {
  for (const selectFilter of [
    () => store.getState().setActiveCategory('diuretic'),
    () => store.getState().setActiveSymptom('fever'),
    () => store.getState().setActivePreparationMethod('Steam'),
  ]) {
    store.getState().setSearchQuery('');
    selectFilter();
    store.getState().setSearchQuery('litlit');
    assert.equal(store.getState().activeCategory, null);
    assert.equal(store.getState().activeSymptom, null);
    assert.equal(store.getState().activePreparationMethod, null);
    const matches = store.getState().getDisplayedPlants();
    assert.deepEqual(ids(matches), ['litlit']);
    assert.equal(store.getState().plants.length, catalog.length);
  }
  store.getState().setSearchQuery('');
});

test('Library results do not match symptom queries', () => {
  for (const query of ['cough', 'ubo', 'lagnat', 'sakit ng tiyan']) {
    store.getState().setSearchQuery(query);
    assert.deepEqual(store.getState().getDisplayedPlants(), []);
  }
  store.getState().setSearchQuery('');
});

test('switching language refreshes Library data and saved plants while preserving favorites', async () => {
  const stopSync = load('src/store/dataLanguageSync.ts').initializeDataLanguageSync();
  const { useSettingsStore: settings } = load('src/store/useSettingsStore.ts');
  const mango = catalog.find(plant => plant.id === 'mango');
  await store.getState().toggleFavorite(mango);
  const favoriteIds = [...store.getState().favoriteIds].sort();
  store.getState().setActiveSymptom('cough');
  settings.getState().setLanguage('tl');
  assert.deepEqual([...store.getState().favoriteIds].sort(), favoriteIds);
  assert.equal(store.getState().favorites.find(plant => plant.id === 'mango').name, 'Mangga');
  assert.equal(store.getState().plants.find(plant => plant.id === 'mango').name, 'Mangga');
  assert.equal(store.getState().activeSymptom, null);
  assert.equal(store.getState().activePreparationMethod, null);
  assert.deepEqual(ids(store.getState().getDisplayedPlants()), ids(catalog));
  settings.getState().setLanguage('en');
  assert.equal(store.getState().favorites.find(plant => plant.id === 'mango').name, 'Mango');
  stopSync();
});
