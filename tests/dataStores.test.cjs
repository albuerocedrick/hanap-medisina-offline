const test = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { createLoader } = require('./helpers/loadTypeScript.cjs');
const catalog = require('../src/data/plants_en.json');

function environment(initial = {}) {
  const memory = new Map(Object.entries(initial));
  const writes = [];
  const native = { imageResolutions: 0, deletions: [], reads: [], failedImages: new Set(), failFavorites: false };
  const storage = {
    getItem: async key => memory.get(key) ?? null,
    setItem: async (key, value) => {
      if (key === 'hanapmedisina_favorites' && native.failFavorites) throw new Error('disk full');
      writes.push({ key, value });
      memory.set(key, value);
    },
    removeItem: async key => { memory.delete(key); },
  };
  const fileSystem = {
    documentDirectory: 'file:///documents/', cacheDirectory: 'file:///cache/', EncodingType: { Base64: 'base64' },
    getInfoAsync: async () => ({ exists: true, isDirectory: false, size: 100 }),
    readAsStringAsync: async uri => { native.reads.push(uri); return '{}'; },
    writeAsStringAsync: async () => {}, makeDirectoryAsync: async () => {},
    deleteAsync: async uri => {
      native.deletions.push(uri);
      if (native.failedImages.has(uri)) throw new Error('native delete failed');
    },
  };
  const loader = createLoader({
    '@react-native-async-storage/async-storage': storage,
    'expo-file-system': fileSystem, 'expo-crypto': { randomUUID },
    'react-native': { Image: { resolveAssetSource: asset => { native.imageResolutions++; return { uri: `asset://${asset}` }; } } },
  });
  return { ...loader, memory, writes, native, fileSystem, storage };
}

const favoriteIds = store => [...store.getState().favoriteIds].sort();
const scan = (id, imageUri = `file:///${id}.jpg`) => ({ id, imageUri, plantId: 'lagundi', plantName: 'Lagundi', confidence: 0.9, scannedAt: '2026-10-15T00:00:00Z', isFavorite: false });
const backup = favorites => ({ version: 1, exportedAt: '2026-10-15T00:00:00Z', profile: { firstName: 'A', lastName: 'B' }, scans: [], favorites });

test('both former favorites formats migrate to ID-only storage and fresh bundled details', async () => {
  for (const initial of [
    { hanapmedisina_favorites: JSON.stringify([{ ...catalog[0], imageUrl: 'data:image/jpeg;base64,legacy' }, catalog[0], { id: 'missing-plant' }]) },
    { 'library-store': JSON.stringify({ state: { favorites: [{ ...catalog[0], imageUrl: 'data:image/jpeg;base64,legacy' }] }, version: 0 }) },
  ]) {
    const env = environment(initial);
    const { useLibraryStore: store } = env.load('src/store/useLibraryStore.ts');
    await store.persist.rehydrate();
    await store.getState().loadFavorites();
    assert.deepEqual(favoriteIds(store), [catalog[0].id]);
    assert.deepEqual(JSON.parse(env.memory.get('hanapmedisina_favorites')), [catalog[0].id]);
    assert.equal(store.getState().favorites[0].name, catalog[0].name);
    assert.ok(store.getState().favorites[0].imageUrl.startsWith('asset://'));
    assert.ok(!env.memory.get('library-store').includes('imageUrl'));
    assert.ok(!env.memory.get('library-store').includes('favorites'));
  }
});

test('favorite taps serialize without losing updates and failed writes preserve saved state', async () => {
  const env = environment();
  const { useLibraryStore: store } = env.load('src/store/useLibraryStore.ts');
  await store.getState().loadFavorites();
  await Promise.all([
    store.getState().toggleFavorite(catalog[0]),
    store.getState().toggleFavorite(catalog[1]),
    store.getState().toggleFavorite(catalog[0]),
  ]);
  assert.deepEqual(favoriteIds(store), [catalog[1].id]);
  env.native.failFavorites = true;
  await store.getState().toggleFavorite(catalog[2]);
  assert.deepEqual(favoriteIds(store), [catalog[1].id]);
  assert.equal(store.getState().favoritesError.code, 'FAVORITES_SAVE_FAILED');
  await assert.rejects(store.getState().replaceFavorites([catalog[0].id]));
  assert.deepEqual(favoriteIds(store), [catalog[1].id]);
  env.native.failFavorites = false;
  await store.getState().toggleFavorite(catalog[2]);
  assert.deepEqual(favoriteIds(store), [catalog[1].id, catalog[2].id].sort());
});

