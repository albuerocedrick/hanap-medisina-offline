const test = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { createLoader } = require('./helpers/loadTypeScript.cjs');

// Substitute only native storage and file I/O. The service, Zustand persistence,
// catalogs, and all store actions below are the application's real modules.
function environment(initial = {}, initialFiles = {}, extraMocks = {}) {
  const memory = new Map(Object.entries(initial));
  const files = new Map(Object.entries(initialFiles).map(([uri, bytes]) => [uri, Buffer.from(bytes)]));
  const directories = new Set(['file:///documents/', 'file:///cache/']);
  const calls = { reads: [], writes: [], mkdir: [], deletes: [] };
  const failures = { read: new Set(), write: new Set(), stat: new Set() };
  const storage = {
    getItem: async key => memory.get(key) ?? null,
    setItem: async (key, value) => { memory.set(key, value); },
    removeItem: async key => { memory.delete(key); },
  };
  const fileSystem = {
    documentDirectory: 'file:///documents/',
    cacheDirectory: 'file:///cache/',
    EncodingType: { Base64: 'base64' },
    getInfoAsync: async uri => {
      if (failures.stat.has(uri)) throw new Error('stat denied');
      return directories.has(uri) ? { exists: true, isDirectory: true }
        : files.has(uri) ? { exists: true, isDirectory: false, size: files.get(uri).length }
          : { exists: false, isDirectory: false };
    },
    readAsStringAsync: async (uri, options) => {
      calls.reads.push({ uri, options });
      if (failures.read.has(uri) || !files.has(uri)) throw new Error('read denied');
      return files.get(uri).toString(options?.encoding === 'base64' ? 'base64' : 'utf8');
    },
    writeAsStringAsync: async (uri, content, options) => {
      calls.writes.push({ uri, content, options });
      if (failures.write.has(uri)) throw new Error('disk full');
      files.set(uri, Buffer.from(content, options?.encoding === 'base64' ? 'base64' : 'utf8'));
    },
    makeDirectoryAsync: async (uri, options) => { calls.mkdir.push({ uri, options }); directories.add(uri); },
    deleteAsync: async uri => { calls.deletes.push(uri); files.delete(uri); },
  };
  const loader = createLoader({
    '@react-native-async-storage/async-storage': storage,
    'expo-file-system': fileSystem,
    'expo-crypto': { randomUUID },
    'react-native': { Image: { resolveAssetSource: asset => ({ uri: `asset://${asset}` }) } },
    ...extraMocks,
  });
  const history = loader.load('src/store/useHistoryStore.ts').useHistoryStore;
  const profile = loader.load('src/store/useProfileStore.ts').useProfileStore;
  const settings = loader.load('src/store/useSettingsStore.ts').useSettingsStore;
  const onboarding = loader.load('src/store/useOnboardingStore.ts').useOnboardingStore;
  const library = loader.load('src/store/useLibraryStore.ts').useLibraryStore;
  const transfer = loader.load('src/services/dataTransfer.ts');
  async function ready() {
    await Promise.all([history, profile, settings, onboarding, library].map(store => store.persist.rehydrate()));
    await library.getState().loadFavorites();
    // The library serializes its preference writes behind hydration reads.
    await new Promise(resolve => setImmediate(resolve));
  }
  return { ...loader, memory, files, directories, calls, failures, fileSystem, storage,
    history, profile, settings, onboarding, library, transfer, ready };
}

const scan = (id, overrides = {}) => ({ id, imageUri: `file:///documents/scans/${id}.jpg`,
  plantId: 'lagundi', plantName: 'Lagundi', confidence: 0.93,
  scannedAt: '2026-10-15T05:00:00.000Z', isFavorite: false, ...overrides });
const backup = (overrides = {}) => ({ version: 1, exportedAt: '2026-10-15T06:00:00.000Z',
  profile: { firstName: 'Maria', lastName: 'Santos' }, scans: [], favorites: [], ...overrides });
const importedScan = (id, overrides = {}) => {
  const { imageUri, ...record } = scan(id, overrides);
  return record;
};
const sortedIds = store => [...store.getState().favoriteIds].sort();

