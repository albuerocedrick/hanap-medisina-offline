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
