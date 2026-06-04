/**
 * src/store/useFeedStore.ts
 *
 * Single source of truth for Home Tab feed data.
 *
 *  - On launch: Zustand rehydrates all feed data instantly from AsyncStorage.
 *  - Local data generated from embedded JSON via localFeed.ts.
 *  - Feed is deterministic per day, no network needed.
 *  - Trivia: getTodayTrivia() rotates daily using new Date().getDay().
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { getHomeFeed } from "../services/localFeed";
import {
  FeaturedPlant,
  FeedCategory,
  PlantOfTheDay,
  TriviaItem,
  SymptomItem,
  PreparationGroup,
} from "../types/homeFeed";

// ─────────────────────────────────────────────
// ERROR TYPE
// ─────────────────────────────────────────────

export type FeedStoreErrorCode =
  | "FETCH_FAILED"
  | "NOT_FOUND"
  | "INVALID_DATA";

export class FeedStoreError extends Error {
  constructor(
    public readonly code: FeedStoreErrorCode,
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "FeedStoreError";
  }
}

// ─────────────────────────────────────────────
// STATE & ACTIONS INTERFACES
// ─────────────────────────────────────────────

interface FeedState {
  /** The curated hero plant for the Home Tab. Null until first successful fetch. */
  plantOfTheDay: PlantOfTheDay | null;

  /** Category chips shown on the Home Tab. Empty until first successful fetch. */
  categories: FeedCategory[];

  /** Featured plant cards shown in the horizontal scroll row. */
  featuredPlants: FeaturedPlant[];

  /**
   * 7 trivia facts — one per day of the week (index 0 = Sunday).
   * Rotated offline via getTodayTrivia().
   */
  weeklyTrivia: TriviaItem[];

  symptoms: SymptomItem[];
  preparationGroups: PreparationGroup[];

  /** True while feed data is being computed. */
  isLoadingFeed: boolean;

  /**
   * Set on fetch failure. Does NOT clear existing cached data.
   * Stale-while-error: the UI still renders last known good data.
   */
  feedError: FeedStoreError | null;

  /**
   * Unix timestamp (ms) of the last successful fetch.
   * Useful for showing a "Last updated X minutes ago" label if needed.
   */
  lastFetchedAt: number | null;
}

interface FeedActions {
  /**
   * Computes the home feed from local data and updates all state fields.
   *
   * Behaviour:
   *  - Guards against concurrent in-flight fetches.
   *  - On success: updates all fields and sets lastFetchedAt = Date.now().
   *  - On failure: sets feedError. Does NOT clear existing cached data.
   */
  fetchHomeFeed: () => void;

  /**
   * Returns the trivia fact for today based on the day of the week.
   * Uses new Date().getDay() (0 = Sunday, 6 = Saturday).
   * Returns null if the weeklyTrivia array is empty (not yet fetched).
   */
  getTodayTrivia: () => TriviaItem | null;

  /** Clears the feedError field without affecting any cached data. */
  clearFeedError: () => void;
}

type FeedStore = FeedState & FeedActions;

// ─────────────────────────────────────────────
// STORE
// ─────────────────────────────────────────────

export const useFeedStore = create<FeedStore>()(
  persist(
    (set, get) => ({
      // ── Initial State ──────────────────────────────────────────────────────
      plantOfTheDay: null,
      categories: [],
      featuredPlants: [],
      weeklyTrivia: [],
      symptoms: [],
      preparationGroups: [],
      isLoadingFeed: false,
      feedError: null,
      lastFetchedAt: null,

      // ── Actions ────────────────────────────────────────────────────────────

      fetchHomeFeed: () => {
        if (get().isLoadingFeed) return;

        set({ isLoadingFeed: true, feedError: null });

        try {
          const feedData = getHomeFeed();

          set({
            plantOfTheDay: feedData.plantOfTheDay,
            categories: feedData.categories,
            featuredPlants: feedData.featuredPlants,
            weeklyTrivia: feedData.weeklyTrivia,
            symptoms: feedData.symptoms,
            preparationGroups: feedData.preparationGroups,
            isLoadingFeed: false,
            feedError: null,
            lastFetchedAt: Date.now(),
          });
        } catch (err) {
          const storeError = new FeedStoreError("FETCH_FAILED", "Could not load the home feed.", err);
          console.error("[useFeedStore] fetchHomeFeed failed:", err);
          set({ isLoadingFeed: false, feedError: storeError });
        }
      },

      getTodayTrivia: () => {
        const { weeklyTrivia } = get();
        if (!weeklyTrivia || weeklyTrivia.length === 0) return null;

        // new Date().getDay() returns 0 (Sun) through 6 (Sat).
        // weeklyTrivia has 7 items seeded with ids t0–t6 mapping to these days.
        const dayIndex = new Date().getDay();
        return weeklyTrivia[dayIndex] ?? null;
      },

      clearFeedError: () => {
        set({ feedError: null });
      },
    }),

    // ── Persist Config ───────────────────────────────────────────────────────
    // Persist feed data for instant rendering on next app launch.
    // isLoadingFeed and feedError are runtime-only — never persisted.
    {
      name: "hanapmedisina-feed-store",
      storage: createJSONStorage(() => AsyncStorage),

      partialize: (state) => ({
        plantOfTheDay: state.plantOfTheDay,
        categories: state.categories,
        featuredPlants: state.featuredPlants,
        weeklyTrivia: state.weeklyTrivia,
        symptoms: state.symptoms,
        preparationGroups: state.preparationGroups,
        lastFetchedAt: state.lastFetchedAt,
      }),
    },
  ),
);

// ─────────────────────────────────────────────
// SELECTOR HOOKS
// Fine-grained selectors prevent full-store re-renders.
// ─────────────────────────────────────────────

export const selectPlantOfTheDay = (s: FeedStore) => s.plantOfTheDay;
export const selectFeedCategories = (s: FeedStore) => s.categories;
export const selectFeaturedPlants = (s: FeedStore) => s.featuredPlants;
export const selectIsLoadingFeed = (s: FeedStore) => s.isLoadingFeed;
export const selectFeedError = (s: FeedStore) => s.feedError;
export const selectLastFetchedAt = (s: FeedStore) => s.lastFetchedAt;
export const selectSymptoms = (s: FeedStore) => s.symptoms;
export const selectPreparationGroups = (s: FeedStore) => s.preparationGroups;