test('backup export and replace restore scan metadata, notes, image bytes, avatar, and favorites after restart', async () => {
  const source = environment();
  await source.ready();
  const original = scan('field_visit', { isFavorite: true, notes: 'Near the garden — 早上' });
  source.history.getState().importScans([original], 'replace');
  const imageBytes = Buffer.from([0xff, 0xd8, 0, 32, 128, 0xff, 0xd9]);
  const avatarBytes = Buffer.from([0xff, 0xd8, 64, 0, 1, 0xff, 0xd9]);
  source.files.set(original.imageUri, imageBytes);
  source.files.set('file:///documents/profile/user.jpg', avatarBytes);
  source.profile.getState().updateProfile({ firstName: 'María', lastName: 'Dela Cruz', avatarUri: 'file:///documents/profile/user.jpg' });
  await source.library.getState().replaceFavorites(['lagundi', 'mango']);
  const exportPath = await source.transfer.exportData();
  assert.match(exportPath, /^file:\/\/\/cache\/hanapmedisina-backup-\d+\.json$/);
  const raw = JSON.parse(source.files.get(exportPath).toString());
  assert.equal(raw.scans[0].notes, original.notes);
  assert.equal(raw.scans[0].imageBase64, imageBytes.toString('base64'));
  assert.equal(raw.profile.avatarBase64, avatarBytes.toString('base64'));
  assert.ok(!Object.hasOwn(raw.scans[0], 'imageUri'));
  assert.ok(!Object.hasOwn(raw.profile, 'avatarUri'));

  const target = environment({}, { 'file:///cache/received.json': source.files.get(exportPath) });
  await target.ready();
  const preview = await target.transfer.importData('file:///cache/received.json');
  assert.equal(preview.success, true);
  assert.equal(preview.profileName, 'María Dela Cruz');
  assert.equal(preview.scansCount, 1);
  assert.equal(preview.favoritesCount, 2);
  await target.transfer.applyImport(preview.parsedData, 'replace');
  await new Promise(resolve => setImmediate(resolve));
  const restarted = environment(Object.fromEntries(target.memory), Object.fromEntries(target.files));
  await restarted.ready();
  const restored = restarted.history.getState().getScanById(original.id);
  assert.deepEqual({ ...restored, imageUri: original.imageUri }, original);
  assert.ok(restored.imageUri.startsWith('file:///documents/scans/'));
  assert.deepEqual(restarted.files.get(restored.imageUri), imageBytes);
  assert.equal(restarted.profile.getState().firstName, 'María');
  assert.equal(restarted.profile.getState().lastName, 'Dela Cruz');
  assert.deepEqual(restarted.files.get(restarted.profile.getState().avatarUri), avatarBytes);
  assert.deepEqual(sortedIds(restarted.library), ['lagundi', 'mango']);
});

test('import preview parses a backup without mutating history, profile, favorites, or image files', async () => {
  const env = environment({}, { 'file:///cache/preview.json': JSON.stringify(backup({
    scans: [importedScan('incoming', { imageBase64: 'aW1hZ2U=' })], favorites: ['mango'],
  })) });
  await env.ready();
  env.history.getState().importScans([scan('existing')], 'replace');
  env.profile.getState().setFirstName('Current');
  await env.library.getState().replaceFavorites(['lagundi']);
  await new Promise(resolve => setImmediate(resolve));
  const beforeStorage = [...env.memory];
  const beforeFiles = [...env.files];
  const result = await env.transfer.importData('file:///cache/preview.json');
  assert.equal(result.success, true);
  assert.equal(result.scansCount, 1);
  assert.deepEqual(env.history.getState().scans.map(item => item.id), ['existing']);
  assert.equal(env.profile.getState().firstName, 'Current');
  assert.deepEqual(sortedIds(env.library), ['lagundi']);
  assert.deepEqual([...env.memory], beforeStorage);
  assert.deepEqual([...env.files], beforeFiles);
  assert.equal(env.calls.writes.length, 0);
});

