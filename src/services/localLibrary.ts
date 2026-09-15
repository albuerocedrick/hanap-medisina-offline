import { Image } from 'react-native';
import { MedicinalPlant, ComparisonTraits, ResearchEntry as ResearchItem } from '../types';
import { SymptomItem, PreparationGroup } from '../types/homeFeed';
import { useSettingsStore } from '../store/useSettingsStore';

// Load both datasets
import plantsDataEn from '../data/plants_en.json';
import plantsDataTl from '../data/plants_tl.json';

export { MedicinalPlant, ComparisonTraits, ResearchItem };

const imageMap: Record<string, any> = {
  'guava.jpg': require('../../assets/images/plants/guava.jpg'),
  'oregano.jpg': require('../../assets/images/plants/oregano.jpg'),
  'tsaang-gubat.jpg': require('../../assets/images/plants/tsaang-gubat.jpg'),
  'tawa-tawa.jpg': require('../../assets/images/plants/tawa-tawa.jpg'),
  'mango.jpg': require('../../assets/images/plants/mango.jpg'),
  'guyabano.jpg': require('../../assets/images/plants/guyabano.jpg'),
  'pansit-pansitan.jpg': require('../../assets/images/plants/pansit-pansitan.jpg'),
  'malunggay.jpg': require('../../assets/images/plants/malunggay.jpg'),
  'bayabas.jpg': require('../../assets/images/plants/bayabas.jpg'),
  'kamaria.jpg': require('../../assets/images/plants/kamaria.jpg'),
  'lagundi.jpg': require('../../assets/images/plants/lagundi.jpg'),
  'madre-cacao.jpg': require('../../assets/images/plants/madre-cacao.jpg'),
  'sambong.jpg': require('../../assets/images/plants/sambong.jpg'),
  'serpentina.jpg': require('../../assets/images/plants/serpentina.jpg'),
};

const processPlants = (data: any[]): MedicinalPlant[] => {
  return data.map(p => {
    let resolvedUrl = '';
    if (p.imageSource && imageMap[p.imageSource]) {
      resolvedUrl = Image.resolveAssetSource(imageMap[p.imageSource]).uri;
    }
    return {
      ...p,
      imageUrl: resolvedUrl
    };
  });
};

const plantsEn = processPlants(plantsDataEn);
const plantsTl = processPlants(plantsDataTl);

export function getActivePlants(): MedicinalPlant[] {
  const language = useSettingsStore.getState().language;
  return language === 'tl' ? plantsTl : plantsEn;
}

export function getAllPlants(): MedicinalPlant[] {
  return getActivePlants();
}

export function getAllCategories(): string[] {
  const categories = new Set<string>();
  getActivePlants().forEach(plant => {
    plant.categories.forEach(cat => categories.add(cat));
  });
  return Array.from(categories).sort();
}

export function getPlantById(id: string): MedicinalPlant | undefined {
  return getActivePlants().find(plant => plant.id === id);
}

export function getPlantsByIds(ids: string[]): MedicinalPlant[] {
  return getActivePlants().filter(plant => ids.includes(plant.id));
}

export function getPlantsByCategory(category: string): MedicinalPlant[] {
  return getActivePlants().filter(plant => plant.categories.includes(category));
}

export function searchPlantsLocally(list: MedicinalPlant[], query: string): MedicinalPlant[] {
  const lowercaseQuery = query.toLowerCase();
  
  return list.filter(plant => {
    return (
      (plant.name && plant.name.toLowerCase().includes(lowercaseQuery)) ||
      (plant.scientificName && plant.scientificName.toLowerCase().includes(lowercaseQuery)) ||
      (plant.details?.localName && plant.details.localName.toLowerCase().includes(lowercaseQuery))
    );
  });
}

export function searchPlants(query: string): MedicinalPlant[] {
  return searchPlantsLocally(getActivePlants(), query);
}

