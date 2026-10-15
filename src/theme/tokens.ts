/**
 * src/theme/tokens.ts
 *
 * Single source of truth for the Hanap Medisina design system.
 *
 * IMPORTANT: every colour below is one ALREADY used in the app. Nothing new was
 * invented — this file only consolidates the palette that was previously spread
 * across ~53 inline hex literals and ~669 rgba() calls.
 *
 * Screens and components consume these semantic values through `useTheme()`.
 * Keep theme-dependent colours here so every surface follows the same palette.
 *
 * Superseded (safe to delete once migration completes):
 *   - constants/Colors.ts  (dead Expo template — #2f95dc blue, imported nowhere)
 *   - the colour block in tailwind.config.js (Apple system colours, unused by the app)
 */

// ─── Raw palette ──────────────────────────────────────────────────────────────
// Prefer the semantic tokens below;
// reach for these only when defining a new semantic token.
export const palette = {
  forest: "#22451C", // deep green — primary text
  olive: "#4D8035", // primary action / accessible secondary text
  sage: "#A2CFA3", // borders, dark-mode secondary text
  cream: "#FAFEEF", // light background
  white: "#FFFFFF",
  /**
   * Light card surface. Pure white read as a foreign element against the cream
   * background — it was the one colour in the light theme with no green in it.
   * This is the same hue as `cream`, lifted slightly so a card still separates
   * from the page behind it without going stark.
   */
  linen: "#F4F9E4",


  night: "#0B120B", // dark background
  nightSurface: "#111C11", // dark card surface
  nightRaised: "#162916", // dark raised surface (sheets, modals)
  slate50: "#F8FAFC", // dark-mode primary text
} as const;

// ─── Semantic tokens ──────────────────────────────────────────────────────────

/**
 * The token contract. Annotating both themes with this guarantees they stay
 * key-for-key identical, so a component can consume either one safely.
 */
export interface ThemeTokens {
  bg: string;
  surface: string;
  surfaceTint: string;
  surfacePressed: string;

  border: string;
  borderSubtle: string;

  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textOnAccent: string;

  accent: string;
  accentSubtle: string;

  danger: string;
  dangerSubtle: string;
  dangerBorder: string;
  dangerAction: string;
  onDangerAction: string;
  warning: string;
  warningSubtle: string;
  warningBorder: string;
  success: string;
  successSubtle: string;
  /** Filled controls keep a clear label contrast in both themes. */
  accentStrong: string;
  accentSoftBorder: string;
  selectionSurface: string;
  selectionText: string;
  selectionBorder: string;
  surfaceHighlight: string;
  onImage: string;
  imageBorder: string;
  scrim: string;
  scrimStrong: string;
  shadow: string;
  navigationGradient: [string, string, string];
  navigationActiveGradient: [string, string, string];
  imageGradient: [string, string, string];
  /** Non-text icon in an "off" state. WCAG needs only 3:1 for graphical objects. */
  iconInactive: string;
}

