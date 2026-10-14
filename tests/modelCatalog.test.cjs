const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const filename = path.resolve(__dirname, '../src/services/modelLabels.ts');
const loaded = { exports: {} };
const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
new Function('module', 'exports', compiled)(loaded, loaded.exports);
const { getPlantIdForModelLabel } = loaded.exports;
const labels = fs.readFileSync(path.resolve(__dirname, '../assets/model/labels.txt'), 'utf8').trim().split(/\r?\n/);
const catalogs = ['en', 'tl'].map(language => require(`../src/data/plants_${language}.json`));

test('the active TFLite output matches the 14 plants plus Unknown labels', () => {
  const hookPath = path.resolve(__dirname, '../src/hooks/useTFLite.ts');
  const modelRequire = fs.readFileSync(hookPath, 'utf8').match(/require\("([^"\n]+\.tflite)"\)/);
  assert.ok(modelRequire, 'the active model must be bundled');
  const bytes = fs.readFileSync(path.resolve(path.dirname(hookPath), modelRequire[1]));
  assert.equal(bytes.toString('ascii', 4, 8), 'TFL3');
  const pointer = offset => offset + bytes.readUInt32LE(offset);
  const field = (table, slot) => {
    const vtable = table - bytes.readInt32LE(table);
    const entry = 4 + slot * 2;
    assert.ok(entry < bytes.readUInt16LE(vtable), `missing TFLite field ${slot}`);
    const offset = bytes.readUInt16LE(vtable + entry);
    assert.ok(offset);
    return table + offset;
  };
  const subgraphs = pointer(field(bytes.readUInt32LE(0), 2));
  const graph = pointer(subgraphs + 4);
  const outputs = pointer(field(graph, 2));
  assert.equal(bytes.readUInt32LE(outputs), 1);
  const tensorIndex = bytes.readInt32LE(outputs + 4);
  const tensors = pointer(field(graph, 0));
  const tensor = pointer(tensors + 4 + tensorIndex * 4);
  const shape = pointer(field(tensor, 0));
  const dimensions = Array.from({ length: bytes.readUInt32LE(shape) }, (_, i) => bytes.readInt32LE(shape + 4 + i * 4));
  assert.deepEqual(dimensions, [1, labels.length]);
  assert.equal(labels.length, 15);
  assert.equal(labels.filter(label => getPlantIdForModelLabel(label) !== null).length, 14);
  assert.equal(labels.filter(label => getPlantIdForModelLabel(label) === null).length, 1);
});

test('every trained plant links to a complete offline entry in both languages', () => {
  const trainedIds = labels.map(getPlantIdForModelLabel).filter(Boolean);
  assert.equal(new Set(trainedIds).size, 14);
  for (const catalog of catalogs) {
    assert.equal(new Set(catalog.map(plant => plant.id)).size, catalog.length);
    for (const id of trainedIds) {
      const plant = catalog.find(plant => plant.id === id);
      assert.ok(plant, `missing trained plant ${id}`);
      assert.ok(plant.scientificName && plant.details.localName);
      assert.ok(plant.details.preparation.length && plant.details.warnings.length);
      assert.ok(fs.existsSync(path.resolve(__dirname, '../assets/images/plants', plant.imageSource)));
    }
    assert.ok(!catalog.some(plant => plant.id.toLowerCase().startsWith('unknown')));
  }
  assert.deepEqual(catalogs[0].map(plant => plant.id).sort(), catalogs[1].map(plant => plant.id).sort());
});

test('Tubang Bakod resolves to Tuba-tuba and Unknown remains rejected', () => {
  assert.equal(getPlantIdForModelLabel(' Tubang Bakod '), 'tuba-tuba');
  assert.equal(getPlantIdForModelLabel('Litlit'), 'litlit');
  assert.equal(getPlantIdForModelLabel('Madre cacao'), 'madre-cacao');
  assert.equal(getPlantIdForModelLabel('Unknown'), null);
  assert.equal(getPlantIdForModelLabel(''), null);
});
