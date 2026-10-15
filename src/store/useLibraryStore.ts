/**
 * store/useLibraryStore.ts
 *
 * Single source of truth for the Library tab, MedicinalPlant details, favorites,
 * and the offline data gate.
 *
 *  - Local data from embedded JSON via localLibrary.ts.
 *  - Persists favorite IDs; plant details always come from the bundled catalog.
 *  - The bundled catalog is available immediately, including on first launch.
 *  - Favorites and view mode are persisted; filtered catalog subsets are not.
 *  - Search and filter run client-side (zero extra reads).
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { MedicinalPlant } from "@/src/types";
import {
  getAllCategories,
  getAllPlants,
  getPlantsByIds,
} from "@/src/services/localLibrary";
import { searchPlantNames } from "@/src/services/plantSearch";


// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export type LibraryErrorCode =
  | "FETCH_PLANTS_FAILED"
  | "FETCH_CATEGORIES_FAILED"
  | "FAVORITES_LOAD_FAILED"
  | "FAVORITES_SAVE_FAILED";

export class LibraryStoreError extends Error {
  constructor(
    public readonly code: LibraryErrorCode,
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "LibraryStoreError";
  }
}

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────

const FAVORITES_STORAGE_KEY = "hanapmedisina_favorites";

// ─────────────────────────────────────────────
// STORE INTERFACE
// ─────────────────────────────────────────────

interface LibraryState {
  // ── MedicinalPlant List ────────────────────────────────────────────────────────────
  /** Full plant list loaded from embedded JSON data. */
  plants: MedicinalPlant[];

  /** Available category strings for FilterPills. */
  categories: string[];

  /** Loading flag for the main MedicinalPlant list fetch. */
  isLoadingPlants: boolean;

  /** Loading flag for categories fetch. */
  isLoadingCategories: boolean;

  // ── Search & Filter ───────────────────────────────────────────────────────
  /** Raw string from SearchBar input. Filtered client-side. */
  searchQuery: string;

  /**
   * Active category filter. `null` means "All".
   */
  activeCategory: string | null;

  activeSymptom: string | null;
  activePreparationMethod: string | null;

  /** Display mode for the Library feed. */
  viewMode: 'list' | 'grid';

  // ── Favorites (Offline Storage) ───────────────────────────────────────────
  /** Show only favorited plants in the library. */
  showFavoritesOnly: boolean;

  /** Current-language bundled plant records, resolved from persisted IDs. */
  favorites: MedicinalPlant[];

  /**
   * Set of favorited MedicinalPlant IDs for O(1) membership checks.
   * Derived from `favorites` and kept in sync — never set manually.
   */
  favoriteIds: Set<string>;

  /** True while AsyncStorage is being read on app startup. */
  isLoadingFavorites: boolean;

  // ── Errors ────────────────────────────────────────────────────────────────
  plantsError: LibraryStoreError | null;
  categoriesError: LibraryStoreError | null;
  favoritesError: LibraryStoreError | null;
}

interface LibraryActions {
  // ── Data Fetching ─────────────────────────────────────────────────────────

  /**
   * Fetches the full MedicinalPlant list from local data.
   * No-ops silently if a fetch is already in progress.
   */
  fetchPlants: () => void;

  /**
   * Fetches plants filtered by the active category.
   * Falls back to `fetchPlants()` if `activeCategory` is null.
   */
  fetchPlantsByActiveCategory: () => void;

  /**
   * Fetches the available category list from local data.
   * Called once on Library mount and cached until the app restarts.
   */
  fetchCategories: () => void;

  // ── Search & Filter ───────────────────────────────────────────────────────

  setSearchQuery: (query: string) => void;

  setViewMode: (mode: 'list' | 'grid') => void;

  setShowFavoritesOnly: (show: boolean) => void;

  /**
   * Sets the active category filter.
   * Passing `null` resets to "All" and re-fetches the full list.
   */
  setActiveCategory: (category: string | null) => void;

  setActiveSymptom: (symptom: string | null) => void;
  setActivePreparationMethod: (method: string | null) => void;

  /**
   * Derived selector: filters plants by search query.
   *
   * This is the ONLY place the display source logic lives.
   * Components never read `plants` or `favorites` directly for display.
   */
  getDisplayedPlants: () => MedicinalPlant[];

  // ── Favorites ─────────────────────────────────────────────────────────────

  /**
   * Toggles a MedicinalPlant in/out of favorites and persists the new list.
   * Accepts a plant record; only its catalog ID is persisted.
   */
  toggleFavorite: (plant: MedicinalPlant) => Promise<void>;

  /** Atomically persist a replacement or union of favorite IDs in one write. */
  replaceFavorites: (ids: string[], mode?: "replace" | "merge") => Promise<void>;

