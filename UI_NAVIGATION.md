# Navigation & UI pass — what changed, and what I'd do next

Two things were reported: back buttons missing in places, and the "Common
Symptoms → See all" cards feeling cramped. Both are fixed. This document covers
those fixes and then lists, in priority order, the remaining replacements and
remakes I'd recommend for the UI/UX.

---

## Part 1 — The back button problem

### The actual root cause

The missing back buttons were not five separate oversights. They were one
structural problem: **there was no shared header, so "does this screen have a
way out?" was a decision each screen made on its own** — and several screens
either forgot, or only got one by accident from the navigator.

Concretely, before this pass there were **three different back button
implementations** in the codebase, plus screens with none:

| Location | What it drew |
|---|---|
| `app/symptoms.tsx` | Its own inline `Pressable` + chevron |
| `app/(tabs)/library/_layout.tsx` | A `headerLeft` on a solid `#15803d` bar |
| `app/(tabs)/library/comparison.tsx` | A third inline variant in `Stack.Screen` |
| `app/(tabs)/library/[id].tsx` loading state | **Nothing** |
| `app/(tabs)/library/[id].tsx` error state | **Nothing** |
| `app/+not-found.tsx` | Only the native "Oops!" header |

The two `[id].tsx` states are the ones you most likely hit. The plant detail
screen sets `headerShown: false` (it draws its own floating controls over the
hero image), but the loading and error branches return **early**, before that
floating header is rendered. So on a slow load — or on any bad/missing plant id
— you got a blank screen with no exit at all. Not a styling bug; a dead end.

### The fix

**Two new shared components**, so this can't silently regress:

- **`src/components/ui/BackButton.tsx`** — one control for the entire app.
  - `variant="onSurface"` (default) for normal headers, `variant="onImage"` for
    floating over photos.
  - **Never a dead end.** `router.back()` is a *no-op* when the stack is empty —
    which happens on a cold deep link, after a `replace`, or when the screen is
    first in its group. Previously that meant tapping a button that did nothing
    and looked broken. It now checks `canGoBack()` and falls back to a real
    route.
  - Tappable area padded out to the 44pt platform minimum via `hitSlop`, while
    the disc stays visually 44 so the art doesn't get heavier.
  - Platform-correct glyph: chevron on iOS, arrow on Android.
  - Haptic selection feedback, so the tap is confirmed even if the transition is
    slow.

- **`src/components/ui/ScreenHeader.tsx`** — one header for every pushed screen.
  Takes `title`, `subtitle`, `right`, `bordered`. Includes a `BackButtonSpacer`
  so the title doesn't drift when a screen legitimately has no back button.

**One contrast fix worth calling out.** Both old floating implementations drew a
white chevron on `rgba(0,0,0,0.3)`. Over a dark hero photo that's fine — but
plant photography is frequently *bright*, and a 30%-black scrim over pale
foliage leaves a white glyph on a light-grey disc at roughly **1.5:1**, which is
effectively invisible. Because the control floats over arbitrary photos, no
single translucent value is safe, so `onImage` now uses a near-opaque
`rgba(11,18,11,0.72)` disc with a hairline light border. Legible over anything.

**Screens migrated:**

- `[id].tsx` — loading and error states now render `ScreenHeader` **first**, so
  an exit exists before content resolves. They also used a hardcoded `bg-white`
  that ignored dark mode; both are themed now.
- `comparison.tsx` — the inline `headerLeft` is gone; all three states (loading,
  error, loaded) use the same `ScreenHeader`. It now also shows *which two
  plants* are being compared as the subtitle.
- `symptoms.tsx` — inline button swapped for the shared one.
- `+not-found.tsx` — was still the untouched Expo starter template (unthemed
  white page, `#2e78b7` link). Rebuilt on theme tokens with both a back button
  and an explicit "Back to home", since a 404 often means the previous route is
  also invalid.

**The library stack's green header is gone.** `#15803d` appears nowhere else in
the palette, so pushing from Library into a plant made the app look like it
changed identity mid-navigation. `headerShown: false` is now the stack default
and every screen renders its own themed header.

Two smaller navigation fixes in the same file:
- **Edge-swipe back enabled on Android.** It's off by default there, so the
  gesture now works even before the user finds the button.
- **Comparison is no longer an iOS `modal`.** A modal implies "dismiss to return
  to what you were doing", but comparison is a normal forward step that pushes
  further screens of its own. It's a card push on both platforms now.

---

## Part 2 — The cramped "See all" cards

The symptoms screen was rendering **3 columns**. On a typical phone that leaves
each card about **110pt wide** — and each card has to fit an icon, a label, and
a count badge. There wasn't room, so labels truncated and everything felt
squeezed. That's a poor trade on a screen whose entire purpose is browsing these
symptoms.

