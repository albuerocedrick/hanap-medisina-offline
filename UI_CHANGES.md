# UI fixes — implementation notes

Companion to `UI_RECOMMENDATIONS.md`. That document is the audit; this one records
what was actually changed, and why each change is the one it is.

Verified: `npx tsc --noEmit` exits 0; release APK builds, installs, and runs on
an emulator with the Home screen idling at **0 rendered frames over 10s** (see
"Build & verification" at the bottom).


---

## 1. The one that actually matters: the mascot never stopped animating

`MascotChatSlot` drove its sprite sheet with `withRepeat(..., -1)` in both `idle`
and `sleeping`. Those are *resting* states, so on the Home tab the animation ran
continuously for as long as the app was open. Three `setInterval`s ran alongside
it — in every mode, focused or not.

Consequences, roughly in order of severity:

1. **The UI thread never goes idle.** Google Play's pre-launch report drives the
   app through UIAutomator, which waits for an idle frame before each action.
   A permanent animation can stall that wait until it times out. Same mechanism
   breaks Espresso and Detox.
2. **Battery.** A continuous 64-frame loop on the Home tab of an app aimed at
   rural, low-end Android hardware.
3. **`prefers-reduced-motion` was ignored**, which for a vestibular-sensitive
   user is not a preference but an accessibility barrier.

Fix:

- `idle`/`sleeping` now play `RESTING_CYCLES` (3) and settle on a static frame.
- All animation is gated on `useIsFocused() && AppState === "active" && !reduceMotion`.
- When gated off, a static frame shows — but the state machine still advances on a
  timeout, otherwise `expression` would never hand back to `idle` and the mascot
  would freeze mid-pose.
- Each interval now starts only in the mode that needs it, and only while focused.
- Sleep dots are bounded (`MAX_SLEEP_DOT_TICKS`), then settle.
- `cancelAnimation` on unmount.

`HomeSkeletons` keeps its infinite pulse deliberately: skeletons unmount when data
arrives, so that loop is self-limiting. It now respects reduce-motion (falling back
to a steady 0.7 opacity, which still reads as "loading") and cancels on unmount.

## 2. Contrast

Two failures against WCAG AA (4.5:1 for normal text):

| Where | Was | Ratio | Now | Ratio |
|---|---|---|---|---|
| `Typography` `muted` | `#70A656` | 2.81:1 ✗ | `#4D8035` | 4.60:1 ✓ |
| `HomeHeader` greeting | `rgba(34,69,28,0.7)` | 4.49:1 ✗ | `#4D8035` | 4.60:1 ✓ |
| `PlantCard` inactive heart | `rgba(34,69,28,0.2)` | ~1.3:1 ✗ | `rgba(34,69,28,0.55)` | 3.04:1 ✓ |

The greeting missed by 0.01 — invisible in review, and exactly the sort of thing a
token file prevents.

**`muted` and `secondary` now resolve to the same colour, on purpose.** `#4D8035`
is the lightest green in the existing palette that passes on the cream background;
anything paler fails. There is no room for a third text tier in colour here, so
"muted" has to be expressed through size and weight. Introducing a new hue to
create one would have meant inventing a colour the app doesn't use.

`Typography` also had no `dark:` variants at all — it rendered dark green on the
near-black dark background. Each colour now carries both.

## 3. Design tokens

`src/theme/tokens.ts` + `useTheme()`. Every value is one already in use; this
consolidates ~53 inline hex literals and ~669 `rgba()` calls, and collapses five
near-identical pale greens and eight near-identical dark greens into one
`surfaceTint` per scheme.

Adoption is incremental — the file is additive. Migrated so far: `PlantCard`,
`HomeHeader`, `IconButton`, `Typography`, `GlassCard`.

Also added: `spacing` (4/8/12/16/24/32), `radius`, `elevation` (three levels),
`MIN_TOUCH_TARGET`.

## 4. Touch targets

48dp satisfies Android's 48dp minimum and iOS's 44pt in one number.

- `ui/IconButton`: 44 → 48.
- `HomeHeader`'s local `IconButton`: 40 → 48.
- `PlantCard` favourite heart: the 16px icon was its own hit area; now a 48dp
  target with negative margins so the icon stays optically in the corner.

