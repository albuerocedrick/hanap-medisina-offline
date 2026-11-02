import type { AppLanguage } from "@/src/store/useSettingsStore";
import type { MedicinalPlant } from "@/src/types";

const catalogs: Partial<Record<AppLanguage, MedicinalPlant[]>> = {};
const nameCollators: Partial<Record<AppLanguage, Intl.Collator>> = {};

/** Keep names in A–Z order without changing the caller's catalog or matches. */
export function sortPlantsByName(plants: readonly MedicinalPlant[], language: AppLanguage = "en"): MedicinalPlant[] {
  const collator = nameCollators[language] ??= new Intl.Collator(language, { sensitivity: "base", numeric: true });
  return [...plants].sort((left, right) =>
    collator.compare(left.name.trim(), right.name.trim()) || left.id.localeCompare(right.id));
}

/** Load only the requested language. Search shares these records with the library. */
export function getPlantCatalog(language: AppLanguage): MedicinalPlant[] {
  if (!catalogs[language]) {
    const records = (language === "tl"
      ? require("../data/plants_tl.json")
      : require("../data/plants_en.json")) as MedicinalPlant[];
    catalogs[language] = sortPlantsByName(records, language);
  }
  return catalogs[language]!;
}
