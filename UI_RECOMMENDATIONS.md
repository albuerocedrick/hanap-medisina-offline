# Hanap Medisina — UI Modernization Recommendations

**Scope:** visual/UI only. **The existing palette is preserved** — every colour named
below is one already present in the codebase. Nothing new is introduced; the
recommendations are about *consolidating* and *systematizing* what's already there.

Based on a code review of `app/` and `src/` (Expo 52, React Native 0.76, NativeWind 4,
Reanimated 3). Contrast ratios below are calculated from the source values; full
accessibility validation still needs real-device testing.

§9 is different from the rest: it was **observed on a running device**, not inferred
from source. Sections 1–8 remain static analysis.


---

## 1. The core problem: there is no single source of truth for colour

This is the highest-impact issue, and almost everything else follows from it.

Right now there are **three competing definitions** of the app's colours:

| Source | Contents | Status |
|---|---|---|
| `constants/Colors.ts` | `#2f95dc` blue, `#fff`, `#000`, `#ccc` | **Dead code** — untouched Expo template, imported nowhere |
| `tailwind.config.js` | `#F2F2F7`, `#34C759`, `#1C1C1E`, `#8E8E93`, `#C6C6C8` | **Wrong** — Apple system colours that don't match the actual app |
| Inline literals | `#FAFEEF`, `#22451C`, `#4D8035`, `#A2CFA3`, … | **The real palette** — scattered across components |

Measured across `app/` + `src/`:

- **53 distinct hex colours**
- **669 `rgba()` literals**

The real palette is only about eight colours. The other ~45 are near-duplicates that
crept in one component at a time.

### Duplicates worth collapsing

**Five nearly identical pale greens** — visually almost indistinguishable:

```
#EAF3D5   #EEF5E9   #F4FAE8   #F5FAED   #F2F9F2
```

**Eight nearly identical dark greens** — same problem in dark mode:

```
#0B120B   #111C11   #121A14   #162916   #0F1A0F   #1A3315   #1A3312   #1E3A2F
```

Collapse the pale greens to **two** (one tint, one hover/pressed) and the darks to
**three** (background / surface / raised). That alone removes ~11 colours and makes
dark mode look deliberate instead of drifting.

### Recommendation

> **Status: scaffolded.** `src/theme/tokens.ts` and `src/theme/useTheme.ts` now exist
> in the project. They are purely **additive** — no existing component imports them
> yet, so nothing changed visually and `npx tsc --noEmit` passes with 0 errors.
> Migration can proceed one component at a time.

Semantic names mapped to the colours you already use. Once components are migrated,
delete `constants/Colors.ts` and fix `tailwind.config.js` to match:

```ts
export const tokens = {
  light: {
    bg:            '#FAFEEF',  // existing app background
    surface:       '#FFFFFF',  // existing
    surfaceTint:   '#F5FAED',  // pick ONE of the five pale greens
    border:        '#A2CFA3',  // existing
    textPrimary:   '#22451C',  // existing  — 12.4:1 on bg
    textSecondary: '#4D8035',  // existing  —  4.6:1 on bg (AA pass)
    accent:        '#4D8035',  // existing
  },
  dark: {
    bg:            '#0B120B',  // existing
    surface:       '#111C11',  // existing
    surfaceRaised: '#162916',  // existing
    border:        'rgba(255,255,255,0.10)',
    textPrimary:   '#F8FAFC',  // existing
    textSecondary: '#A2CFA3',  // existing
  },
} as const;
```

The `useTheme()` hook (`src/theme/useTheme.ts`) replaces the
`const isDark = colorScheme === "dark"` + inline-ternary pattern that currently appears
in essentially every component:

```tsx
// before
const { colorScheme } = useColorScheme();
const isDark = colorScheme === "dark";
<Text style={{ color: isDark ? "rgba(248,250,252,0.6)" : "rgba(34,69,28,0.6)" }} />

// after
const t = useTheme();
<Text style={{ color: t.textSecondary }} />
```

That single change is what eliminates most of the 669 `rgba()` literals — and note the
"after" also fixes a contrast failure for free, since `textSecondary` is the
AA-passing `#4D8035` rather than the 3.44:1 alpha green.

`tokens.ts` also ships `spacing`, `radius`, `elevation`, and `MIN_TOUCH_TARGET`,
covering the scales in §4 and the touch-target minimum in §6.

---

## 2. Contrast: three muted-text values currently fall below AA

These are calculated ratios against the `#FAFEEF` background. WCAG AA for normal
text is **4.5:1**.

