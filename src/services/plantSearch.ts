import type { MedicinalPlant } from "../types";
import plantsEn from "../data/plants_en.json";
import plantsTl from "../data/plants_tl.json";

const normalize = (value: string) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
const aliases = [
  ["cough", "ubo"], ["fever", "lagnat"], ["cold", "colds", "sipon"],
  ["flu", "trangkaso"], ["asthma", "hika"], ["headache", "sakit ng ulo"],
  ["stomach ache", "stomachache", "stomach pain", "sakit ng tiyan", "sakit sa tiyan", "sakit ng sikmura"],
  ["diarrhea", "diarrhoea", "pagtatae"], ["constipation", "tibi", "paninigas ng dumi"],
  ["sore throat", "sakit ng lalamunan", "masakit na lalamunan"],
  ["toothache", "tooth pain", "sakit ng ngipin"], ["wound", "wounds", "sugat"],
  ["itch", "itching", "makati", "kati"], ["burn", "burns", "paso"],
  ["arthritis", "rayuma"], ["nausea", "pagduduwal"],
];
const stopWords = new Set("a an the for to of and or with what which can help helps cure cures treat treats treating relief relieve relieves plant plants herb herbs medicinal i have my ako may para sa ang ng mga na at ay ano halamang halaman gamot pang".split(" "));
const records = new Map<string, MedicinalPlant[]>();
const fieldCache = new WeakMap<MedicinalPlant, { names: string[]; uses: string; description: string; categories: string }>();
function getFields(record: MedicinalPlant) {
  let fields = fieldCache.get(record);
  if (!fields) {
    fields = {
      names: [record.name, record.scientificName, record.details?.localName].filter(Boolean).map(normalize),
      uses: normalize((record.details?.preparation || []).flatMap(preparation => preparation.uses).join(" ")),
      description: normalize(record.shortDescription || ""),
      categories: normalize((record.categories || []).join(" ")),
    };
    fieldCache.set(record, fields);
  }
  return fields;
}
for (const plant of [...plantsEn, ...plantsTl]) {
  const variants = records.get(plant.id) || [];
  variants.push(plant as MedicinalPlant);
  records.set(plant.id, variants);
}

function queryVariants(query: string): string[][] {
  let variants = [query];
  for (const group of aliases) {
    const match = group.find(term => (` ${query} `).includes(` ${term} `));
    if (match) variants = [...new Set([...variants, ...variants.flatMap(value => group.map(term => (` ${value} `).replace(` ${match} `, ` ${term} `).trim()))])].slice(0, 32);
  }
  return variants.map(value => value.split(" ").filter(word => word && !stopWords.has(word))).filter(words => words.length > 0);
}

const symptomLabelsTl: Record<string, string> = {
  cough: "Ubo", fever: "Lagnat", cold: "Sipon", flu: "Trangkaso", asthma: "Hika",
  headache: "Sakit ng ulo", "stomach ache": "Sakit ng tiyan", diarrhea: "Pagtatae",
  constipation: "Tibi", "sore throat": "Sakit ng lalamunan", toothache: "Sakit ng ngipin",
  wound: "Sugat", itch: "Pangangati", burn: "Paso", arthritis: "Rayuma", nausea: "Pagduduwal",
};
const titleCase = (value: string) => value.replace(/\b[a-z]/g, letter => letter.toUpperCase());
const containsTerms = (text: string, terms: string[]) => {
  const words = text.split(" ");
  return terms.every(term => words.some(word => term.length < 3 ? word === term : word.startsWith(term)));
};
const matchesDocumentedUse = (plant: MedicinalPlant, query: string) => {
  const variants = queryVariants(normalize(query));
  return [plant, ...(records.get(plant.id) || [])].some(record => {
    const fields = getFields(record);
    return variants.some(terms => containsTerms(fields.uses, terms) || containsTerms(fields.categories, terms));
  });
};

export interface PlantSearchGroup { key: string; label: string | null; plants: MedicinalPlant[]; }

export function groupPlantSearchResults(results: MedicinalPlant[], query: string, language: "en" | "tl"): PlantSearchGroup[] {
  if (!results.length) return [];
  const normalized = normalize(query);
  const groups: PlantSearchGroup[] = [];
  const grouped = new Set<string>();
  for (const aliasesForSymptom of aliases) {
    const matchesQuery = aliasesForSymptom.some(term => (` ${normalized} `).includes(` ${term} `) || (normalized.length >= 3 && term.startsWith(normalized)));
    if (!matchesQuery) continue;
    const key = aliasesForSymptom[0];
    const plants = results.filter(plant => matchesDocumentedUse(plant, key));
    if (!plants.length) continue;
    groups.push({ key, label: language === "tl" ? symptomLabelsTl[key] : titleCase(key), plants });
    plants.forEach(plant => grouped.add(plant.id));
  }
  // Symptoms outside the alias table still get a heading when the query
  // matches a documented use or category, rather than just a plant name.
  if (!groups.length) {
    const terms = normalized.split(" ").filter(word => word && !stopWords.has(word));
    const symptomMatches = results.filter(plant => matchesDocumentedUse(plant, query));
    if (terms.length && symptomMatches.length) {
      groups.push({ key: "documented-use", label: titleCase(terms.join(" ")), plants: symptomMatches });
      symptomMatches.forEach(plant => grouped.add(plant.id));
    }
  }
  const remaining = results.filter(plant => !grouped.has(plant.id));
  if (remaining.length) groups.push({ key: "plants", label: null, plants: remaining });
  return groups;
}

// Search the documented uses, never warnings, research, or growing instructions.
// Return the caller's records so images, language, and filters stay intact.
export function searchPlantRecords(list: MedicinalPlant[], query: string): MedicinalPlant[] {
  const normalized = normalize(query);
  if (!normalized) return list;
  const variants = queryVariants(normalized);
  if (!variants.length) return [];
  return list.map((plant, position) => {
    let score = 0;
    for (const record of [plant, ...(records.get(plant.id) || [])]) {
      const { names, uses, description, categories } = getFields(record);
      for (const terms of variants) {
        const phrase = terms.join(" ");
        if (names.some(name => name.includes(phrase) || containsTerms(name, terms))) score = Math.max(score, names.some(name => name === phrase) ? 120 : 100);
        if (containsTerms(uses, terms)) score = Math.max(score, 70);
        if (containsTerms(categories, terms)) score = Math.max(score, 50);
        if (containsTerms(description, terms)) score = Math.max(score, 30);
      }
    }
    return { plant, score, position };
  }).filter(result => result.score > 0).sort((a, b) => b.score - a.score || a.position - b.position).map(result => result.plant);
}
