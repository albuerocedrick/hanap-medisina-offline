const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { createLoader } = require('./helpers/loadTypeScript.cjs');

const catalogs = { en: require('../src/data/plants_en.json'), tl: require('../src/data/plants_tl.json') };
let language = 'en';
const useSettingsStore = selector => selector({ language });
useSettingsStore.getState = () => ({ language });
const resolvedAssets = [];
const loader = createLoader({
  'react-native': { Image: { resolveAssetSource: asset => {
    const file = path.resolve(__dirname, '../src/services', asset);
    assert.ok(fs.existsSync(file), `missing required offline image ${asset}`);
    resolvedAssets.push(asset);
    return { uri: `asset://${asset}` };
  } } },
  '@/src/store/useSettingsStore': { useSettingsStore },
});
const library = loader.load('src/services/localLibrary.ts');
const { getHomeFeed } = loader.load('src/services/localFeed.ts');
const { getTranslation, useTranslation } = loader.load('src/i18n/useTranslation.ts');
const dictionaries = { en: loader.load('src/i18n/en.ts').default, tl: loader.load('src/i18n/tl.ts').default };
const { lightTheme, darkTheme, MIN_TOUCH_TARGET } = loader.load('src/theme/tokens.ts');
const { getPlantCategoryLabel, getPlantFactLabel } = loader.load('src/i18n/plantLabels.ts');
const ids = rows => rows.map(row => row.id).sort();
const text = (value, location) => assert.ok(typeof value === 'string' && value.trim().length > 0, `${location} must be nonempty text`);
const textList = (value, location) => {
  assert.ok(Array.isArray(value) && value.length > 0, `${location} must be a nonempty list`);
  value.forEach((entry, index) => text(entry, `${location}[${index}]`));
};