| Usage | Where | Ratio | Verdict |
|---|---|---|---|
| `#70A656` (`muted` in Typography) | `ui/Typography.tsx` | **2.81:1** | ❌ Fails |
| `rgba(34,69,28,0.4)` "+N more" @ 10px | `library/plant-card.tsx` | **2.14:1** | ❌ Fails badly |
| `rgba(34,69,28,0.6)` descriptions @ 12–13px | `plant-card.tsx`, others | **3.44:1** | ❌ Fails |
| `rgba(34,69,28,0.7)` greeting label | `home/HomeHeader.tsx` | **4.49:1** | ⚠️ Borderline |
| `#4D8035` | Button, accents | **4.60:1** | ✅ Passes |
| `#22451C` | body/heading text | **~12.4:1** | ✅ Passes |

**Fix:** stop expressing muted text as alpha over the background, and use the solid
`#4D8035` token instead. It's already in your palette and it passes. Where alpha is
genuinely wanted, `0.75` is the practical floor. This matters more than usual here —
this is a health app where the fine print carries dosage and safety information.

---

## 3. Cards read as flat outlines (light mode)

`plant-card.tsx` renders with `backgroundColor: "transparent"` and a
`StyleSheet.hairlineWidth` border. Two consequences:

1. Cards have no surface of their own, so a list reads as a stack of wireframes.
2. Hairline borders are sub-pixel on Android and **drop out entirely** on some
   densities, so the card can vanish into the background.

**Modern treatment, same colours:**

- Give cards a real surface — `#FFFFFF` (light) / `#111C11` (dark).
- Replace `hairlineWidth` with a solid `1` at low alpha.
- Add one soft shadow (`shadowOpacity ~0.06`, `radius 12`, `offset {0,4}`,
  `elevation 2`). Soft, wide, low-opacity shadows are the current idiom; hard
  offset shadows read dated.
- Inset the thumbnail with a matching inner radius instead of a flush square edge.

The `expo-linear-gradient` dependency is already installed — a subtle bottom scrim
over plant photos would make overlaid text legible regardless of the image.

---

## 4. Elevation, radius, and spacing scales

Current radii are `12`, `20`, `24`, `999`; margins run `4 / 6 / 12 / 16 / 22 / 24`
with no pattern. Arbitrary values are one of the fastest ways for a UI to feel
unconsidered.

- **Radius:** `8` (chips) / `12` (inputs) / `16` (cards) / `24` (sheets) / `full` (pills)
- **Spacing:** `4 / 8 / 12 / 16 / 24 / 32` — note `22` in `HomeHeader` is off-grid
- **Elevation:** three levels only — flat, card, sheet

---

## 5. Typography

`ui/Typography.tsx` defines a clean five-variant scale — but it's barely used.
Most components write raw `<Text style={{ fontFamily: "Quicksand_700Bold", fontSize: 16 }}>`.
Route everything through `Typography` so the scale is enforced in one place.

Two specific issues:

- **`fontFamily: "serif"` + italic** for scientific names (`plant-card.tsx`) pulls the
  platform default serif — which differs between Android and iOS and clashes with
  Quicksand. Use Quicksand at reduced weight/opacity instead; italic alone is enough
  to signal binomial nomenclature.
- **Quicksand tops out at 700**, and `tailwind.config.js` maps `extrabold → 700`.
  Headings therefore can't out-weight bold body text. `@expo-google-fonts/plus-jakarta-sans`
  **is already a dependency** — using it for headings and numerals would give you
  genuine weight contrast and a more contemporary, geometric feel, while Quicksand's
  friendly rounding stays for body copy. Optional, but it's the single biggest
  "feels modern" lever available, and it costs no new dependency.

---

## 6. Touch targets and accessibility

- **Favourite heart** (`plant-card.tsx`): 16px icon + `hitSlop 10` ≈ 36dp.
  Android's minimum is **48dp**, iOS **44pt**.
- **`IconButton`** (`HomeHeader.tsx`): 40×40 — just under.
- Interactive `TouchableOpacity`s lack `accessibilityRole` and `accessibilityLabel`.
  The favourite toggle also needs `accessibilityState={{ selected: isFavorite }}`.
- No reduced-motion handling. Reanimated springs run unconditionally — gate them on
  `AccessibilityInfo.isReduceMotionEnabled()`.
- Consider `maxFontSizeMultiplier` on tight single-line text so large system font
  sizes don't clip layouts.

---

## 7. Screen-level notes

**Home** (`app/(tabs)/index.tsx`) — when `isSearchActive` is true, the entire feed
unmounts (`{!isSearchActive && ...}`). Every section is destroyed and rebuilt on each
search toggle: scroll position is lost and it reads as a hard flash. Overlay the
results above the feed instead, or animate a cross-fade.

