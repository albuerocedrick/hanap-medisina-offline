/**
 * src/types/homeFeed.ts
 *
 * TypeScript interfaces for the locally-computed Home Feed.
 *
 * These types represent the structure of the home feed data
 * and are used across:
 *   - src/services/localFeed.ts (computes the feed)
 *   - src/store/useFeedStore.ts (persists and exposes the data)
 *   - src/components/home/ (renders each section)
 */


// ─────────────────────────────────────────────
// TRIVIA ITEM
// ─────────────────────────────────────────────

/**
 * A single daily trivia fact.
 * The array contains 7 items (one per day of the week).
 * The app selects today's fact via: weeklyTrivia[new Date().getDay()]
 * This rotates the trivia daily without any network calls.
 */
export interface TriviaItem {
  /** Unique identifier for this trivia item (e.g. "t0"–"t6"). */
  id: string;
  /** The trivia text displayed to the user. */
  text: string;
}

// ─────────────────────────────────────────────
// SYMPTOM ITEM
// ─────────────────────────────────────────────

/** A named illness users can tap to browse related plant information.
 * The legacy type name is retained for persisted feed compatibility. */
export interface SymptomItem {
  id: string;          // language-independent illness ID, e.g. "asthma"
  label: string;       // localized display text, e.g. "Asthma" / "Hika"
  icon: string;        // Ionicons icon name, e.g. "medkit-outline"
  plantCount: number;  // number of related plant records in the library
}

// ─────────────────────────────────────────────
// PREPARATION GROUP
// ─────────────────────────────────────────────

/** A preparation method grouping */
export interface PreparationGroup {
  method: string;      // e.g. "Tea / Decoction"
  icon: string;        // Ionicons icon name, e.g. "cafe-outline"
  plantCount: number;  // how many plants use this method
  plantIds: string[];  // which plants
}

// ─────────────────────────────────────────────
// HOME FEED DATA (root document shape)
// ─────────────────────────────────────────────

/**
 * The complete shape of the Home Feed data.
 * Validated and returned by `getHomeFeed()` in localFeed.ts.
 */
export interface HomeFeedData {
  /** Always 7 items — one fact per day of the week (index 0 = Sunday). */
  weeklyTrivia: TriviaItem[];
  symptoms: SymptomItem[];
  preparationGroups: PreparationGroup[];
}
