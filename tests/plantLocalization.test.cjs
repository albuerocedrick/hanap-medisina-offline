const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const english = require('../src/data/plants_en.json');
const tagalog = require('../src/data/plants_tl.json');

const filename = path.resolve(__dirname, '../src/i18n/plantLabels.ts');
const loaded = { exports: {} };
const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
new Function('module', 'exports', compiled)(loaded, loaded.exports);
const { getPlantCategoryLabel, getPlantFactLabel } = loaded.exports;
const numbers = value => (value.match(/\d+(?:[.,]\d+)*/g) || []).sort();
const properSourceNames = new Set([
  'U.S. Food and Drug Administration.',
  'Silva H, Bárbara R. Biology. 2022;11(10):1382.',
  'Philippine Traditional Knowledge Digital Library: Piper retrofractum',
]);

test('all 30 Tagalog profiles translate narrative text and retain numeric information', () => {
  assert.equal(tagalog.length, 30);
  function compare(source, translated, location) {
    if (typeof source === 'string') {
      assert.equal(typeof translated, 'string', location);
      assert.ok(translated.trim(), location);
      if (/scientificName|reference|\.name$|\.localName$|categories|lookAlikeIds|imageSource|\.id$|facts\.family/.test(location)) return;
      assert.deepEqual(numbers(translated), numbers(source), `numeric information changed at ${location}`);
      if (source.split(/\s+/).length > 3 && !properSourceNames.has(source)) {
        assert.notEqual(translated, source, `English text remains at ${location}`);
      }
    } else if (Array.isArray(source)) {
      assert.equal(translated.length, source.length, location);
      source.forEach((value, index) => compare(value, translated[index], `${location}.${index}`));
    } else if (source && typeof source === 'object') {
      assert.deepEqual(Object.keys(translated).sort(), Object.keys(source).sort(), location);
      for (const key of Object.keys(source)) compare(source[key], translated[key], `${location}.${key}`);
    } else {
      assert.equal(translated, source, location);
    }
  }
  for (const source of english) compare(source, tagalog.find(plant => plant.id === source.id), source.id);
});

test('language-specific display text preserves IDs, scientific names, citations, and categories', () => {
  for (const source of english) {
    const translated = tagalog.find(plant => plant.id === source.id);
    assert.equal(translated.scientificName, source.scientificName);
    assert.equal(translated.imageSource, source.imageSource);
    assert.deepEqual(translated.categories, source.categories);
    assert.deepEqual(translated.lookAlikeIds, source.lookAlikeIds);
    translated.research.forEach((study, index) => {
      assert.equal(study.reference, source.research[index].reference);
      assert.equal(study.year, source.research[index].year);
    });
    for (const category of source.categories) {
      assert.notEqual(getPlantCategoryLabel(category, 'tl'), category);
      assert.ok(getPlantCategoryLabel(category, 'en'));
    }
    for (const fact of Object.keys(source.details.facts)) {
      assert.notEqual(getPlantFactLabel(fact, 'tl'), fact);
    }
  }
  assert.equal(tagalog.find(plant => plant.id === 'mango').name, 'Mangga');
  assert.equal(tagalog.find(plant => plant.id === 'tamarind').name, 'Sampalok');
});
