import type { AppLanguage } from '../store/useSettingsStore';

// Keep stored category IDs stable; translate only the labels shown to people.
const categoryLabels: Record<string, { en: string; tl: string }> = {
  digestive: { en: 'Digestive', tl: 'Panunaw' },
  'anti-inflammatory': { en: 'Anti-inflammatory', tl: 'Pampabawas ng pamamaga' },
  'pain-relief': { en: 'Pain relief', tl: 'Pampagaan ng pananakit' },
  antibacterial: { en: 'Antibacterial', tl: 'Panlaban sa bakterya' },
  'immune-boost': { en: 'Immune boost', tl: 'Pampalakas ng resistensiya' },
  fever: { en: 'Fever', tl: 'Lagnat' },
  respiratory: { en: 'Respiratory', tl: 'Paghinga' },
  'skin-care': { en: 'Skin care', tl: 'Pangangalaga sa balat' },
  antioxidant: { en: 'Antioxidant', tl: 'Panlaban sa oksidasyon' },
  nutritional: { en: 'Nutritional', tl: 'Masustansiya' },
  'wound-care': { en: 'Wound care', tl: 'Pangangalaga sa sugat' },
  'oral-care': { en: 'Oral care', tl: 'Pangangalaga sa bibig' },
  'womens-health': { en: "Women's health", tl: 'Kalusugan ng kababaihan' },
  'cough-relief': { en: 'Cough relief', tl: 'Pampagaan ng ubo' },
  'insect-repellent': { en: 'Insect repellent', tl: 'Pangtaboy ng insekto' },
  diuretic: { en: 'Diuretic', tl: 'Pampaihi' },
  'immune-support': { en: 'Immune support', tl: 'Suporta sa resistensiya' },
  relaxing: { en: 'Relaxing', tl: 'Pampakalma' },
  'wound-healing': { en: 'Wound healing', tl: 'Paghilom ng sugat' },
  antiparasitic: { en: 'Antiparasitic', tl: 'Panlaban sa parasito' },
  antidiabetic: { en: 'Antidiabetic', tl: 'Pampababa ng asukal sa dugo' },
  'weight-management': { en: 'Weight management', tl: 'Pamamahala sa timbang' },
  cough: { en: 'Cough', tl: 'Ubo' },
};

const factLabels: Record<string, { en: string; tl: string }> = {
  origin: { en: 'Origin', tl: 'Pinagmulan' },
  family: { en: 'Family', tl: 'Pamilya' },
  habitat: { en: 'Habitat', tl: 'Lugar na tinutubuan' },
};

export function getPlantCategoryLabel(category: string, language: AppLanguage): string {
  return categoryLabels[category]?.[language] ?? category;
}

export function getPlantFactLabel(fact: string, language: AppLanguage): string {
  return factLabels[fact]?.[language] ?? fact;
}