test('startup refresh and a failed migration retain legacy IDs across an app restart', async () => {
  const env = environment({
    'library-store': JSON.stringify({ state: { favorites: [{ ...catalog[0], imageUrl: 'data:image/jpeg;base64,legacy' }], viewMode: 'grid' }, version: 0 }),
  });
  const store = env.load('src/store/useLibraryStore.ts').useLibraryStore;
  const stop = env.load('src/store/dataLanguageSync.ts').initializeDataLanguageSync();
  env.native.failFavorites = true;
  await store.getState().loadFavorites();
  await store.persist.rehydrate();
  assert.equal(store.getState().favoritesError.code, 'FAVORITES_LOAD_FAILED');
  const fallback = JSON.parse(env.memory.get('library-store')).state;
  assert.deepEqual(fallback.legacyFavoriteIds, [catalog[0].id]);
  assert.ok(!env.memory.get('library-store').includes('imageUrl'));
  stop();
  const restarted = environment(Object.fromEntries(env.memory));
  const nextStore = restarted.load('src/store/useLibraryStore.ts').useLibraryStore;
  await nextStore.getState().loadFavorites();
  assert.deepEqual(favoriteIds(nextStore), [catalog[0].id]);
});

test('the root startup order restores canonical IDs in the persisted interface language', async () => {
  const env = environment({
    hanapmedisina_favorites: JSON.stringify(['mango']),
    'library-store': JSON.stringify({ state: { viewMode: 'grid' }, version: 0 }),
    'hanap-medisina-settings': JSON.stringify({ state: { language: 'tl' }, version: 0 }),
  });
  const store = env.load('src/store/useLibraryStore.ts').useLibraryStore;
  const loading = store.getState().loadFavorites();
  const stop = env.load('src/store/dataLanguageSync.ts').initializeDataLanguageSync();
  const settings = env.load('src/store/useSettingsStore.ts').useSettingsStore;
  await Promise.all([loading, store.persist.rehydrate(), settings.persist.rehydrate()]);
  assert.deepEqual(favoriteIds(store), ['mango']);
  assert.equal(store.getState().favorites[0].name, 'Mangga');
  assert.equal(store.getState().plants.find(plant => plant.id === 'mango').name, 'Mangga');
  assert.equal(store.getState().viewMode, 'grid');
  stop();
});

test('a language switch while a favorite write is pending commits current-language records', async () => {
  const env = environment();
  const store = env.load('src/store/useLibraryStore.ts').useLibraryStore;
  await store.getState().loadFavorites();
  const settings = env.load('src/store/useSettingsStore.ts').useSettingsStore;
  const stop = env.load('src/store/dataLanguageSync.ts').initializeDataLanguageSync();
  let release;
  let started;
  const pending = new Promise(resolve => { started = resolve; });
  const write = env.storage.setItem;
  env.storage.setItem = async (key, value) => {
    if (key === 'hanapmedisina_favorites') {
      started();
      await new Promise(resolve => { release = resolve; });
    }
    return write(key, value);
  };
  const task = store.getState().replaceFavorites(['mango']);
  await pending;
  settings.getState().setLanguage('tl');
  release();
  await task;
  assert.equal(store.getState().favorites[0].name, 'Mangga');
  stop();
});

test('import replaces favorites atomically, clears empty replacements, and merges idempotently', async () => {
  const env = environment();
  const { useLibraryStore: store } = env.load('src/store/useLibraryStore.ts');
  const { applyImport } = env.load('src/services/dataTransfer.ts');
  await store.getState().replaceFavorites([catalog[0].id, catalog[1].id]);
  const before = env.writes.filter(write => write.key === 'hanapmedisina_favorites').length;
  await applyImport(backup([catalog[1].id, catalog[2].id, catalog[2].id, 'unknown']), 'replace');
  assert.equal(env.writes.filter(write => write.key === 'hanapmedisina_favorites').length, before + 1);
  assert.deepEqual(favoriteIds(store), [catalog[1].id, catalog[2].id].sort());
  await applyImport(backup([catalog[0].id, catalog[1].id]), 'merge');
  assert.deepEqual(favoriteIds(store), [catalog[0].id, catalog[1].id, catalog[2].id].sort());
  await applyImport(backup([]), 'replace');
  assert.deepEqual(favoriteIds(store), []);
  assert.deepEqual(JSON.parse(env.memory.get('hanapmedisina_favorites')), []);
});