  /** Returns true if the given MedicinalPlant ID is currently favorited. */
  isFavorite: (plantId: string) => boolean;

  /**
   * Re-hydrates favorites from AsyncStorage.
   * Call once from the root layout on app mount.
   * Also attempts to refresh stale favorite data when possible.
   */
  loadFavorites: () => Promise<void>;

  // ── Error Management ──────────────────────────────────────────────────────

  clearErrors: () => void;
}

type LibraryStore = LibraryState & LibraryActions;

let favoritesLoaded = false;
let favoritesChanged = false;
let legacyFavoriteIds: string[] = [];
let favoriteTasks: Promise<void> = Promise.resolve();
let preferenceRead: Promise<void> = Promise.resolve();
let preferenceWrites: Promise<void> = Promise.resolve();
let preferredViewMode: "list" | "grid" = "list";
let viewModeChanged = false;

function enqueueFavorites<T>(action: () => Promise<T>): Promise<T> {
  const task = favoriteTasks.then(action);
  favoriteTasks = task.then(() => undefined, () => undefined);
  return task;
}

function storedFavoriteIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(item => typeof item === "string" ? item : item?.id)
    .filter((id): id is string => typeof id === "string" && id.length > 0))];
}

async function readFavorites(): Promise<MedicinalPlant[]> {
  const [raw, legacy] = await Promise.all([
    AsyncStorage.getItem(FAVORITES_STORAGE_KEY),
    AsyncStorage.getItem("library-store"),
  ]);
  if (raw !== null) return getPlantsByIds(storedFavoriteIds(JSON.parse(raw)));
  // Very old releases wrote objects to the Zustand preference key only.
  const state = legacy ? JSON.parse(legacy)?.state : undefined;
  return getPlantsByIds(state?.legacyFavoriteIds || state?.favoriteIds || state?.favorites
    ? storedFavoriteIds(state.legacyFavoriteIds ?? state.favoriteIds ?? state.favorites) : legacyFavoriteIds);
}

// Initial data refreshes can happen before asynchronous preference hydration.
// Wait for the preceding read before a write, retaining a tiny migration fallback
// until the canonical ID key has been written successfully.
const preferenceStorage = {
  getItem: (name: string) => {
    const read = preferenceWrites.then(() => AsyncStorage.getItem(name)).then(raw => {
      if (raw) {
        try {
          const state = JSON.parse(raw)?.state;
          const legacy = state?.legacyFavoriteIds ?? state?.favoriteIds ?? state?.favorites;
          if (!favoritesLoaded && Array.isArray(legacy)) legacyFavoriteIds = storedFavoriteIds(legacy);
          if (!viewModeChanged && (state?.viewMode === "grid" || state?.viewMode === "list")) {
            preferredViewMode = state.viewMode;
          }
        } catch { /* Zustand reports malformed preference JSON during hydration. */ }
      }
      return raw;
    });
    preferenceRead = read.then(() => undefined, () => undefined);
    return read;
  },
  setItem: (name: string, value: string) => {
    const readBeforeWrite = preferenceRead;
    const write = preferenceWrites.then(async () => {
      await readBeforeWrite;
      const payload = JSON.parse(value);
      // Data refreshes queued before hydration must not write the default mode
      // over a saved preference. User changes always supersede hydration.
      payload.state.viewMode = preferredViewMode;
      if (!favoritesLoaded && legacyFavoriteIds.length) payload.state.legacyFavoriteIds = legacyFavoriteIds;
      await AsyncStorage.setItem(name, JSON.stringify(payload));
    });
    // Preference actions are synchronous. Prevent rejected background writes
    // from becoming unhandled rejections; favorite writes report their own errors.
    preferenceWrites = write.catch(cause => {
      if (__DEV__) console.warn("[useLibraryStore] Could not save library preferences:", cause);
    });
    return preferenceWrites;
  },
  removeItem: (name: string) => AsyncStorage.removeItem(name),
};

/** Memoize by filter inputs so unrelated store updates keep the same array. */
export const selectDisplayedPlants = (() => {
  let previous: unknown[] = [];
  let result: MedicinalPlant[] = [];
  return (state: LibraryStore): MedicinalPlant[] => {
    const { plants, activeCategory, activeSymptom, activePreparationMethod, searchQuery, showFavoritesOnly, favoriteIds } = state;
    const inputs = [plants, activeCategory, activeSymptom, activePreparationMethod, searchQuery, showFavoritesOnly, showFavoritesOnly ? favoriteIds : null];
    if (inputs.every((value, index) => value === previous[index])) return result;
    previous = inputs;
    let filtered = plants;
    if (activeCategory) filtered = filtered.filter(plant => plant.categories.includes(activeCategory));
    if (activeSymptom) filtered = filtered.filter(plant => plant.details?.preparation?.some(prep => prep.uses?.some(use => use.toLowerCase().includes(activeSymptom.toLowerCase()))));
    if (activePreparationMethod) filtered = filtered.filter(plant => plant.details?.preparation?.some(prep => prep.method.toLowerCase().includes(activePreparationMethod.toLowerCase())));
    if (showFavoritesOnly) filtered = filtered.filter(plant => favoriteIds.has(plant.id));
    result = searchQuery ? searchPlantNames(filtered, searchQuery) : filtered;
    return result;
  };
})();