test('backup export retains readable records when individual scan images or avatar files are missing or unreadable', async () => {
  const env = environment();
  await env.ready();
  const records = [scan('missing'), scan('unreadable'), scan('valid'), scan('empty', { imageUri: '' })];
  env.history.getState().importScans(records, 'replace');
  env.files.set(records[1].imageUri, Buffer.from('broken file'));
  env.files.set(records[2].imageUri, Buffer.from('usable image'));
  env.failures.read.add(records[1].imageUri);
  env.profile.getState().setAvatar('file:///missing-avatar.jpg');
  const path = await env.transfer.exportData();
  const payload = JSON.parse(env.files.get(path));
  assert.deepEqual(payload.scans.map(record => record.id), records.map(record => record.id));
  assert.ok(payload.scans.slice(0, 2).every(record => !Object.hasOwn(record, 'imageBase64')));
  assert.equal(payload.scans[2].imageBase64, Buffer.from('usable image').toString('base64'));
  assert.ok(!Object.hasOwn(payload.scans[3], 'imageBase64'));
  assert.ok(!Object.hasOwn(payload.profile, 'avatarBase64'));
  assert.equal(env.transfer.validateImportData(payload), true);
  assert.deepEqual(env.history.getState().scans, records);
});

test('backup export uses the document directory when no cache directory is available', async () => {
  const env = environment();
  await env.ready();
  env.fileSystem.cacheDirectory = null;
  assert.match(await env.transfer.exportData(), /^file:\/\/\/documents\/hanapmedisina-backup-\d+\.json$/);
});

test('backup export propagates a final disk write failure without clearing saved records', async () => {
  const env = environment();
  await env.ready();
  env.history.getState().importScans([scan('retained')], 'replace');
  env.fileSystem.writeAsStringAsync = async () => { throw new Error('disk full'); };
  await assert.rejects(env.transfer.exportData(), /disk full/);
  assert.deepEqual(env.history.getState().scans.map(record => record.id), ['retained']);
});

test('merge import keeps the existing scan and its image bytes when an incoming ID already exists', async () => {
  const uri = 'file:///documents/scans/existing.jpg';
  const env = environment({}, { [uri]: 'original image' });
  await env.ready();
  const original = scan('existing', { notes: 'Original record' });
  env.history.getState().importScans([original], 'replace');
  await env.transfer.applyImport(backup({ scans: [importedScan('existing', {
    plantName: 'Different incoming plant', imageBase64: Buffer.from('incoming image').toString('base64'),
  })] }), 'merge');
  assert.deepEqual(env.history.getState().scans, [original]);
  assert.equal(env.files.get(uri).toString(), 'original image');
});

test('merge import preserves the current profile and avatar, unions favorites, and is repeatable', async () => {
  const env = environment({}, { 'file:///documents/profile/current.jpg': 'my avatar' });
  await env.ready();
  env.profile.getState().updateProfile({ firstName: 'Current', lastName: 'User', avatarUri: 'file:///documents/profile/current.jpg' });
  env.history.getState().importScans([scan('existing')], 'replace');
  await env.library.getState().replaceFavorites(['lagundi']);
  const incoming = backup({
    profile: { firstName: 'Imported', lastName: 'Person', avatarBase64: 'bmV3IGF2YXRhcg==' },
    scans: [importedScan('new', { imageBase64: 'bmV3IGltYWdl' })], favorites: ['mango'],
  });
  await env.transfer.applyImport(incoming, 'merge');
  await env.transfer.applyImport(incoming, 'merge');
  assert.deepEqual(env.history.getState().scans.map(record => record.id), ['new', 'existing']);
  assert.equal(env.profile.getState().firstName, 'Current');
  assert.equal(env.profile.getState().lastName, 'User');
  assert.equal(env.profile.getState().avatarUri, 'file:///documents/profile/current.jpg');
  assert.equal(env.files.get('file:///documents/profile/current.jpg').toString(), 'my avatar');
  assert.equal(env.files.get(env.history.getState().getScanById('new').imageUri).toString(), 'new image');
  assert.deepEqual(sortedIds(env.library), ['lagundi', 'mango']);
  assert.equal(env.files.has('file:///documents/profile/avatar.jpg'), false);
});

test('backup import resolves repeated incoming IDs once and keeps the first record and image', async () => {
  const env = environment();
  await env.ready();
  await env.transfer.applyImport(backup({ scans: [
    importedScan('same', { notes: 'First', imageBase64: 'Zmlyc3QgaW1hZ2U=' }),
    importedScan('same', { notes: 'Later', imageBase64: 'bGF0ZXIgaW1hZ2U=' }),
  ] }), 'replace');
  const records = env.history.getState().scans;
  assert.equal(records.length, 1);
  assert.equal(records[0].notes, 'First');
  assert.equal(env.files.get(records[0].imageUri).toString(), 'first image');
  assert.equal(env.calls.writes.length, 1);
});