What changed:

- **3 columns → 2.** Cards are now roughly 165pt wide; labels fit on one or two
  comfortable lines.
- **Label 13px → 15px.** The old size was chosen to survive the cramped layout.
- **`minHeight` → fixed `height: 150`.** With a minimum, one two-line label made
  its *entire row* taller than the rows around it, so the grid looked uneven.
- **Icon now sits in a tinted disc** (56pt), so it reads as a deliberate element
  rather than a glyph floating in the middle of the card.
- **A grid/list toggle**, because these two jobs are genuinely different: "scan
  visually for the right symptom" wants a grid, "read down a long list" wants
  rows. The list variant shows the plant count as plain text with a chevron.
- **Gutter alignment fixed.** The header padded to 20 but the list padded to 12
  with a further 6 of card margin — so cards sat on an 18 gutter and every row
  looked *slightly* indented under the title. Both now derive from one `GUTTER`.
- **Card surface** was `#FFFFFF`, the only pure white in the app — it floated
  above the cream background instead of sitting on it. Now `theme.surface`.
- **An empty state.** Previously, if the feed hadn't produced symptoms, the
  screen was simply blank, which reads as broken.

The home-screen `SymptomGrid` stays at 3 columns — that's correct there, it's a
compact preview, not the browse surface — but its chips got a locked `96` height
so rows stop reading ragged, and the icon disc no longer disappears in dark mode
(it was `transparent`).

---

## Part 3 — The rest of the pass

Five more things I fixed while in here. Each was a case where the UI was
technically working but was either lying to the user or quietly failing a subset
of them.

**Symptom and preparation icons were all the same leaf.**
`localLibrary.ts` mapped icons with an exact-match lookup keyed on the full
lowercased label (`"sore throat"`, `"diarrhea relief"`). But those labels aren't
a fixed vocabulary — they're derived from free text in each plant's
`preparation[].uses`, which reads like *"Relieves diarrhea"*. Nothing ever
matched, so every symptom fell through to the `leaf-outline` default. The icons
were pure decoration, and identical shapes actively hurt scanning, because a
grid is navigated by visual landmarks. Replaced with ordered keyword matching
(most specific first, so "sore throat" beats the broader "pain" rule). The rules
carry Tagalog terms alongside English — an English-only table would have left
the entire Tagalog build on the fallback leaf, which is the same bug in the
other language.

**Warnings had no severity.** Every precaution rendered in the same amber, so
*"may cause mild drowsiness"* and *"toxic in high doses — do not use while
pregnant"* carried identical visual weight. On a screen whose purpose is helping
someone decide whether to ingest a plant, that flattening means the reader has
to parse all the prose to find the line that matters. Warnings are now
classified (keyword-based, both languages), sorted critical-first, and the
dangerous ones get red plus a filled octagon — a different colour *and* a
different shape, so it doesn't depend on colour vision. Unrecognised wording
stays amber: over-flagging everything red would just rebuild the flat hierarchy.

**Library search had no exit.** Typing a query left no way back to the unfiltered
list except clearing the field character by character. Added an explicit Cancel
affordance, and the surrounding chrome now collapses while the field is focused
so results get the full screen.

**Language switching was a toggle.** A two-state switch works for on/off, not for
picking from a set — it gave no preview of what you were switching *to*.
Replaced with a modal picker listing each language in its own script
(English / Tagalog), which is the convention precisely because you may not be
able to read the language you're currently stuck in.

**Quick Remedies cards clipped at large font sizes.** The card was a hard-coded
130×150 box holding a 48pt icon disc, a two-line title and a count. That budget
only holds at the default font scale; a user with larger text in their OS
accessibility settings got the method name — the one string identifying what the
card does — clipped mid-word. The box now scales with `fontScale`, capped at
1.6× so it can't outgrow the viewport, with the carousel snap interval derived
from the same numbers.

Also fixed a dark-mode tab bar drawing a light-mode shadow.

---

## Part 4 — What I'd replace or remake next

Ordered by impact per unit of effort. Nothing here is blocking; all of it is
worth doing.


### Tier 1 — high impact, low risk

**1. Finish migrating screens onto `useTheme()`.**
`src/theme/tokens.ts` now exists and is the single source of truth, but a lot of
files still carry the old inline pattern:

```tsx
const isDark = colorScheme === "dark";
color: isDark ? "rgba(248,250,252,0.6)" : "rgba(34,69,28,0.6)"
```

That literal is repeated in dozens of places. Every one is a spot where a future
palette change gets missed. Replace with `theme.textSecondary`. This is
mechanical and safe, and it's the prerequisite for any real visual refresh.