// ─────────────────────────────────────────────
// INTERNAL HELPERS
// ─────────────────────────────────────────────

/** Wraps a localLibraryError (or unknown) into a LibraryStoreError. */
function wrapError(
  code: LibraryErrorCode,
  message: string,
  cause: unknown,
): LibraryStoreError {
  return new LibraryStoreError(code, message, cause);
}

// ─────────────────────────────────────────────
// STORE
// Persist is scoped to only the fields that must survive app restarts:
// Only the view preference is persisted here. Favorites use their own ID-only
// key; the complete catalog and translated records come from bundled data.
// ─────────────────────────────────────────────

export const useLibraryStore = create<LibraryStore>()(
  persist(
    (set, get) => ({
      // ── Initial State ──────────────────────────────────────────────────────
      plants: getAllPlants(),
      categories: [],
      isLoadingPlants: false,
      isLoadingCategories: false,
      searchQuery: "",
      activeCategory: null,
      activeSymptom: null,
      activePreparationMethod: null,
      viewMode: 'list',
      showFavoritesOnly: false,
      favorites: [],
      favoriteIds: new Set<string>(),
      isLoadingFavorites: false,
      plantsError: null,
      categoriesError: null,
      favoritesError: null,

      // ── Data Fetching ──────────────────────────────────────────────────────

      fetchPlants: () => {
        if (get().isLoadingPlants) return;

        set({ isLoadingPlants: true, plantsError: null });

        try {
          const plants = getAllPlants();
          set({ plants, isLoadingPlants: false });
        } catch (err) {
          const error = wrapError(
            "FETCH_PLANTS_FAILED",
            "Could not load the plant library.",
            err,
          );
          if (__DEV__) console.error("[useLibraryStore] fetchPlants:", error.message, err);
          set({ isLoadingPlants: false, plantsError: error });
        }
      },

      fetchPlantsByActiveCategory: () => {
        // Keep the complete catalog. The displayed list derives its filters.
        get().fetchPlants();
      },

      fetchCategories: () => {
        // Only fetch once per session unless cleared
        if (get().categories.length > 0 || get().isLoadingCategories) return;

        set({ isLoadingCategories: true, categoriesError: null });

        try {
          const categories = getAllCategories();
          set({ categories, isLoadingCategories: false });
        } catch (err) {
          const error = wrapError(
            "FETCH_CATEGORIES_FAILED",
            "Could not load MedicinalPlant categories.",
            err,
          );
          if (__DEV__) console.error(
            "[useLibraryStore] fetchCategories:",
            error.message,
            err,
          );
          set({ isLoadingCategories: false, categoriesError: error });
        }
      },

      // ── Search & Filter ────────────────────────────────────────────────────

      setSearchQuery: (query) => {
        // Starting a new search should not inherit filters hidden during typing.
        if (query.trim() && !get().searchQuery.trim()) {
          set({ searchQuery: query, activeCategory: null, activeSymptom: null, activePreparationMethod: null });
        } else {
          set({ searchQuery: query });
        }
      },

      setViewMode: (mode) => {
        viewModeChanged = true;
        preferredViewMode = mode;
        set({ viewMode: mode });
      },

      setShowFavoritesOnly: (show) => {
        set({ showFavoritesOnly: show });
      },

      setActiveCategory: (category) => {
        set({ activeCategory: category, activeSymptom: null, activePreparationMethod: null });
        // Re-filter plants for the selected category.
        // getDisplayedPlants() will re-derive on next render.
        get().fetchPlantsByActiveCategory();
      },

      setActiveSymptom: (symptom) => {
        set({ activeSymptom: symptom, activeCategory: null, activePreparationMethod: null });
        get().fetchPlants();
      },

      setActivePreparationMethod: (method) => {
        set({ activePreparationMethod: method, activeCategory: null, activeSymptom: null });
        get().fetchPlants();
      },

      getDisplayedPlants: () => selectDisplayedPlants(get()),

      // Serialize favorite reads/writes so rapid taps and imports cannot
      // overwrite one another or roll back a newer successful operation.
      toggleFavorite: (plant) => enqueueFavorites(async () => {
        try {
          const favorites = favoritesLoaded ? get().favorites : await readFavorites();
          const ids = new Set(favorites.map(item => item.id));
          if (ids.has(plant.id)) ids.delete(plant.id);
          else ids.add(plant.id);
          const resolvedIds = getPlantsByIds([...ids]).map(item => item.id);
          await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(resolvedIds));
          const resolved = getPlantsByIds(resolvedIds);
          favoritesLoaded = true;
          favoritesChanged = true;
          set({ favorites: resolved, favoriteIds: new Set(resolved.map(item => item.id)), favoritesError: null });
        } catch (cause) {
          const error = wrapError("FAVORITES_SAVE_FAILED", `Could not save favorite for "${plant.name}". Please try again.`, cause);
          if (__DEV__) console.error("[useLibraryStore] toggleFavorite:", error);
          set({ favoritesError: error });
        }
      }),

      replaceFavorites: (ids, mode = "replace") => enqueueFavorites(async () => {
        try {
          const current = mode === "merge"
            ? (favoritesLoaded ? get().favorites : await readFavorites()).map(item => item.id)
            : [];
          const resolvedIds = getPlantsByIds([...new Set([...current, ...ids])]).map(item => item.id);
          await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(resolvedIds));
          const favorites = getPlantsByIds(resolvedIds);
          favoritesLoaded = true;
          favoritesChanged = true;
          set({ favorites, favoriteIds: new Set(favorites.map(item => item.id)), favoritesError: null });
        } catch (cause) {
          const error = wrapError("FAVORITES_SAVE_FAILED", "Could not restore saved plants. Please try again.", cause);
          set({ favoritesError: error });
          throw error;
        }
      }),

      isFavorite: (plantId) => get().favoriteIds.has(plantId),

      loadFavorites: () => enqueueFavorites(async () => {
        if (favoritesLoaded) return;
        const pendingFavorites = readFavorites();
        set({ isLoadingFavorites: true, favoritesError: null });
        try {
          const resolvedIds = (await pendingFavorites).map(item => item.id);
          // Migrate both former object formats to one ID-only source of truth.
          await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(resolvedIds));
          const favorites = getPlantsByIds(resolvedIds);
          favoritesLoaded = true;
          favoritesChanged = true;
          set({ favorites, favoriteIds: new Set(favorites.map(item => item.id)), isLoadingFavorites: false });
        } catch (cause) {
          const error = wrapError("FAVORITES_LOAD_FAILED", "Could not load your saved plants. Please try again.", cause);
          if (__DEV__) console.error("[useLibraryStore] loadFavorites:", error);
          set({ isLoadingFavorites: false, favoritesError: error });
        }
      }),

      // ── Error Management ───────────────────────────────────────────────────

      clearErrors: () => {
        set({
          plantsError: null,
          categoriesError: null,
          favoritesError: null,
        });
      },
    }),

    // ── Persist Config ─────────────────────────────────────────────────────
    // Legacy favorite IDs are retained only until migration succeeds.
    {
      name: "library-store",
      storage: createJSONStorage(() => preferenceStorage),

      // Favorites have one canonical ID-only key. Keep preferences separate.
      partialize: (state) => ({ viewMode: state.viewMode }),
      merge: (persisted, current) => {
        const saved = persisted as { legacyFavoriteIds?: unknown; favorites?: unknown; favoriteIds?: unknown; viewMode?: string } | undefined;
        if (!favoritesChanged && (saved?.legacyFavoriteIds || saved?.favoriteIds || saved?.favorites)) {
          legacyFavoriteIds = storedFavoriteIds(saved.legacyFavoriteIds ?? saved.favoriteIds ?? saved.favorites);
        }
        const favorites = favoritesChanged ? current.favorites
          : getPlantsByIds(storedFavoriteIds(saved?.legacyFavoriteIds ?? saved?.favoriteIds ?? saved?.favorites));
        return {
          ...current,
          favorites,
          favoriteIds: new Set(favorites.map(plant => plant.id)),
          viewMode: viewModeChanged ? current.viewMode : preferredViewMode,
        };
      },
    },
  ),
);

// ─────────────────────────────────────────────
// SELECTOR HOOKS
// Fine-grained selectors prevent full-store re-renders.
// ─────────────────────────────────────────────

export const selectIsLoadingPlants = (s: LibraryStore) => s.isLoadingPlants;
export const selectPlantsError = (s: LibraryStore) => s.plantsError;
export const selectCategories = (s: LibraryStore) => s.categories;
export const selectActiveCategory = (s: LibraryStore) => s.activeCategory;
export const selectSearchQuery = (s: LibraryStore) => s.searchQuery;
export const selectFavorites = (s: LibraryStore) => s.favorites;
export const selectFavoritesCount = (s: LibraryStore) => s.favorites.length;
export const selectFavoritesError = (s: LibraryStore) => s.favoritesError;
export const selectViewMode = (s: LibraryStore) => s.viewMode;