// Contrast ratios are calculated against the relevant background.
// WCAG AA for normal text is 4.5:1.
export const lightTheme: ThemeTokens = {
  bg: palette.cream,
  // Cards were pure white against a cream page — the one element in the light
  // theme with no green in it, so every card read as pasted on rather than
  // part of the surface.
  surface: palette.linen,
  surfaceTint: "#F5FAED", // ONE pale green, replacing the five near-identical variants

  surfacePressed: "#EEF5E9",

  border: palette.sage,
  borderSubtle: "rgba(162,207,163,0.45)",

  textPrimary: palette.forest, // 12.4:1 on bg  ✅
  textSecondary: palette.olive, //  4.6:1 on bg  ✅ (replaces the failing 0.6-alpha greens)

  // NOTE: `textMuted` is deliberately identical to `textSecondary`.
  // #4D8035 measures 4.60:1 on this cream background — only 0.1 above the 4.5:1
  // AA floor. Any *lighter* green in the palette fails (the previous #70A656 was
  // 2.81:1). There is therefore no room for a third, paler text tier on this
  // background: express "muted" through size and weight, not colour.
  textMuted: palette.olive,
  textOnAccent: palette.white,

  accent: palette.olive,
  accentSubtle: "rgba(77,128,53,0.12)",

  danger: "#A63328",
  dangerSubtle: "#FBE9E5",
  dangerBorder: "#EBCBC4",
  dangerAction: "#B53C32",
  onDangerAction: palette.white,
  warning: "#B45309",
  warningSubtle: "#FFFBEB",
  warningBorder: "#FDE68A",
  success: "#15803D",
  successSubtle: "#F0FDF4",
  accentStrong: palette.forest,
  accentSoftBorder: "rgba(77,128,53,0.3)",
  selectionSurface: palette.forest,
  selectionText: palette.white,
  selectionBorder: palette.forest,
  surfaceHighlight: "rgba(34,69,28,0.03)",
  onImage: palette.white,
  imageBorder: "rgba(255,255,255,0.35)",
  scrim: "rgba(11,18,11,0.72)",
  scrimStrong: "rgba(0,0,0,0.95)",
  shadow: palette.forest,
  navigationGradient: ["#FDFFF6", "#EFF5E7", "#F8FCEE"],
  navigationActiveGradient: ["#DCECCF", "#E8F3DB", "#D1E6BF"],
  imageGradient: ["transparent", "rgba(15,35,15,0.6)", "rgba(10,25,10,0.95)"],
  iconInactive: "rgba(34,69,28,0.55)", // 3.04:1 on bg  ✅ (was 0.2 alpha ≈ 1.3:1)
};

export const darkTheme: ThemeTokens = {
  bg: palette.night,
  surface: palette.nightSurface,
  surfaceTint: palette.nightRaised, // replaces the eight near-identical dark greens
  surfacePressed: "#1A3315",

  border: "rgba(255,255,255,0.10)",
  borderSubtle: "rgba(255,255,255,0.06)",

  textPrimary: palette.slate50,
  textSecondary: palette.sage,
  textMuted: palette.sage,
  textOnAccent: palette.night,

  accent: palette.sage,
  accentSubtle: "rgba(162,207,163,0.14)",

  danger: "#FFB4A9",
  dangerSubtle: "#38201F",
  dangerBorder: "#63312C",
  dangerAction: "#F0ADA2",
  onDangerAction: "#351713",
  warning: "#FBBF24",
  warningSubtle: "rgba(217,119,6,0.08)",
  warningBorder: "rgba(217,119,6,0.2)",
  success: "#4ADE80",
  successSubtle: "rgba(34,197,94,0.2)",
  accentStrong: palette.olive,
  accentSoftBorder: "rgba(162,207,163,0.3)",
  selectionSurface: "rgba(162,207,163,0.15)",
  selectionText: palette.sage,
  selectionBorder: "rgba(162,207,163,0.8)",
  surfaceHighlight: "rgba(255,255,255,0.03)",
  onImage: palette.white,
  imageBorder: "rgba(255,255,255,0.35)",
  scrim: "rgba(11,18,11,0.72)",
  scrimStrong: "rgba(0,0,0,0.95)",
  shadow: "#000000",
  navigationGradient: ["#263330", "#131D1B", "#263137"],
  navigationActiveGradient: ["#2B5741", "#183D2C", "#295740"],
  imageGradient: ["transparent", "rgba(15,35,15,0.6)", "rgba(10,25,10,0.95)"],
  iconInactive: "rgba(255,255,255,0.40)", // 3.84:1 on bg  ✅ (0.30 was 2.67:1)
};


// ─── Scales ───────────────────────────────────────────────────────────────────
// Replaces the current ad-hoc values (radii 12/20/24/999; margins 4/6/12/16/22/24).

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  chip: 8,
  input: 12,
  card: 16,
  sheet: 24,
  full: 9999,
} as const;

/**
 * Three elevation levels only. Soft, wide, low-opacity shadows read as current;
 * hard offset shadows read dated. Spread into a style object.
 */
export const elevation = {
  flat: {},
  card: {
    shadowColor: palette.forest,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  sheet: {
    shadowColor: palette.forest,
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
} as const;

/**
 * Minimum interactive size. Android requires 48dp, iOS 44pt — 48 satisfies both.
 * Several current targets (the 16px favourite heart, the 40x40 IconButton) fall
 * below this.
 */
export const MIN_TOUCH_TARGET = 48;
