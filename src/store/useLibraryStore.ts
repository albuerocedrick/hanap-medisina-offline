/**
 * store/useLibraryStore.ts
 *
 * Single source of truth for the Library tab, MedicinalPlant details, favorites,
 * and the offline data gate.
 *
 *  - Local data from embedded JSON via localLibrary.ts.
 *  - Persists full MedicinalPlant objects as favorites to AsyncStorage.
 *  - `plants` is persisted to AsyncStorage alongside `favorites`.
 *  - `getDisplayedPlants()` uses the `plants` list as source of truth.
 *  - Search and filter run client-side (zero extra reads).
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { MedicinalPlant } from "../types";
import {
  getAllCategories,
  getAllPlants,
  getPlantsByCategory,
  getPlantsByIds,
} from "../services/localLibrary";


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

  /** Display mode for the Library feed. */
  viewMode: 'list' | 'grid';

  // ── Favorites (Offline Storage) ───────────────────────────────────────────
  /**
   * Full MedicinalPlant objects persisted to AsyncStorage.
   * Storing full objects (not just IDs) ensures zero-network offline access.
   */
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

  /**
   * Sets the active category filter.
   * Passing `null` resets to "All" and re-fetches the full list.
   */
  setActiveCategory: (category: string | null) => void;

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
   * Accepts a full `MedicinalPlant` so the offline cache is always complete.
   */
  toggleFavorite: (plant: MedicinalPlant) => Promise<void>;

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
// favorites and plants. Volatile state (categories, UI state)
// is intentionally excluded and re-fetched fresh each session.
// ─────────────────────────────────────────────

export const useLibraryStore = create<LibraryStore>()(
  persist(
    (set, get) => ({
      // ── Initial State ──────────────────────────────────────────────────────
      plants: [],
      categories: [],
      isLoadingPlants: false,
      isLoadingCategories: false,
      searchQuery: "",
      activeCategory: null,
      viewMode: 'list',
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
          console.error("[useLibraryStore] fetchPlants:", error.message, err);
          set({ isLoadingPlants: false, plantsError: error });
        }
      },

      fetchPlantsByActiveCategory: () => {
        const { activeCategory } = get();

        // No active filter — just fetch everything
        if (!activeCategory) {
          return get().fetchPlants();
        }

        if (get().isLoadingPlants) return;

        set({ isLoadingPlants: true, plantsError: null });

        try {
          const plants = getPlantsByCategory(activeCategory);
          set({ plants, isLoadingPlants: false });
        } catch (err) {
          const error = wrapError(
            "FETCH_PLANTS_FAILED",
            `Could not load plants for category "${activeCategory}".`,
            err,
          );
          console.error(
            "[useLibraryStore] fetchPlantsByActiveCategory:",
            error.message,
            err,
          );
          set({ isLoadingPlants: false, plantsError: error });
        }
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
          console.error(
            "[useLibraryStore] fetchCategories:",
            error.message,
            err,
          );
          set({ isLoadingCategories: false, categoriesError: error });
        }
      },

      // ── Search & Filter ────────────────────────────────────────────────────

      setSearchQuery: (query) => {
        set({ searchQuery: query });
      },

      setViewMode: (mode) => {
        set({ viewMode: mode });
      },

      setActiveCategory: (category) => {
        set({ activeCategory: category });
        // Re-filter plants for the selected category.
        // getDisplayedPlants() will re-derive on next render.
        get().fetchPlantsByActiveCategory();
      },

      getDisplayedPlants: () => {
        const { plants, searchQuery } = get();

        if (!searchQuery) return plants;
        
        const lower = searchQuery.toLowerCase();
        return plants.filter(p => 
          p.name.toLowerCase().includes(lower) || 
          (p.scientificName && p.scientificName.toLowerCase().includes(lower)) || 
          (p.details && p.details.localName.toLowerCase().includes(lower))
        );
      },

      // ── Favorites ──────────────────────────────────────────────────────────

      toggleFavorite: async (plant: MedicinalPlant) => {
        const { favorites } = get();
        const isCurrentlyFavorited = get().isFavorite(plant.id);

        let updatedFavorites: MedicinalPlant[];

        if (isCurrentlyFavorited) {
          updatedFavorites = favorites.filter((f) => f.id !== plant.id);
        } else {
          // Store the full MedicinalPlant object for complete offline access
          updatedFavorites = [...favorites, plant];
        }

        const updatedIds = new Set(updatedFavorites.map((f) => f.id));

        // Optimistic update — UI responds instantly
        set({ favorites: updatedFavorites, favoriteIds: updatedIds });

        // Persist to AsyncStorage in the background
        try {
          await AsyncStorage.setItem(
            FAVORITES_STORAGE_KEY,
            JSON.stringify(updatedFavorites),
          );
        } catch (err) {
          // Rollback optimistic update on storage failure
          const rollbackIds = new Set(favorites.map((f) => f.id));
          set({ favorites, favoriteIds: rollbackIds });

          const error = wrapError(
            "FAVORITES_SAVE_FAILED",
            `Could not save favorite for "${plant.name}". Please try again.`,
            err,
          );
          console.error(
            "[useLibraryStore] toggleFavorite:",
            error.message,
            err,
          );
          set({ favoritesError: error });
        }
      },

      isFavorite: (plantId: string) => {
        return get().favoriteIds.has(plantId);
      },

      loadFavorites: async () => {
        set({ isLoadingFavorites: true, favoritesError: null });

        try {
          const raw = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
          const stored: MedicinalPlant[] = raw ? JSON.parse(raw) : [];

          const favoriteIds = new Set(stored.map((f) => f.id));
          set({ favorites: stored, favoriteIds, isLoadingFavorites: false });

          // ── Refresh favorite data ──
          // Refresh favorite data from local plant database to keep cached details current.
          if (stored.length > 0) {
            const ids = stored.map((f) => f.id);
            try {
              const freshPlants = getPlantsByIds(ids);
              if (freshPlants.length > 0) {
                const freshIds = new Set(freshPlants.map((p) => p.id));
                set({ favorites: freshPlants, favoriteIds: freshIds });
                AsyncStorage.setItem(
                  FAVORITES_STORAGE_KEY,
                  JSON.stringify(freshPlants),
                ).catch((e) =>
                  console.warn(
                    "[useLibraryStore] Silent favorites refresh save failed:",
                    e,
                  ),
                );
              }
            } catch (e) {
              console.warn(
                "[useLibraryStore] Silent favorites refresh failed:",
                e,
              );
            }
          }
        } catch (err) {
          const error = wrapError(
            "FAVORITES_LOAD_FAILED",
            "Could not load your saved plants. Offline access may be limited.",
            err,
          );
          console.error("[useLibraryStore] loadFavorites:", error.message, err);
          set({ isLoadingFavorites: false, favoritesError: error });
        }
      },

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
    // Persists `favorites` (full MedicinalPlant objects for offline detail views) and
    // `plants` (lightweight summaries for offline search — Phase 6).
    // `categories` and UI state are always re-fetched fresh each session.
    {
      name: "library-store",
      storage: createJSONStorage(() => AsyncStorage),

      partialize: (state) => ({
        favorites: state.favorites,
        plants: state.plants, // Phase 6: enables full offline search
        viewMode: state.viewMode,
      }),

      /**
       * After rehydration from AsyncStorage, the `favoriteIds` Set must be
       * rebuilt from the restored `favorites` array because Sets are not
       * JSON-serializable and are stored as empty objects by default.
       */
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const restoredIds = new Set(state.favorites.map((f: MedicinalPlant) => f.id));
        state.favoriteIds = restoredIds;
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