`IconButton`'s `accessibilityLabel` is now a **required** prop — an icon-only
button with no label is silent to a screen reader, and making it optional means
the next one will ship without it. The theme toggle now announces its
*destination* ("Switch to dark theme"), not its current state.

## 5. Card surfaces

`PlantCard` had `overflow-hidden` on the same element as its shadow, which clips
the shadow to the element bounds and mostly cancels it. Split: the outer view
carries background/border/shadow, the inner row carries `overflow: hidden`.

Also: the thumbnail is inset with its own radius rather than flush to the card
edge, and `fontFamily: "serif"` is gone from `PlantCard` and `MascotChatSlot` —
it resolved to a different face on Android vs iOS and clashed with Quicksand.
Italic alone carries the binomial-nomenclature convention.

## 6. Housekeeping

- `constants/Colors.ts` **deleted** — Expo template leftover (`#2f95dc`), verified
  imported nowhere.
- `GlassCard` had `tint="light"` hardcoded and a `border-white/20` that is
  invisible on a light background — i.e. it was wrong in both schemes. Both now
  follow the colour scheme. (It's currently unreferenced; fixed rather than
  deleted since the bug would resurface the moment someone used it.)
- `maxFontSizeMultiplier` on the card and header text, so large system font
  sizes scale without shattering single-line layouts.

---

## What I did not change

`tailwind.config.js` still contains an unused Apple-system-colour palette. It's
dead config, but it's inert, and removing it is a separate mechanical change best
done in its own commit rather than buried here.

Most of the app still reads `colorScheme === "dark"` inline. Migrating every
component to `useTheme()` in one pass would be a large, hard-to-review diff across
files this change set never otherwise touches. The token layer is in place and
five components are on it; the rest can follow incrementally.

## Build & verification

Release APK rebuilt, installed on `emulator-5554`, launched clean — no
`FATAL EXCEPTION`, Home renders with real content.

The headline fix measured directly, sitting idle on Home:

```
adb shell dumpsys gfxinfo com.sdnp.hanapmedisinaoffline reset
# ...wait 10s on the Home tab...
adb shell dumpsys gfxinfo com.sdnp.hanapmedisinaoffline
→ Total frames rendered: 0
```

**0 frames in 10 seconds.** Before this change that figure would have been in the
hundreds — the mascot repainted continuously. `adb shell uiautomator dump` also
now returns in ~2.3s instead of blocking on an idle wait, which is the specific
mechanism that stalls Play's pre-launch report.

### Two things to know about the build

1. **`npm run android:release` is currently broken on this machine, independently
   of these changes.** It pins `CMAKE_VERSION=3.31.6`, but only CMake **3.22.1** is
   installed in the SDK, so the build dies at
   `:react-native-reanimated:configureCMakeRelWithDebInfo` with
   `[CXX1300] CMake '3.31.6' was not found`. I built by dropping that env var,
   which lets AGP use 3.22.1 — it compiles fine. I left `package.json` alone since
   the pin looks deliberate; either install 3.31.6 via the SDK Manager or drop the
   pin from the script.
2. **The release APK is universal.** Final verification build shipped with all
   four ABIs (`arm64-v8a, armeabi-v7a, x86, x86_64`) — it installs on both the
   emulator and physical phones. The earlier x86_64-only emulator build was
   superseded; the current `HanapMedisina-ui-fixes.apk` is a full ABI release.


### Still worth a human eye

Frame counts confirm the loop is fixed; they say nothing about whether it *looks*
right.

1. **The resting behaviour is a judgement call.** Three cycles then a static pose is
   my guess at "alive but not annoying". You may prefer the idle loop to re-trigger
   every ~30s, which would keep some life on screen while still letting the UI go
   idle between bursts.
2. **Herbi's resting frame.** He rests on whichever frame the animation lands on. In
   the emulator he settled into `sleeping` correctly (the bounded "zzzzz" renders),
   but if a resting frame turns out to be mid-blink he'll sit there with his eyes
   shut — pin a chosen frame if so.
3. Reduce-motion (Android: Settings → Accessibility → Remove animations).
4. The 48dp targets against the surrounding layout — the negative margins on the
   heart assume the current card padding.
5. Contrast ratios are calculated, not measured on a panel.


