# Audit finding resolutions

Resolved against `codebase_audit_report.md` on 2026-10-15. The original audit is
retained as the historical findings list. Duplicate findings are mapped below.

## Critical findings

| Finding | Resolution |
| --- | --- |
| C-01 | Shared, reference-counted model loading; cancelled consumers receive no state updates, and the final consumer releases the cached reference. The installed fast-tflite **1.6.1 has no `dispose()` API**; its native HostObject destructor owns interpreter deletion. |
| C-02 | Capture uses a current callback ref and consumes each trigger once. A session lock prevents overlapping captures and rejects cancelled results. |
| C-03 | Favorites persist as plant IDs in one canonical key; both former object formats migrate. Full, current-language records are resolved from bundled data only in memory. |
| C-04 | Import checks file metadata before reading, rejects files over **25 MiB**, and handles missing/unavailable size metadata. The limit accounts for JSON/base64 heap overhead. |
| C-05 | File deletions run concurrently in bounded batches. Failed deletions retain their scan records for retry; successful deletions cannot remove scans added during the operation. |
| C-06 | Import replaces or merges favorites with one serialized durable operation, including empty replacement. The old loop used immutable array replacement rather than in-place mutation, but still lacked an atomic replacement operation and skipped empty backups. |

## Warning findings

| Finding | Resolution |
| --- | --- |
| W-01 | The scan route delegates capture control, inference, permissions, the result sheet, the reticle, and layout styles to separate modules. |
| W-02 | Removed scan's private color tokens; all scan colors come from the shared theme. |
| W-03 | Displayed plants use a memoized selector keyed by actual search/filter inputs. |
| W-04 | Plant details no longer reload on unrelated favorites changes; favorite status remains reactive. |
| W-05 | Scan and result sheet dimensions use `useWindowDimensions()`. |
| W-06 | `getHomeFeed(language)` receives its language explicitly and passes it through to feed sections. |
| W-07 | Shared catalogs load each language on demand. The bilingual search index initializes on the first nonempty search, retaining cross-language search behavior. |
| W-08 | Details navigation uses a synchronous catalog lookup; removed the ineffective race and timeout. |
| W-09 | Native image URI resolution is deferred until a plant image is accessed and then cached. |
| W-10 | Scan IDs and saved capture filenames use cryptographic UUIDs from Expo Crypto. |
| W-11 | Daily trivia uses seeded Fisher–Yates shuffling. |
| W-12 | Font errors release the splash screen and allow fallback rendering; render errors have a localized recovery screen. |
| W-13 | Profile updates accept `Partial<ProfileData>` and whitelist data fields at runtime. |
| W-14 | Session state keeps capture locked until async work settles and keeps dismissal locked until the real exit animation finishes. JavaScript already executes `finally` on `return`; the protection now explicitly covers the animation interval. |

## Informational findings

| Finding | Resolution |
| --- | --- |
| I-01 | Kept `cn()` for explicit class conflict resolution and used it in shared Typography, Button, and ScreenWrapper primitives. NativeWind does not make explicit conflict resolution redundant. |
| I-02 | Application/service/store console output is guarded with `__DEV__`. |
| I-03 | Removed the unused legacy `Herbi` component; `MascotChatSlot` is the documented active home mascot. |
| I-04 | Added `npm test` and `npm run typecheck`. CommonJS test files intentionally use Node's runner, TypeScript transpilation, and native-module mocks; the convention is documented. |
| I-05 | Verified there are no tracked training sources/cache artifacts and documented that this is an inference app, not a training repository. Added general Python cache exclusions. |
| I-06 | Kept the Expo plugin's CommonJS entry point for prebuild compatibility, added TypeScript checking through JSDoc and `@ts-check`, and included it in `npm run typecheck`. A TypeScript runtime loader is unnecessary. |
| I-07 | Accessibility controls use English/Tagalog translations, including scan, favorites, view modes, navigation, and password visibility. |
| I-08 | Plant details imports `StyleSheet` once and uses `StyleSheet.hairlineWidth`. |
| I-09 | Verified the reported root bundles/APKs/screenshots are not tracked and already have ignore rules. Added missing site bundle, release-directory, and verification-output exclusions; existing local artifacts were preserved. No history rewrite was needed. |
| I-10 | Moved the HTML design prototype to `docs/prototypes/home.html`, outside Expo Router's route tree. |

## Cross-cutting and performance findings

| Finding | Resolution |
| --- | --- |
| XC-01 | Routes and reusable components consume shared semantic light/dark tokens, including status, overlays, selection, and action colors. Removed duplicate inline palette choices and palette-specific utility classes. |
| XC-02 | Cross-layer imports use `@/src/...`; local sibling imports and static asset paths remain relative. |
| XC-03 | Language synchronization has an explicit app-start initializer and unsubscribe cleanup, replacing subscriptions created by importing stores. Startup also loads/migrates canonical favorites. |
| XC-04 | A root React error boundary and Expo Router error fallback provide a localized retry action. |
| P-01 | Covered by W-03; unrelated store updates preserve the memoized result reference. |
| P-02 | Covered by W-07; the library/search share lazily loaded catalogs. |
| P-03 | List/grid modes use rows within one FlatList, so toggling does not remount the list. |
| P-04 | The captured still is normalized/resized natively; base64/JPEG decoding, tensor padding, and TFLite execution run on a background worklet. A pinned, licensed decoder is checked byte-for-byte against jpeg-js through its serialized worklet code. |
| P-05 | Covered by C-05; bulk deletion overlaps native I/O and reports partial failure. |

## Second-pass findings (NEW-01 through NEW-06)

| Finding | Resolution |
| --- | --- |
| NEW-01 | Downscaled mascot sprite sheets by 50% with lanczos filter and indexed 256-color palette quantization with alpha reservation. Total asset payload dropped from **41.01 MB to 3.59 MB (-91.2%)**, and bitmap RAM consumption per loaded sheet was reduced from **12.9 MB to ~3.2 MB**. `MascotChatSlot.tsx` was made resolution-aware to keep exact 1:1 render dimensions. |
| NEW-02 | In `useTFLite.ts`, `sharedLoad` is cleared on rejection so failed loads can be retried without restarting the app. Exported `retry()` callback, routed through `useScanController`, and added an interactive retry button on the scanner screen with localized translations. |
| NEW-03 | Implemented `MAX_SCAN_HISTORY = 500` in `useHistoryStore.ts`. `addScan` and `importScans` enforce this cap by pruning the oldest non-favorite scan first while preserving all favorites. Added a warning banner in the History screen when scans reach 450 (90% capacity). |
| NEW-04 | Uninstalled 6 unused native packages (`@gorhom/bottom-sheet`, `@shopify/flash-list`, `vision-camera-resize-plugin`, `expo-video`, `react-native-reanimated-carousel`, `@expo-google-fonts/plus-jakarta-sans`) and removed `expo-video` from `app.json` plugins. |
| NEW-05 | Added `/.audit-build*/` and `.audit-build*` to `.gitignore` to prevent CI/build contention with locked emulator logs. |
| NEW-06 | Added defensive null check for `FileSystem.documentDirectory` in `useScanController.ts`. |

## Validation

**158 automated regression tests pass** across 15 suites with 0 failures (`npm test`).
Both application and plugin TypeScript checks pass with 0 errors (`npm run typecheck`).
Android production Hermes bundling succeeds cleanly (`npx expo export --platform android`).

