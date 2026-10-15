import { getAllCategories, getAllPlants } from "@/src/services/localLibrary";
import { useFeedStore } from "./useFeedStore";
import { useLibraryStore } from "./useLibraryStore";
import { AppLanguage, useSettingsStore } from "./useSettingsStore";

/** Own the cross-store subscription for the lifetime of the mounted app. */
export function initializeDataLanguageSync(): () => void {
  const refresh = (language: AppLanguage) => {
    const plants = getAllPlants(language);
    useLibraryStore.setState(current => ({
      plants,
      categories: getAllCategories(language),
      favorites: plants.filter(plant => current.favoriteIds.has(plant.id)),
      activeCategory: null,
      activeSymptom: null,
      activePreparationMethod: null,
    }));
    useFeedStore.getState().fetchHomeFeed(language);
  };
  refresh(useSettingsStore.getState().language);
  return useSettingsStore.subscribe((state, previous) => {
    if (state.language !== previous.language) refresh(state.language);
  });
}