for (const locale of ['en', 'tl']) test(`all 30 ${locale} plant profiles satisfy the fields consumed by every detail tab`, () => {
  assert.equal(catalogs[locale].length, 30);
  for (const plant of catalogs[locale]) {
    for (const key of ['id', 'name', 'scientificName', 'shortDescription', 'imageSource']) text(plant[key], `${locale}.${plant.id}.${key}`);
    assert.match(plant.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    textList(plant.categories, `${plant.id}.categories`);
    assert.equal(new Set(plant.categories).size, plant.categories.length, `${plant.id} repeats a category`);
    text(plant.details.localName, `${plant.id}.details.localName`);
    textList(plant.details.warnings, `${plant.id}.warnings`);
    assert.ok(plant.details.preparation.length > 0, `${plant.id} has no preparations`);
    for (const preparation of plant.details.preparation) {
      text(preparation.method, `${plant.id}.preparation.method`);
      text(preparation.description, `${plant.id}.preparation.description`);
      textList(preparation.uses, `${plant.id}.preparation.uses`);
    }
    for (const key of ['origin', 'family', 'habitat']) {
      text(plant.details.facts[key], `${plant.id}.facts.${key}`);
      text(getPlantFactLabel(key, locale), `${plant.id}.fact label ${key}`);
    }
    for (const key of ['climate', 'soil', 'sunlight', 'watering', 'propagation', 'growthTime']) text(plant.cultivationGuide[key], `${plant.id}.cultivationGuide.${key}`);
    textList(plant.cultivationGuide.tips, `${plant.id}.cultivationGuide.tips`);
    assert.ok(plant.research.length > 0, `${plant.id} has no research entries`);
    for (const entry of plant.research) {
      for (const key of ['title', 'summary', 'reference']) text(entry[key], `${plant.id}.research.${key}`);
      // Zero explicitly denotes an undated reference; ResearchTab hides it.
      assert.ok(Number.isInteger(entry.year) && (entry.year === 0 || (entry.year >= 1800 && entry.year <= new Date().getFullYear())), `${plant.id} has invalid publication year`);
    }
    for (const trait of ['leaf', 'flower', 'stem', 'smell']) text(plant.comparisonTraits[trait], `${plant.id}.comparisonTraits.${trait}`);
  }
});

test('every look-alike navigation target exists, differs from its source and has comparison traits in both languages', () => {
  for (const [locale, plants] of Object.entries(catalogs)) {
    const byId = new Map(plants.map(plant => [plant.id, plant]));
    for (const plant of plants) {
      assert.ok(Array.isArray(plant.lookAlikeIds), `${plant.id} needs a look-alike list`);
      assert.equal(new Set(plant.lookAlikeIds).size, plant.lookAlikeIds.length, `${plant.id} repeats a comparison target`);
      for (const targetId of plant.lookAlikeIds) {
        assert.notEqual(targetId, plant.id, `${locale}.${plant.id} compares with itself`);
        const target = byId.get(targetId);
        assert.ok(target, `${locale}.${plant.id} links to missing ${targetId}`);
        for (const trait of ['leaf', 'flower', 'stem', 'smell']) text(target.comparisonTraits[trait], `${locale}.${targetId}.${trait}`);
      }
    }
  }
});

test('all bundled plant images resolve offline through the library mapping and every category links back to its plants', () => {
  for (const locale of ['en', 'tl']) {
    language = locale;
    const plants = library.getAllPlants();
    assert.deepEqual(ids(plants), ids(catalogs[locale]));
    for (const plant of plants) {
      assert.match(plant.imageUrl, /^asset:\/\//, `${locale}.${plant.id} cannot display its bundled image`);
      assert.equal(library.getPlantById(plant.id), plant);
      assert.deepEqual(ids(library.getPlantsByIds([plant.id, 'does-not-exist'])), [plant.id]);
    }
    for (const category of library.getAllCategories()) {
      assert.deepEqual(ids(library.getPlantsByCategory(category)), ids(plants.filter(plant => plant.categories.includes(category))));
      assert.notEqual(getPlantCategoryLabel(category, locale), category, `missing ${locale} label for ${category}`);
    }
  }
  assert.ok(resolvedAssets.length >= 30, 'exercise the actual lazy image getters');
  assert.equal(library.getPlantById('does-not-exist'), undefined);
  assert.deepEqual(library.getPlantsByIds([]), []);
});

for (const locale of ['en', 'tl']) test(`${locale} symptom cards count distinct plants and their links contain every counted plant`, () => {
  language = locale;
  const expected = new Map();
  for (const plant of catalogs[locale]) for (const prep of plant.details.preparation) for (const use of prep.uses) {
    const label = use.trim();
    if (!expected.has(label)) expected.set(label, new Set());
    expected.get(label).add(plant.id);
  }
  const symptoms = library.getAllSymptoms(locale);
  assert.equal(symptoms.length, expected.size);
  assert.equal(new Set(symptoms.map(row => row.id)).size, symptoms.length, 'symptom IDs must remain unique list keys');
  for (const symptom of symptoms) {
    const plantIds = expected.get(symptom.label);
    assert.equal(symptom.plantCount, plantIds.size, `${locale}.${symptom.label} counts a plant more than once`);
    text(symptom.icon, `${symptom.label}.icon`);
    // Links intentionally use substring matching, so a longer label may also
    // match. Every plant counted by the card must be present in its results.
    const linkedIds = new Set(library.getPlantsBySymptom(symptom.label).map(plant => plant.id));
    for (const id of plantIds) assert.ok(linkedIds.has(id), `${symptom.label} does not open counted plant ${id}`);
  }
});

for (const locale of ['en', 'tl']) test(`${locale} preparation cards contain unique valid plant IDs and open their actual remedies`, () => {
  language = locale;
  for (const group of library.getAllPreparationGroups(locale)) {
    text(group.method, `${locale}.preparation.method`);
    text(group.icon, `${locale}.${group.method}.icon`);
    const expected = catalogs[locale].filter(plant => plant.details.preparation.some(prep => prep.method.trim() === group.method));
    assert.deepEqual([...group.plantIds].sort(), ids(expected));
    assert.equal(group.plantCount, new Set(group.plantIds).size);
    const linked = new Set(library.getPlantsByPreparationMethod(group.method).map(plant => plant.id));
    for (const id of group.plantIds) assert.ok(linked.has(id), `${group.method} misses ${id}`);
  }
});

test('home feed provides seven stable, nonempty trivia cards with valid symptom and preparation links in both languages', () => {
  for (const locale of ['en', 'tl']) {
    language = locale;
    const feed = getHomeFeed(locale);
    assert.equal(feed.weeklyTrivia.length, 7);
    assert.equal(new Set(feed.weeklyTrivia.map(row => row.id)).size, 7);
    assert.deepEqual(getHomeFeed(locale), feed, 'daily ordering must be stable during a session');
    feed.weeklyTrivia.forEach(item => { text(item.id, 'trivia.id'); text(item.text, 'trivia.text'); });
    assert.deepEqual(feed.symptoms, library.getAllSymptoms(locale));
    assert.deepEqual(feed.preparationGroups, library.getAllPreparationGroups(locale));
  }
});

const placeholders = value => [...value.matchAll(/\{([a-zA-Z][\w]*)\}/g)].map(match => match[1]).sort();
test('English and Tagalog UI dictionaries have the same nonempty keys and interpolation placeholders', () => {
  assert.deepEqual(Object.keys(dictionaries.en).sort(), Object.keys(dictionaries.tl).sort());
  assert.ok(Object.keys(dictionaries.en).length > 100, 'the production dictionaries must be loaded');
  for (const key of Object.keys(dictionaries.en)) {
    for (const locale of ['en', 'tl']) {
      text(dictionaries[locale][key], `${locale}.${key}`);
      assert.equal(getTranslation(key, locale), dictionaries[locale][key]);
    }
    assert.deepEqual(placeholders(dictionaries.tl[key]), placeholders(dictionaries.en[key]), `translation changes required substitutions in ${key}`);
  }
});

test('every literal UI translation call resolves to a bundled key', () => {
  const files = [];
  const visit = directory => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const filename = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(filename);
      else if (/\.tsx?$/.test(filename)) files.push(filename);
    }
  };
  visit(path.resolve(__dirname, '../app'));
  visit(path.resolve(__dirname, '../src'));
  let checked = 0;
  for (const filename of files) {
    const ast = ts.createSourceFile(filename, fs.readFileSync(filename, 'utf8'), ts.ScriptTarget.Latest, true);
    function inspect(node) {
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && ['t', 'getTranslation'].includes(node.expression.text)
          && node.arguments[0] && ts.isStringLiteralLike(node.arguments[0])) {
        const key = node.arguments[0].text;
        assert.ok(Object.hasOwn(dictionaries.en, key), `${path.relative(path.resolve(__dirname, '..'), filename)} uses unknown translation ${key}`);
        checked++;
      }
      ts.forEachChild(node, inspect);
    }
    inspect(ast);
  }
  assert.ok(checked > 100, 'scan actual screen and component translation calls');
});