/**
 * Symptom label → icon.
 *
 * This used to be an exact-match map keyed on the full lowercased label
 * ("diarrhea relief", "sore throat", ...). But symptom labels are not a fixed
 * vocabulary — getAllSymptoms() derives them from free text in each plant's
 * `preparation[].uses`, which reads like "Relieves diarrhea" or
 * "For stomach ache and cramps". Those never matched a key, so almost every
 * symptom fell through to the "leaf-outline" default and the whole grid
 * rendered as the same leaf repeated. The icons were therefore pure decoration
 * — they carried no information and actively made scanning harder, because
 * identical shapes suppress the visual landmarks people navigate a grid by.
 *
 * Keyword matching fixes the root cause: we look for a distinguishing term
 * anywhere in the label. Ordered most-specific first, since "sore throat"
 * must beat the broader "pain" rule.
 *
 * Each rule carries Tagalog terms alongside the English ones. getAllSymptoms()
 * reads from plants_tl.json when the app is in Tagalog, so an English-only
 * table would have left the entire Tagalog build on the fallback leaf — the
 * exact bug this replaces, just in the other language.
 */
const SYMPTOM_ICON_RULES: Array<{ keywords: string[]; icon: string }> = [
  // Digestive
  { keywords: ["diarrhea", "loose bowel", "dysentery", "pagtatae", "tae"], icon: "water-outline" },
  { keywords: ["constipation", "laxative", "tibi", "paninigas ng dumi"], icon: "swap-vertical-outline" },
  { keywords: ["stomach", "abdominal", "gastric", "ulcer", "sikmura", "tiyan"], icon: "body-outline" },
  { keywords: ["nausea", "vomit", "suka", "alibadbad"], icon: "sad-outline" },
  { keywords: ["digestion", "digestive", "appetite", "bloat", "panunaw", "gana"], icon: "nutrition-outline" },

  // Respiratory
  { keywords: ["cough", "phlegm", "expectorant", "ubo", "plema"], icon: "cloud-outline" },
  { keywords: ["asthma", "breath", "respiratory", "bronch", "hika", "hininga"], icon: "fitness-outline" },
  { keywords: ["throat", "tonsil", "lalamunan"], icon: "thermometer-outline" },
  { keywords: ["cold", "flu", "influenza", "sipon", "trangkaso"], icon: "snow-outline" },
  { keywords: ["fever", "febrile", "lagnat"], icon: "thermometer-outline" },

  // Skin & wounds
  { keywords: ["wound", "cut", "burn", "scar", "sugat", "paso", "hiwa"], icon: "bandage-outline" },
  { keywords: ["skin", "rash", "eczema", "itch", "boil", "acne", "balat", "kati", "pigsa", "tagihawat"], icon: "color-palette-outline" },
  { keywords: ["insect", "bite", "sting", "kagat", "insekto"], icon: "bug-outline" },

  // Oral
  { keywords: ["tooth", "dental", "ngipin", "sakit ng ngipin"], icon: "medical-outline" },
  { keywords: ["gum", "mouth", "oral", "gilagid", "bibig"], icon: "happy-outline" },

  // Pain & inflammation
  { keywords: ["headache", "migraine", "sakit ng ulo"], icon: "flash-outline" },
  { keywords: ["arthritis", "joint", "rheumat", "rayuma", "kasukasuan"], icon: "accessibility-outline" },
  { keywords: ["muscle", "sprain", "cramp", "kalamnan", "pilay", "pulikat"], icon: "barbell-outline" },
  { keywords: ["inflammation", "anti-inflammatory", "swelling", "pamamaga"], icon: "medkit-outline" },
  { keywords: ["pain", "ache", "analgesic", "sakit", "kirot"], icon: "pulse-outline" },

  // Systemic
  { keywords: ["diabetes", "blood sugar", "glucose", "diyabetis", "asukal sa dugo"], icon: "analytics-outline" },
  { keywords: ["blood pressure", "hypertension", "cardio", "heart", "presyon", "puso"], icon: "heart-outline" },
  { keywords: ["kidney", "urinary", "diuretic", "bladder", "bato", "ihi"], icon: "flask-outline" },
  { keywords: ["liver", "hepat", "detox", "atay"], icon: "leaf-outline" },
  { keywords: ["anemia", "blood", "dugo", "anemya"], icon: "water-outline" },

  // Anti-microbial
  { keywords: ["antibacterial", "antiseptic", "antimicrobial", "bakterya"], icon: "shield-checkmark-outline" },
  { keywords: ["antifungal", "fungal", "an-an", "buni"], icon: "shield-half-outline" },
  { keywords: ["parasit", "worm", "deworm", "bulate"], icon: "bug-outline" },

  // Wellbeing
  { keywords: ["sleep", "insomnia", "relax", "calm", "anxiety", "stress", "tulog", "puyat"], icon: "moon-outline" },
  { keywords: ["energy", "fatigue", "tonic", "stamina", "pagod", "lakas"], icon: "flash-outline" },
  { keywords: ["immune", "immunity", "resistensya"], icon: "shield-outline" },
];