for (const mode of ['merge', 'replace']) {
  test(`${mode} history import stores one record per ID when the incoming list repeats IDs`, async () => {
    const env = environment();
    await env.ready();
    env.history.getState().importScans([scan('repeated', { notes: 'First record' }), scan('repeated', { notes: 'Later duplicate' }), scan('unique')], mode);
    assert.deepEqual(env.history.getState().scans.map(record => record.id).sort(), ['repeated', 'unique']);
    assert.equal(env.history.getState().getScanById('repeated').notes, 'First record');
  });
}

test('replace import clears an old profile avatar when the replacement backup has no avatar', async () => {
  const env = environment();
  await env.ready();
  env.profile.getState().setAvatar('file:///documents/profile/old.jpg');
  await env.transfer.applyImport(backup(), 'replace');
  assert.equal(env.profile.getState().firstName, 'Maria');
  assert.equal(env.profile.getState().lastName, 'Santos');
  assert.equal(env.profile.getState().avatarUri, null);
  assert.deepEqual(env.history.getState().scans, []);
});

test('import restores image-less scans without creating empty image files', async () => {
  const env = environment();
  await env.ready();
  await env.transfer.applyImport(backup({ scans: [importedScan('without_image')] }), 'replace');
  assert.equal(env.history.getState().getScanById('without_image').imageUri, '');
  assert.equal(env.files.has('file:///documents/scans/without_image.jpg'), false);
});

for (const failure of ['scan image', 'avatar', 'favorites persistence']) {
  test(`replace import failure during ${failure} preserves original records and removes staged files`, async () => {
    const originalAvatar = 'file:///documents/profile/original.jpg';
    const originalImage = 'file:///documents/scans/original.jpg';
    const env = environment({}, { [originalAvatar]: 'original avatar', [originalImage]: 'original scan' });
    await env.ready();
    env.history.getState().importScans([scan('original')], 'replace');
    env.profile.getState().updateProfile({ firstName: 'Original', lastName: 'User', avatarUri: originalAvatar });
    await env.library.getState().replaceFavorites(['lagundi']);
    await new Promise(resolve => setImmediate(resolve));
    const originalScans = env.history.getState().scans;
    const originalFiles = [...env.files];
    const persistedHistory = env.memory.get('hanapmedisina-offline-history');
    const persistedProfile = env.memory.get('hanapmedisina-offline-profile');
    if (failure === 'favorites persistence') {
      const writeStorage = env.storage.setItem;
      env.storage.setItem = async (key, value) => {
        if (key === 'hanapmedisina_favorites') throw new Error('favorites disk full');
        return writeStorage(key, value);
      };
    } else {
      const writeFile = env.fileSystem.writeAsStringAsync;
      env.fileSystem.writeAsStringAsync = async (uri, content, options) => {
        if ((failure === 'scan image' && content === 'ZmFpbGVkIHNjYW4=')
          || (failure === 'avatar' && content === 'aW5jb21pbmcgYXZhdGFy')) {
          // Native storage can create an incomplete file before rejecting.
          env.files.set(uri, Buffer.from('incomplete native write'));
          throw new Error('image disk full');
        }
        return writeFile(uri, content, options);
      };
    }
    const incoming = backup({
      scans: [importedScan('good', { imageBase64: 'Z29vZCBzY2Fu' }), importedScan('fails', { imageBase64: 'ZmFpbGVkIHNjYW4=' })],
      profile: { firstName: 'Incoming', lastName: 'Person', avatarBase64: 'aW5jb21pbmcgYXZhdGFy' },
      favorites: ['mango'],
    });
    await assert.rejects(env.transfer.applyImport(incoming, 'replace'));
    assert.deepEqual(env.history.getState().scans, originalScans);
    assert.equal(env.profile.getState().firstName, 'Original');
    assert.equal(env.profile.getState().lastName, 'User');
    assert.equal(env.profile.getState().avatarUri, originalAvatar);
    assert.deepEqual(sortedIds(env.library), ['lagundi']);
    assert.equal(env.memory.get('hanapmedisina-offline-history'), persistedHistory);
    assert.equal(env.memory.get('hanapmedisina-offline-profile'), persistedProfile);
    assert.deepEqual([...env.files], originalFiles);
  });
}

