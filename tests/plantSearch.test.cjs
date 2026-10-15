const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { createRequire } = require("node:module");
const ts = require("typescript");
const filename = path.resolve(__dirname, "../src/services/plantSearch.ts");
const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
const loaded = { exports: {} };
new Function("require", "module", "exports", compiled)(createRequire(filename), loaded, loaded.exports);
const { searchPlantRecords: search, searchPlantNames: searchNames, groupPlantSearchResults: group } = loaded.exports;
const en = require("../src/data/plants_en.json");
const tl = require("../src/data/plants_tl.json");
const ids = (list, query) => search(list, query).map(plant => plant.id);

test("symptom and natural-language queries find documented uses before Library is loaded", () => {
  assert.ok(ids(en, "cough").includes("lagundi"));
  assert.ok(ids(en, "plants for cough").includes("oregano"));
  assert.ok(ids(en, "stomach ache").includes("tsaang-gubat"));
});
test("English and Tagalog symptoms work in both interface languages", () => {
  for (const list of [en, tl]) {
    assert.ok(ids(list, "ubo").includes("lagundi"));
    assert.ok(ids(list, "lagnat").includes("tawa-tawa"));
    assert.ok(ids(list, "sakit ng tiyan").includes("tsaang-gubat"));
    assert.ok(ids(list, "cough").includes("oregano"));
  }
});
test("plant names still rank first; whitespace and case are normalized", () => {
  assert.equal(ids(en, "  LaGuNdI  ")[0], "lagundi");
  assert.ok(ids(en, "vitex negundo").includes("lagundi"));
  assert.deepEqual(search(en, "   "), en);
  assert.deepEqual(search(en, "zzunknownzz"), []);
});

test("new trained plants and alternate model names are searchable in both languages", () => {
  for (const list of [en, tl]) {
    assert.equal(ids(list, "litlit")[0], "litlit");
    assert.equal(ids(list, "piper retrofractum")[0], "litlit");
    assert.equal(ids(list, "tubang bakod")[0], "tuba-tuba");
    assert.ok(ids(list, "cough").includes("litlit"));
    assert.ok(ids(list, "ubo").includes("litlit"));
    assert.ok(ids(list, "sakit ng tiyan").includes("litlit"));
  }
});
test("search preserves supplied filters, records, and language", () => {
  const subset = en.filter(plant => plant.id === "oregano");
  assert.deepEqual(ids(subset, "cough"), ["oregano"]);
  assert.strictEqual(search(subset, "cough")[0], subset[0]);
});
test("warnings and growing instructions do not become symptom matches", () => {
  const fixture = { ...en[0], id: "test-only", name: "Test plant", scientificName: "Testus", shortDescription: "A green leaf", categories: [], details: { localName: "Test", preparation: [{ uses: ["Cough"] }], warnings: ["Avoid during pregnancy"] }, cultivationGuide: { tips: ["Protect from fever"] } };
  assert.deepEqual(search([fixture], "pregnancy"), []);
  assert.deepEqual(search([fixture], "fever"), []);
  assert.deepEqual(ids([fixture], "cough"), ["test-only"]);
});

test("symptom headings count actual matching plants and translate bilingual queries", () => {
  for (const query of ["fever", "lagnat", "fev", "plants for fever"]) {
    const matches = search(en, query);
    const sections = group(matches, query, "en");
    const fever = sections.find(section => section.key === "fever");
    assert.equal(fever.label, "Fever");
    assert.ok(fever.plants.length > 0);
    assert.equal(new Set(fever.plants.map(plant => plant.id)).size, fever.plants.length);
    assert.deepEqual(new Set(sections.flatMap(section => section.plants.map(plant => plant.id))), new Set(matches.map(plant => plant.id)));
  }
  assert.equal(group(search(tl, "fever"), "fever", "tl")[0].label, "Lagnat");
  assert.equal(group(search(en, "ubo"), "ubo", "en")[0].label, "Cough");
});
test("plant names stay in a plant section and unknown symptoms use documented headings", () => {
  assert.equal(group(search(en, "lagundi"), "lagundi", "en")[0].label, null);
  assert.equal(group(search(en, "eczema"), "eczema", "en")[0].label, "Eczema");
  assert.deepEqual(group([], "fever", "en"), []);
});

test("Library name search supports common, local and scientific names in either language", () => {
  for (const list of [en, tl]) {
    assert.equal(searchNames(list, "  LaGuNdI  ")[0].id, "lagundi");
    assert.equal(searchNames(list, "vitex negundo")[0].id, "lagundi");
    assert.equal(searchNames(list, "tubang bakod")[0].id, "tuba-tuba");
    assert.equal(searchNames(list, "mangga")[0].id, "mango");
    assert.strictEqual(searchNames(list, "   "), list);
  }
});

test("Library name search excludes symptoms, categories and descriptive text", () => {
  for (const list of [en, tl]) {
    for (const query of ["cough", "ubo", "fever", "lagnat", "sakit ng tiyan", "plants for cough"]) {
      assert.deepEqual(searchNames(list, query), []);
    }
  }
  const fixture = { ...en[0], id: "test-only", name: "Test plant", scientificName: "Testus", shortDescription: "A cough remedy", categories: ["fever"], details: { localName: "Test", preparation: [{ uses: ["Cough"] }] } };
  assert.deepEqual(searchNames([fixture], "cough"), []);
  assert.deepEqual(searchNames([fixture], "fever"), []);
  assert.strictEqual(searchNames([fixture], "test")[0], fixture);
});