test('translation hooks follow selected language and recover safely to English for unsupported language values', () => {
  for (const locale of ['en', 'tl']) {
    language = locale;
    const translation = useTranslation();
    assert.equal(translation.language, locale);
    assert.equal(translation.t('capture_photo'), dictionaries[locale].capture_photo);
  }
  language = 'unsupported';
  assert.equal(useTranslation().t('capture_photo'), dictionaries.en.capture_photo);
  assert.equal(getTranslation('capture_photo', 'unsupported'), dictionaries.en.capture_photo);
  assert.equal(getTranslation('missing-key', 'tl'), 'missing-key');
  language = 'en';
});

function color(value, background = [255, 255, 255]) {
  if (/^#[\da-f]{6}$/i.test(value)) return [1, 3, 5].map(start => parseInt(value.slice(start, start + 2), 16));
  if (value === 'transparent') return background;
  const match = /^rgba\((\d+),(\d+),(\d+),([\d.]+)\)$/.exec(value);
  assert.ok(match, `unsupported theme color ${value}`);
  const alpha = Number(match[4]);
  return match.slice(1, 4).map((channel, index) => Number(channel) * alpha + background[index] * (1 - alpha));
}
const luminance = channels => channels.map(channel => {
  const value = channel / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
function contrast(foreground, background, behind) {
  const bg = color(background, behind ? color(behind) : undefined);
  const a = luminance(color(foreground, bg));
  const b = luminance(bg);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

test('both themes provide every semantic token, legible primary labels and accessible action/icon contrast', () => {
  assert.deepEqual(Object.keys(lightTheme).sort(), Object.keys(darkTheme).sort());
  assert.ok(MIN_TOUCH_TARGET >= 48);
  for (const [name, theme] of [['light', lightTheme], ['dark', darkTheme]]) {
    for (const [key, value] of Object.entries(theme)) {
      if (Array.isArray(value)) { assert.equal(value.length, 3); value.forEach(stop => color(stop)); }
      else color(value);
    }
    for (const surface of ['bg', 'surface', 'surfaceTint', 'surfacePressed']) {
      assert.ok(contrast(theme.textPrimary, theme[surface]) >= 4.5, `${name} primary text fails on ${surface}`);
    }
    for (const foreground of ['textSecondary', 'textMuted']) assert.ok(contrast(theme[foreground], theme.bg) >= 4.5, `${name} ${foreground} fails on bg`);
    for (const [foreground, background] of [['textOnAccent', 'accent'], ['onDangerAction', 'dangerAction'], ['selectionText', 'selectionSurface']]) {
      assert.ok(contrast(theme[foreground], theme[background], theme.bg) >= 4.5, `${name} ${foreground} fails on ${background}`);
    }
    assert.ok(contrast(theme.iconInactive, theme.bg) >= 3, `${name} inactive icons fail 3:1 contrast`);
  }
});