test('import rejects malformed JSON and unsupported versions with actionable preview errors', async () => {
  const env = environment({}, {
    'file:///broken.json': '{broken',
    'file:///future.json': JSON.stringify(backup({ version: 2 })),
    'file:///wrong-shape.json': JSON.stringify({ version: 1 }),
  });
  await env.ready();
  for (const [path, message] of [['broken', /not valid JSON/], ['future', /Unsupported backup version \(v2\)/], ['wrong-shape', /Invalid backup file structure/]]) {
    const result = await env.transfer.importData(`file:///${path}.json`);
    assert.equal(result.success, false);
    assert.match(result.error, message);
    assert.equal(result.parsedData, undefined);
  }
  assert.equal(env.calls.writes.length, 0);
});

test('import rejects directories and invalid file metadata before attempting a native read', async () => {
  const env = environment();
  await env.ready();
  for (const info of [
    { exists: true, isDirectory: true, size: 10 },
    { exists: true, isDirectory: false, size: -1 },
    { exists: true, isDirectory: false, size: NaN },
    { exists: true, isDirectory: false, size: Infinity },
    { exists: true, isDirectory: false, size: '100' },
  ]) {
    env.fileSystem.getInfoAsync = async () => info;
    assert.equal((await env.transfer.importData('file:///selected.json')).success, false);
  }
  assert.equal(env.calls.reads.length, 0);
});

test('import accepts metadata at the size limit and blocks content exceeding the limit despite smaller metadata', async () => {
  const env = environment({}, { 'file:///limit.json': JSON.stringify(backup()) });
  await env.ready();
  const { MAX_IMPORT_BYTES } = env.transfer;
  env.fileSystem.getInfoAsync = async () => ({ exists: true, isDirectory: false, size: MAX_IMPORT_BYTES });
  assert.equal((await env.transfer.importData('file:///limit.json')).success, true);
  env.fileSystem.getInfoAsync = async () => ({ exists: true, isDirectory: false, size: 100 });
  env.fileSystem.readAsStringAsync = async () => ' '.repeat(MAX_IMPORT_BYTES + 1);
  const result = await env.transfer.importData('file:///limit.json');
  assert.equal(result.success, false);
  assert.match(result.error, /too large/);
});

test('import reports file read and metadata failures without exposing partial parsed data', async () => {
  for (const failure of ['read', 'stat']) {
    const env = environment({}, { 'file:///denied.json': JSON.stringify(backup()) });
    await env.ready();
    env.failures[failure].add('file:///denied.json');
    const result = await env.transfer.importData('file:///denied.json');
    assert.equal(result.success, false);
    assert.match(result.error, /Could not read/);
    assert.equal(result.parsedData, undefined);
    assert.deepEqual(env.history.getState().scans, []);
  }
});

test('backup schema validation rejects malformed object fields without throwing', () => {
  const validate = environment().transfer.validateImportData;
  const invalid = [null, [], 1, 'backup', {},
    backup({ version: '1' }), backup({ exportedAt: '' }), backup({ exportedAt: 42 }),
    backup({ profile: null }), backup({ profile: { firstName: 2, lastName: 'Valid' } }),
    backup({ profile: { firstName: 'Valid', lastName: null } }),
    backup({ profile: { firstName: 'Valid', lastName: 'Valid', avatarBase64: {} } }),
    backup({ scans: {} }), backup({ scans: [null] }), backup({ favorites: 'lagundi' }),
    backup({ favorites: ['lagundi', {}] }),
  ];
  for (const [field, value] of [['id', ''], ['id', 'folder/scan'], ['id', '..\\scan'], ['id', 'a.b'],
    ['plantId', null], ['plantName', false], ['confidence', NaN], ['confidence', Infinity],
    ['confidence', '0.9'], ['scannedAt', 1], ['isFavorite', 1], ['imageBase64', []]]) {
    invalid.push(backup({ scans: [importedScan('valid', { [field]: value })] }));
  }
  for (const [index, candidate] of invalid.entries()) {
    assert.equal(validate(candidate), false, `invalid fixture ${index}`);
  }
  assert.equal(validate(backup()), true);
  assert.equal(validate(backup({ scans: [importedScan('scan_0123-abcd', { confidence: 0 }), importedScan('max', { confidence: 1 })] })), true);
});