/** Resolves an icon by scanning the label for a known keyword. */
function resolveSymptomIcon(label: string): string {
  const haystack = label.toLowerCase();
  for (const rule of SYMPTOM_ICON_RULES) {
    if (rule.keywords.some((keyword) => haystack.includes(keyword))) {
      return rule.icon;
    }
  }
  return "leaf-outline";
}


/**
 * Preparation method → icon. Same keyword approach and same reason: method
 * strings are free text ("Decoction (boiled leaves)"), so exact-match keys
 * missed and every method rendered the fallback leaf.
 */
const METHOD_ICON_RULES: Array<{ keywords: string[]; icon: string }> = [
  { keywords: ["tea", "decoction", "boil", "infusion", "sabaw", "pakuluan"], icon: "cafe-outline" },
  { keywords: ["poultice", "compress", "tapal", "pampalapot"], icon: "bandage-outline" },
  { keywords: ["rinse", "gargle", "wash", "mumog", "banlaw"], icon: "water-outline" },
  { keywords: ["juice", "extract", "crush", "katas", "pigain"], icon: "beaker-outline" },
  { keywords: ["oil", "ointment", "salve", "langis", "pamahid"], icon: "flask-outline" },
  { keywords: ["powder", "dried", "capsule", "pulbos", "tuyo"], icon: "cube-outline" },
  { keywords: ["raw", "fresh", "chew", "eat", "hilaw", "sariwa", "nguya"], icon: "leaf-outline" },
  { keywords: ["steam", "inhale", "suob", "singaw"], icon: "cloud-outline" },
  { keywords: ["bath", "soak", "ligo", "babad"], icon: "thermometer-outline" },
];

/** Resolves a method icon by scanning for a known keyword. */
function resolveMethodIcon(method: string): string {
  const haystack = method.toLowerCase();
  for (const rule of METHOD_ICON_RULES) {
    if (rule.keywords.some((keyword) => haystack.includes(keyword))) {
      return rule.icon;
    }
  }
  return "leaf-outline";
}


export function getAllSymptoms(): SymptomItem[] {
  const symptomCounts: Record<string, number> = {};
  getActivePlants().forEach(plant => {
    plant.details?.preparation?.forEach(prep => {
      prep.uses?.forEach(use => {
        const key = use.trim();
        symptomCounts[key] = (symptomCounts[key] || 0) + 1;
      });
    });
  });
  
  return Object.entries(symptomCounts).map(([label, count]) => {
    const lowerLabel = label.toLowerCase();
    const id = lowerLabel.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const icon = resolveSymptomIcon(label);

    return {
      id,
      label,
      icon,
      plantCount: count
    };
  }).sort((a, b) => b.plantCount - a.plantCount);
}

export function getPlantsBySymptom(symptom: string): MedicinalPlant[] {
  const query = symptom.toLowerCase();
  return getActivePlants().filter(plant => 
    plant.details?.preparation?.some(prep => 
      prep.uses?.some(use => use.toLowerCase().includes(query))
    )
  );
}

export function getAllPreparationGroups(): PreparationGroup[] {
  const methodMap: Record<string, { count: number; plantIds: Set<string> }> = {};
  
  getActivePlants().forEach(plant => {
    plant.details?.preparation?.forEach(prep => {
      const method = prep.method.trim();
      if (!methodMap[method]) {
        methodMap[method] = { count: 0, plantIds: new Set() };
      }
      methodMap[method].plantIds.add(plant.id);
    });
  });

  return Object.entries(methodMap).map(([method, data]) => {
    const icon = resolveMethodIcon(method);
    return {

      method,
      icon,
      plantCount: data.plantIds.size,
      plantIds: Array.from(data.plantIds)
    };
  }).sort((a, b) => b.plantCount - a.plantCount);
}

export function getPlantsByPreparationMethod(method: string): MedicinalPlant[] {
  const query = method.toLowerCase();
  return getActivePlants().filter(plant => 
    plant.details?.preparation?.some(prep => 
      prep.method.toLowerCase().includes(query)
    )
  );
}
