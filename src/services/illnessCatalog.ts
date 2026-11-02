import type { MedicinalPlant } from '@/src/types';
import type { SymptomItem } from '@/src/types/homeFeed';
import type { AppLanguage } from '@/src/store/useSettingsStore';
import { getPlantCatalog } from './plantCatalog';

/**
 * Only explicitly named illnesses from the bundled preparation uses belong in
 * illness browsing. A symptom, injury, wellness benefit or general "support"
 * claim does not establish an illness association. Keep that original text in
 * the searchable plant profiles, rather than presenting it as an illness card.
 * English source terms identify records; labels and records remain localized.
 */
const ILLNESSES = [
  { id: 'eczema', en: 'Eczema', tl: 'Eksema', icon: 'color-palette-outline', use: /\beczema\b/i },
  { id: 'arthritis', en: 'Arthritis', tl: 'Artritis', icon: 'accessibility-outline', use: /\barthritis\b/i },
  { id: 'common-cold', en: 'Common cold', tl: 'Sipon', icon: 'snow-outline', use: /\bcolds?\b/i },
  { id: 'diabetes', en: 'Diabetes', tl: 'Diyabetis', icon: 'analytics-outline', use: /\bdiabetes\b/i },
  { id: 'hypertension', en: 'Hypertension', tl: 'Mataas na presyon ng dugo', icon: 'heart-outline', use: /\bhypertension\b/i },
  { id: 'asthma', en: 'Asthma', tl: 'Hika', icon: 'fitness-outline', use: /\basthma\b/i },
  { id: 'bronchitis', en: 'Bronchitis', tl: 'Brongkitis', icon: 'cloud-outline', use: /\bbronchitis\b/i },
  { id: 'flu', en: 'Flu', tl: 'Trangkaso', icon: 'thermometer-outline', use: /\bflu\b(?!-like)/i },
  { id: 'dengue', en: 'Dengue', tl: 'Dengue', icon: 'thermometer-outline', use: /\bdengue\b/i },
  { id: 'ringworm', en: 'Ringworm', tl: 'Buni', icon: 'color-palette-outline', use: /\bringworm\b/i },
  { id: 'intestinal-worms', en: 'Intestinal worms', tl: 'Bulate sa bituka', icon: 'bug-outline', use: /\bintestinal worms\b/i },
  { id: 'gout', en: 'Gout', tl: 'Gout', icon: 'accessibility-outline', use: /\bgout\b/i },
  { id: 'acne', en: 'Acne', tl: 'Tagihawat', icon: 'color-palette-outline', use: /\bacne\b/i },
  { id: 'boils-abscesses', en: 'Boils / abscesses', tl: 'Pigsa / nana', icon: 'bandage-outline', use: /\b(?:boils|abscesses)\b/i },
  { id: 'scabies', en: 'Scabies', tl: 'Galis', icon: 'color-palette-outline', use: /\bscabies\b/i },
  { id: 'mumps', en: 'Mumps', tl: 'Beke', icon: 'medkit-outline', use: /\bmumps\b/i },
  { id: 'rheumatism', en: 'Rheumatism', tl: 'Rayuma', icon: 'accessibility-outline', use: /\brheumatism\b/i },
  { id: 'scurvy', en: 'Scurvy', tl: 'Scurvy', icon: 'nutrition-outline', use: /\bscurvy\b/i },
  { id: 'skin-ulcers', en: 'Skin ulcers', tl: 'Ulser sa balat', icon: 'bandage-outline', use: /\bskin ulcers\b/i },
  { id: 'urinary-tract-infection', en: 'Urinary tract infection', tl: 'Impeksiyon sa ihi', icon: 'flask-outline', use: /\burinary tract infections?\b/i },
  { id: 'malaria', en: 'Malaria', tl: 'Malaria', icon: 'bug-outline', use: /\bmalaria\b(?! symptoms)/i },
  { id: 'stomach-ulcers', en: 'Stomach ulcers', tl: 'Ulser sa sikmura', icon: 'body-outline', use: /\bstomach ulcers\b/i },
  { id: 'athletes-foot', en: "Athlete’s foot", tl: 'Alipunga', icon: 'color-palette-outline', use: /\bathlete[’']s foot\b/i },
  { id: 'anemia', en: 'Anemia', tl: 'Anemya', icon: 'water-outline', use: /\banemia\b(?! prevention)/i },
  { id: 'wound-infection', en: 'Wound infection', tl: 'Impeksiyon sa sugat', icon: 'bandage-outline', use: /\bwound infections?\b/i },
] as const;

// Membership uses one source vocabulary so translations cannot silently change
// the counted plants or the results opened from the same illness card.
const illnessPlantIds = new Map<string, Set<string>>();
function plantsForIllness(id: string): Set<string> {
  let ids = illnessPlantIds.get(id);
  if (!ids) {
    const illness = ILLNESSES.find(item => item.id === id);
    ids = new Set(getPlantCatalog('en').filter(plant => illness &&
      plant.details.preparation.some(prep => prep.uses.some(use => illness.use.test(use)))
    ).map(plant => plant.id));
    illnessPlantIds.set(id, ids);
  }
  return ids;
}

function findIllness(value: string) {
  const key = value.trim().toLowerCase();
  return ILLNESSES.find(item => item.id === key || item.en.toLowerCase() === key || item.tl.toLowerCase() === key);
}

export function getIllnessLabel(value: string, language: AppLanguage): string {
  return findIllness(value)?.[language] ?? value;
}

export function plantMatchesIllness(plant: MedicinalPlant, value: string): boolean {
  const illness = findIllness(value);
  if (illness) return plantsForIllness(illness.id).has(plant.id);
  // Retain compatibility with existing direct symptom filters and saved state.
  const query = value.toLowerCase();
  return plant.details.preparation.some(prep => prep.uses.some(use => use.toLowerCase().includes(query)));
}

export function getIllnessItems(language: AppLanguage): SymptomItem[] {
  const availableIds = new Set(getPlantCatalog(language).map(plant => plant.id));
  return ILLNESSES.map(illness => ({
    id: illness.id,
    label: illness[language],
    icon: illness.icon,
    plantCount: [...plantsForIllness(illness.id)].filter(id => availableIds.has(id)).length,
  })).filter(item => item.plantCount > 0)
    .sort((a, b) => b.plantCount - a.plantCount || a.label.localeCompare(b.label, language));
}