**Scan** (`app/(tabs)/scan.tsx`, 30 KB — the largest file and the app's signature
moment). Worth the most design attention:
- A clear focus reticle and capture affordance.
- **Show the confidence score**, and design an explicit low-confidence / "not sure"
  state. For a medicinal-plant identifier this is a safety requirement, not a nicety —
  a confidently-wrong ID is the worst failure mode this app has.
- `@gorhom/bottom-sheet` is already installed — a result sheet that can be dragged up
  for detail is the natural pattern.
- A persistent, non-dismissable medical disclaimer.

**Tab bar** (`app/(tabs)/_layout.tsx`, 10 KB) — `expo-blur` is already available; a
floating translucent bar with a `#4D8035` pill indicator would modernize it. Verify
48dp targets and safe-area insets.

**`GlassCard`** — hardcodes `tint="light"`, so it stays light in dark mode. Also note
`BlurView` is comparatively expensive on Android; consider a solid surface fallback
below a performance threshold.

---

## 8. Housekeeping

- `app/(tabs)/home.html` (12 KB) sits inside the router directory. If it's a design
  mockup it should live outside `app/`.
- `plant-card.tsx` types its prop as `MedicinalPlant | any` — the `| any` disables
  checking for the whole component.
- Delete `constants/Colors.ts` (dead template).

---

## 9. Verified on device: the app never becomes idle

**How this was found:** with the app running on `emulator-5554`, every attempt to
capture the view hierarchy failed:

```
$ adb shell uiautomator dump
ERROR: could not get idle state.
```

Ten attempts, including after setting all three system animation scales to `0`.
"Could not get idle state" means the framework never observes a quiet frame — the UI
is being invalidated continuously, forever, while the app just sits on Home.

**Cause** — `src/components/home/MascotChatSlot.tsx:80`:

```ts
if (mode === "idle" || mode === "sleeping") {
  // Loop endlessly
  frame.value = withRepeat(
    withTiming(activeConfig.frames, { duration: durationMs, easing: Easing.linear }),
    -1, // infinite
    false
  );
}
```

`idle` is the mascot's **default resting state**, so this loop runs the entire time the
Home tab is visible — it is the steady state, not an exception. (`HomeSkeletons.tsx:15`
has the same `-1` pattern, but skeletons unmount once data loads, so they're bounded
and fine.)

**Why it matters, beyond tooling:**

- **Battery and thermals.** A sprite ticking at `frames / 16` s never lets the JS or UI
  thread rest, on a phone, indefinitely, for a decorative element. On low-end Android —
  likely a meaningful share of this app's users — that is a real cost.
- **Accessibility.** This is exactly the animation §6 says to gate behind
  `AccessibilityInfo.isReduceMotionEnabled()`. A perpetually moving character is also a
  known problem for vestibular sensitivity and for attention/focus disorders.
- **Automated testing.** Anything built on UIAutomator — Espresso, Maestro, Detox, and
  **Google Play's pre-launch report** — can stall the same way I did. This may surface
  as flaky or failing checks at submission time.

**Suggested fix** — pause the loop when it isn't earning its keep:

1. Gate on reduced motion; render a single static frame when it's on.
2. Stop the loop when Home isn't focused (`useIsFocused()` / `useFocusEffect`) and on
   `AppState` background — `cancelAnimation(frame)`.
3. Consider letting `idle` settle: play the idle cycle a few times, then rest on a
   static frame until the user interacts. The mascot stays characterful without
   animating for the entire session.

Worth noting this is the one item on this list that static review would not have
caught. It only showed up because the running device refused to answer.

---

## Suggested order of work


1. ~~**Token layer + `useTheme()`**~~ — ✅ **done** (`src/theme/`). Adopting it in
   components is the remaining mechanical work.
2. **Contrast fixes** — small diff, real accessibility gain, safety-relevant.
3. **Card surfaces, radius/spacing scales** — where the "more modern" is most visible.
4. **Typography routing** (+ optional Plus Jakarta Sans for headings).
5. **Touch targets and a11y labels.**
6. **Mascot animation loop (§9)** — battery, reduced motion, and unblocking
   UIAutomator-based tooling before you hit Play's pre-launch report.
7. **Scan screen confidence states.**
8. **Home search transition.**

Steps 1–3 are low-risk, mostly find-and-replace, and would change the perceived
quality of the app more than anything else on this list. Step 6 is small but has the
widest blast radius outside pure visuals.