test('import checks file size before reading, including unavailable metadata', async () => {
  const env = environment();
  const { importData, MAX_IMPORT_BYTES } = env.load('src/services/dataTransfer.ts');
  for (const info of [
    { exists: true, isDirectory: false, size: MAX_IMPORT_BYTES + 1 },
    { exists: true, isDirectory: false },
    { exists: false },
  ]) {
    env.fileSystem.getInfoAsync = async () => info;
    assert.equal((await importData('file:///backup.json')).success, false);
  }
  assert.equal(env.native.reads.length, 0);
  env.fileSystem.getInfoAsync = async () => ({ exists: true, isDirectory: false, size: 100 });
  env.fileSystem.readAsStringAsync = async () => JSON.stringify(backup(['lagundi']));
  assert.equal((await importData('file:///backup.json')).success, true);
});

test('backup validation rejects path-traversing scan IDs and malformed image payloads', () => {
  const { validateImportData } = environment().load('src/services/dataTransfer.ts');
  assert.equal(validateImportData({ ...backup([]), scans: [scan('../profile/avatar')] }), false);
  assert.equal(validateImportData({ ...backup([]), scans: [{ ...scan('valid'), imageBase64: {} }] }), false);
});

test('failed image deletions retain their records for retry across every delete action', async () => {
  for (const action of ['deleteScan', 'deleteMultipleScans', 'clearAllScans']) {
    const env = environment();
    const { useHistoryStore: store } = env.load('src/store/useHistoryStore.ts');
    await store.persist.rehydrate();
    store.setState({ scans: [scan('success'), scan('failure')] });
    env.native.failedImages.add('file:///failure.jpg');
    const task = action === 'deleteScan' ? store.getState()[action]('failure')
      : action === 'deleteMultipleScans' ? store.getState()[action](['success', 'failure'])
      : store.getState()[action]();
    await assert.rejects(task, /kept/);
    assert.deepEqual(store.getState().scans.map(scan => scan.id), action === 'deleteScan' ? ['success', 'failure'] : ['failure']);
    env.native.failedImages.clear();
    await store.getState().clearAllScans();
    assert.deepEqual(store.getState().scans, []);
  }
});

test('bulk deletion overlaps native work and preserves scans added during deletion', async () => {
  const env = environment();
  const { useHistoryStore: store } = env.load('src/store/useHistoryStore.ts');
  await store.persist.rehydrate();
  store.setState({ scans: [scan('one'), scan('two')] });
  const pending = [];
  env.fileSystem.deleteAsync = () => new Promise(resolve => pending.push(resolve));
  const clearing = store.getState().clearAllScans();
  assert.equal(pending.length, 2);
  store.getState().addScan(scan('new'));
  pending.forEach(resolve => resolve());
  await clearing;
  assert.equal(store.getState().scans.length, 1);
  assert.match(store.getState().scans[0].id, /^scan_[a-f\d-]{36}$/);
});

test('catalog imports defer unused languages and native asset resolution; search remains bilingual', () => {
  const env = environment();
  const library = env.load('src/services/localLibrary.ts');
  const search = env.load('src/services/plantSearch.ts');
  assert.equal(env.requests.filter(name => /plants_(en|tl)\.json/.test(name)).length, 0);
  const plants = library.getAllPlants('en');
  assert.equal(env.requests.filter(name => /plants_tl\.json/.test(name)).length, 0);
  assert.equal(env.native.imageResolutions, 0);
  assert.ok(plants[0].imageUrl.startsWith('asset://'));
  void plants[0].imageUrl;
  assert.equal(env.native.imageResolutions, 1);
  assert.equal(search.searchPlantNames(plants, 'mangga')[0].id, 'mango');
  assert.ok(search.searchPlantRecords(plants, 'ubo').some(plant => plant.id === 'lagundi'));
  assert.equal(env.requests.filter(name => /plants_tl\.json/.test(name)).length, 1);
});

