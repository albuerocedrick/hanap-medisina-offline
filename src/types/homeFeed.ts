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
// PLANT OF THE DAY
// ─────────────────────────────────────────────

/**
 * The curated plant featured as a large hero card on the Home Tab.
 * `id` maps directly to a plant ID in the local plant database.
 */
export interface PlantOfTheDay {
  /** Matches a plant ID in the local plant database. */
  id: string;
  name: string;
  scientificName: string;
  /** Short description shown on the hero card overlay. */
  subtitle: string;
  /** Resolved local asset URI for the hero image. */
  heroImageUrl: string;
}

// ─────────────────────────────────────────────
// CATEGORY CHIP
// ─────────────────────────────────────────────

/**
 * A single category chip displayed in the horizontal filter row.
 * `id` must match category strings in plant data
 * (e.g. "Coughs", "Wounds", "Skin") so filtering works correctly.
 */
export interface FeedCategory {
  /** Exact string match to plant.categories[] values. */
  id: string;
  /** Human-readable display label (e.g. "Coughs & Colds"). */
  name: string;
  /** A valid Feather icon name (e.g. "thermometer", "wind", "droplet"). */
  icon: string;
}

// ─────────────────────────────────────────────
// FEATURED PLANT
// ─────────────────────────────────────────────

/**
 * A plant shown in the horizontal "Featured Plants" scroll row.
 * Only preview fields are stored here — full details are fetched
 * when the user taps the card.
 */
export interface FeaturedPlant {
  /** Matches a plant ID in the local plant database. */
  id: string;
  name: string;
  scientificName: string;
  /** Resolved local asset URI for the thumbnail. */
  thumbnailUrl: string;
}

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
// HOME FEED DATA (root document shape)
// ─────────────────────────────────────────────

/**
 * The complete shape of the Home Feed data.
 * Validated and returned by `getHomeFeed()` in localFeed.ts.
 */
export interface HomeFeedData {
  plantOfTheDay: PlantOfTheDay;
  categories: FeedCategory[];
  featuredPlants: FeaturedPlant[];
  /** Always 7 items — one fact per day of the week (index 0 = Sunday). */
  weeklyTrivia: TriviaItem[];
}