test('backup validation rejects out-of-range confidence and invalid scan or export timestamps', () => {
  const validate = environment().transfer.validateImportData;
  for (const confidence of [-0.01, 1.01]) {
    assert.equal(validate(backup({ scans: [importedScan('bad', { confidence })] })), false, `confidence ${confidence}`);
  }
  for (const scannedAt of ['', 'not-a-date']) {
    assert.equal(validate(backup({ scans: [importedScan('bad', { scannedAt })] })), false, `timestamp ${scannedAt}`);
  }
  assert.equal(validate(backup({ exportedAt: 'not-a-date' })), false);
});

test('history sorting and favorite toggles persist across a fresh store instance without mutating source order', async () => {
  const env = environment();
  await env.ready();
  const records = [scan('middle', { scannedAt: '2026-10-14T23:00:00Z' }),
    scan('old', { scannedAt: '2026-10-01T00:00:00Z' }), scan('new', { scannedAt: '2026-10-15T06:00:00Z' })];
  env.history.getState().importScans(records, 'replace');
  assert.deepEqual(env.history.getState().getSortedScans().map(item => item.id), ['new', 'middle', 'old']);
  assert.deepEqual(env.history.getState().scans.map(item => item.id), ['middle', 'old', 'new']);
  env.history.getState().setSortBy('oldest');
  env.history.getState().setViewMode('grid');
  env.history.getState().setActiveTab('favorites');
  env.history.getState().toggleFavorite('middle');
  env.history.getState().toggleFavorite('missing');
  const restarted = environment(Object.fromEntries(env.memory));
  await restarted.ready();
  assert.equal(restarted.history.getState().getScansCount(), 3);
  assert.equal(restarted.history.getState().sortBy, 'oldest');
  assert.equal(restarted.history.getState().viewMode, 'grid');
  assert.equal(restarted.history.getState().activeTab, 'favorites');
  assert.deepEqual(restarted.history.getState().getSortedScans().map(item => item.id), ['old', 'middle', 'new']);
  assert.deepEqual(restarted.history.getState().getFavoriteScans().map(item => item.id), ['middle']);
  restarted.history.getState().toggleFavorite('middle');
  assert.deepEqual(restarted.history.getState().getFavoriteScans(), []);
  assert.equal(restarted.history.getState().getScanById('missing'), undefined);
});

test('rapidly added scans receive distinct IDs, normalized names, and durable records', async () => {
  const env = environment();
  await env.ready();
  for (let index = 0; index < 50; index++) {
    env.history.getState().addScan({ ...scan('ignored'), plantName: 'tSAANG gUBAT' });
  }
  const records = env.history.getState().scans;
  assert.equal(new Set(records.map(record => record.id)).size, 50);
  assert.ok(records.every(record => /^scan_[a-f\d-]{36}$/.test(record.id)));
  assert.ok(records.every(record => record.plantName === 'Tsaang Gubat' && record.isFavorite === false));
  const restarted = environment(Object.fromEntries(env.memory));
  await restarted.ready();
  assert.deepEqual(restarted.history.getState().scans, records);
});

test('bulk history deletion bounds native I/O to eight concurrent files and deletes every requested record', async () => {
  const env = environment();
  await env.ready();
  const records = Array.from({ length: 19 }, (_, index) => scan(`scan_${index}`));
  env.history.getState().importScans(records, 'replace');
  let active = 0;
  let maximum = 0;
  const deleted = [];
  env.fileSystem.deleteAsync = async uri => {
    active++;
    maximum = Math.max(maximum, active);
    await new Promise(resolve => setImmediate(resolve));
    deleted.push(uri);
    active--;
  };
  await env.history.getState().clearAllScans();
  assert.equal(maximum, 8);
  assert.equal(deleted.length, 19);
  assert.deepEqual(env.history.getState().scans, []);
});