**2. Replace remaining raw `<Text>` with the `Typography` components.**
`src/components/ui/Typography.tsx` exists but adoption is partial, so font sizes
and families are still specified ad hoc per screen. Consistent type is the
single biggest driver of "this app feels designed".

**3. Add `ScreenHeader` to any *future* pushed screen by default.**
Worth a one-line rule in the README: pushed screens use `ScreenHeader`, tab roots
don't. That's what prevents this whole class of bug from returning.

**4. Skeletons everywhere data loads.**
`HomeSkeletons` exists and works well. The library list and plant detail still
show a bare spinner. Skeletons that match the final layout make loads feel
markedly faster because the layout doesn't jump when data lands.

### Tier 2 — meaningful UX wins

**5. Give the tab bar labels, or at least a selected-state label.**
Icon-only tab bars are a recurring usability finding — users guess wrong,
especially with a domain-specific icon like "scan". Low cost, real gain.

**6. Empty and error states for every list.**
The symptoms screen now has one. Library (no results for a filter), favorites
(nothing saved yet), and history (nothing scanned yet) should each get an
illustration + one sentence + one action. "Nothing here" screens are where users
decide whether an app is finished.

**7. Make the search bar do more work.**
Cancel and focus-mode are in. Still missing: recent searches, and clearing the
active symptom filter from *inside* the search bar. Right now `setActiveSymptom`
is set from two different screens and the only visible cue that a filter is
active lives in the library list.


**8. Pull-to-refresh on the home feed.**
It's an offline app, so it's cheap — but it's the gesture people reach for, and
its absence reads as "frozen".

**9. Confirm destructive actions.**
Anything that clears history or removes a favorite should be undoable (a snackbar
with UNDO is better than a confirm dialog — fewer taps, same safety).

### Tier 3 — polish and platform correctness

**10. Respect `prefers-reduced-motion`.**
There are staggered `FadeIn.delay(index * 40)` entrances and spring press
animations throughout. They're nice, but they should be gated on the OS reduce-
motion setting — for some users these actively cause discomfort, and it's an
accessibility requirement, not a preference.

**11. Audit dynamic type.**
Fixed `fontSize` values everywhere means the app ignores the user's system font
size. Quick Remedies now scales its card off `fontScale` — that pattern
(`useRemedyCardMetrics`) is the one to generalise. `GRID_CARD_HEIGHT` and
`CHIP_HEIGHT` are the remaining fixed heights at risk and should get the same
treatment, or become minimums with `numberOfLines` guards.


**12. Consolidate the shadow definitions.**
`shadowColor/Offset/Opacity/Radius` + `elevation` is copy-pasted with slightly
different values in several components. `elevation` is already exported from
tokens — use it.

**13. Image loading states.**
Plant images pop in abruptly. A tiny fade-in plus a themed placeholder block
(rather than the current grey) would smooth the library and detail screens
noticeably.

**14. Housekeeping.**
`bundle_test.js`, `emulator_screen.png`, `rebuild-home.png`, and `verify_shots/`
were local debugging leftovers in the project root; they're now covered by
`.gitignore`. `constants/Colors.ts` has been deleted — confirmed imported
nowhere.


---

## Verification

`tsc --noEmit` passes clean across the project after all changes.

**Built and run on `emulator-5554`** (universal APK — `arm64-v8a`, `armeabi-v7a`,
`x86`, `x86_64`, so the same file installs on a physical phone). Launches clean,
no `FATAL EXCEPTION`, Home renders real content.

Two things confirmed live in the running build by dumping the view hierarchy:

- **The symptom icons are now five distinct glyphs.** Before this pass every one
  of them fell through to the same `leaf-outline` (Part 3), so this is the icon
  keyword matching working end to end, not just compiling.
- **The library search `Cancel` affordance is present**, which is the search-exit
  fix.

One gotcha worth recording, since it cost time and looked like "the fixes didn't
apply": **`adb install` failed with**

```
java.io.IOException: Requested internal only, but not enough space
```

The emulator's `/data` was at 93% with ~435 MB free, and this APK is ~168 MB —
installing needs roughly double that to stage and extract. The install aborted,
the *old* build stayed on the device, and so the app looked completely unchanged.
`adb uninstall com.sdnp.hanapmedisinaoffline` first, then install. If a change
appears to have no effect, check the install actually returned `Success` before
assuming it's a code problem.

Worth checking by hand on a device, since these are visual/interaction changes:


1. Open a plant from Library → back button is visible over the hero image on
   both a **dark** and a **pale** plant photo.
2. Force a slow load or pass a bad plant id → the loading and error screens both
   show a working back button.
3. Library → plant → Compare → back, twice → lands on Library, not stuck.
4. Home → "See all" symptoms → toggle grid/list → labels aren't truncated.
5. Repeat 1–4 in dark mode.
6. Android: edge-swipe from the left in the library stack.