test('data language sync owns an explicit, disposable subscription and does not rewrite favorites', async () => {
  const env = environment();
  const settings = env.load('src/store/useSettingsStore.ts').useSettingsStore;
  await settings.persist.rehydrate();
  const store = env.load('src/store/useLibraryStore.ts').useLibraryStore;
  await store.persist.rehydrate();
  await store.getState().replaceFavorites(['mango']);
  const count = env.writes.filter(write => write.key === 'hanapmedisina_favorites').length;
  settings.getState().setLanguage('tl');
  assert.equal(store.getState().favorites[0].name, 'Mango');
  const stop = env.load('src/store/dataLanguageSync.ts').initializeDataLanguageSync();
  assert.equal(store.getState().favorites[0].name, 'Mangga');
  settings.getState().setLanguage('en');
  assert.equal(store.getState().favorites[0].name, 'Mango');
  assert.equal(env.writes.filter(write => write.key === 'hanapmedisina_favorites').length, count);
  stop();
  settings.getState().setLanguage('tl');
  assert.equal(store.getState().favorites[0].name, 'Mango');
});

test('displayed plants keep their memoized reference across unrelated store updates', async () => {
  const { useLibraryStore: store, selectDisplayedPlants } = environment().load('src/store/useLibraryStore.ts');
  await store.persist.rehydrate();
  store.getState().setActiveCategory(catalog[0].categories[0]);
  const before = selectDisplayedPlants(store.getState());
  store.getState().setViewMode('grid');
  assert.strictEqual(selectDisplayedPlants(store.getState()), before);
  await store.getState().replaceFavorites(['mango']);
  assert.strictEqual(selectDisplayedPlants(store.getState()), before);
  store.getState().setShowFavoritesOnly(true);
  assert.notStrictEqual(selectDisplayedPlants(store.getState()), before);
});

test('profile updates cannot overwrite actions, even with untyped caller data', () => {
  const store = environment().load('src/store/useProfileStore.ts').useProfileStore;
  const action = store.getState().resetProfile;
  store.getState().updateProfile({ firstName: 'Updated', resetProfile: 'broken' });
  assert.equal(store.getState().firstName, 'Updated');
  assert.strictEqual(store.getState().resetProfile, action);
});

test('daily feed shuffle is repeatable and explicit language controls every feed section', () => {
  const env = environment();
  const { getHomeFeed } = env.load('src/services/localFeed.ts');
  const en = getHomeFeed('en');
  assert.deepEqual(getHomeFeed('en'), en);
  assert.equal(en.weeklyTrivia.length, 7);
  assert.equal(new Set(en.weeklyTrivia.map(item => item.text)).size, 7);
  const tl = getHomeFeed('tl');
  assert.notDeepEqual(tl.weeklyTrivia, en.weeklyTrivia);
  assert.notDeepEqual(tl.symptoms, en.symptoms);
  assert.notDeepEqual(tl.preparationGroups, en.preparationGroups);
});

test('history store caps total scans at MAX_SCAN_HISTORY and prunes oldest non-favorite first', () => {
  const { useHistoryStore, MAX_SCAN_HISTORY } = environment().load('src/store/useHistoryStore.ts');
  const store = useHistoryStore;
  assert.equal(MAX_SCAN_HISTORY, 500);
  const initial = Array.from({ length: 500 }, (_, i) => ({
    id: `scan_${i}`,
    plantName: `Plant ${i}`,
    plantId: 'plant',
    confidence: 0.9,
    imageUri: `file:///scan_${i}.jpg`,
    scannedAt: new Date(Date.now() - (500 - i) * 1000).toISOString(),
    isFavorite: i === 499,
  }));
  store.getState().importScans(initial, 'replace');
  assert.equal(store.getState().scans.length, 500);

  store.getState().addScan({
    plantName: 'Newest Plant',
    plantId: 'plant',
    confidence: 0.95,
    imageUri: 'file:///newest.jpg',
    scannedAt: new Date().toISOString(),
  });

  assert.equal(store.getState().scans.length, 500);
  assert.ok(store.getState().scans.some(s => s.id === 'scan_499'));
  assert.ok(!store.getState().scans.some(s => s.id === 'scan_498'));
  assert.equal(store.getState().scans[0].plantName, 'Newest Plant');
});