test('profile edits, avatar removal, and reset survive restarts while preserving store actions', async () => {
  const env = environment();
  await env.ready();
  env.profile.getState().updateProfile({ firstName: '  María  ', lastName: 'Dela Cruz', isFirstLaunch: false });
  env.profile.getState().setAvatar('file:///profile.jpg');
  const restarted = environment(Object.fromEntries(env.memory));
  await restarted.ready();
  assert.equal(restarted.profile.getState().firstName, '  María  ');
  assert.equal(restarted.profile.getState().lastName, 'Dela Cruz');
  assert.equal(restarted.profile.getState().avatarUri, 'file:///profile.jpg');
  assert.equal(restarted.profile.getState().isFirstLaunch, false);
  restarted.profile.getState().removeAvatar();
  assert.equal(restarted.profile.getState().avatarUri, null);
  restarted.profile.getState().resetProfile();
  const reset = environment(Object.fromEntries(restarted.memory));
  await reset.ready();
  assert.equal(reset.profile.getState().firstName, 'Plant');
  assert.equal(reset.profile.getState().lastName, 'Explorer');
  assert.equal(reset.profile.getState().avatarUri, null);
  assert.equal(reset.profile.getState().isFirstLaunch, false);
  assert.equal(typeof reset.profile.getState().updateProfile, 'function');
});

test('onboarding completion, camera guide, replay, and language selection persist independently', async () => {
  const env = environment();
  await env.ready();
  assert.equal(env.onboarding.getState().completed, false);
  assert.equal(env.onboarding.getState().cameraGuideSeen, false);
  assert.equal(env.settings.getState().language, 'en');
  env.onboarding.getState().complete();
  env.onboarding.getState().markCameraGuideSeen();
  env.settings.getState().setLanguage('tl');
  const restarted = environment(Object.fromEntries(env.memory));
  await restarted.ready();
  assert.equal(restarted.onboarding.getState().completed, true);
  assert.equal(restarted.onboarding.getState().cameraGuideSeen, true);
  assert.equal(restarted.settings.getState().language, 'tl');
  restarted.onboarding.getState().replay();
  const replayed = environment(Object.fromEntries(restarted.memory));
  await replayed.ready();
  assert.equal(replayed.onboarding.getState().completed, false);
  assert.equal(replayed.onboarding.getState().cameraGuideSeen, true);
  assert.equal(replayed.settings.getState().language, 'tl');
});

test('home feed preserves cached content after a failure and recovers on the next refresh', async () => {
  let fail = false;
  const generated = { weeklyTrivia: Array.from({ length: 7 }, (_, id) => ({ id: `fact${id}`, text: `Fact ${id}` })),
    symptoms: [{ id: 'cough', label: 'Cough', icon: 'cloud', plantCount: 2 }], preparationGroups: [] };
  const env = environment({}, {}, { '@/src/services/localFeed': { getHomeFeed: () => {
    if (fail) throw new Error('bad local asset');
    return generated;
  } } });
  await env.ready();
  const store = env.load('src/store/useFeedStore.ts').useFeedStore;
  await store.persist.rehydrate();
  assert.equal(store.getState().getTodayTrivia(), null);
  store.getState().fetchHomeFeed('en');
  const goodTimestamp = store.getState().lastFetchedAt;
  assert.equal(store.getState().getTodayTrivia().id, `fact${new Date().getDay()}`);
  fail = true;
  store.getState().fetchHomeFeed('tl');
  assert.equal(store.getState().feedError.code, 'FETCH_FAILED');
  assert.equal(store.getState().isLoadingFeed, false);
  assert.equal(store.getState().lastFetchedAt, goodTimestamp);
  assert.deepEqual(store.getState().weeklyTrivia, generated.weeklyTrivia);
  assert.deepEqual(store.getState().symptoms, generated.symptoms);
  const saved = JSON.parse(env.memory.get('hanapmedisina-feed-store')).state;
  assert.equal(Object.hasOwn(saved, 'feedError'), false);
  assert.equal(Object.hasOwn(saved, 'isLoadingFeed'), false);
  store.getState().clearFeedError();
  assert.equal(store.getState().feedError, null);
  fail = false;
  store.getState().fetchHomeFeed('en');
  assert.equal(store.getState().feedError, null);
  assert.deepEqual(store.getState().weeklyTrivia, generated.weeklyTrivia);
  const restarted = environment(Object.fromEntries(env.memory));
  await restarted.ready();
  const restored = restarted.load('src/store/useFeedStore.ts').useFeedStore;
  await restored.persist.rehydrate();
  assert.deepEqual(restored.getState().weeklyTrivia, generated.weeklyTrivia);
  assert.equal(restored.getState().feedError, null);
  assert.equal(restored.getState().isLoadingFeed, false);
});
