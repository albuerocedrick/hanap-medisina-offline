import type { AppLanguage } from "@/src/store/useSettingsStore";
import type { MedicinalPlant } from "@/src/types";

const catalogs: Partial<Record<AppLanguage, MedicinalPlant[]>> = {};

/** Load only the requested language. Search shares these records with the library. */
export function getPlantCatalog(language: AppLanguage): MedicinalPlant[] {
  if (!catalogs[language]) {
    catalogs[language] = (language === "tl"
      ? require("../data/plants_tl.json")
      : require("../data/plants_en.json")) as MedicinalPlant[];
  }
  return catalogs[language]!;
}
