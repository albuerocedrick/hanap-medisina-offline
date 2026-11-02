# Graph Report - hanap-medisina-offline  (2026-11-02)

## Corpus Check
- 151 files · ~1,123,494 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: .tflite 4, (none) 1, .ttf 1)

## Summary
- 1151 nodes · 2667 edges · 54 communities (46 shown, 8 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 77 edges (avg confidence: 0.91)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a8a6f5aa`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- dependencies
- decodeScanJpeg
- Multi-agent codebase audit
- localLibrary.ts
- useFeedStore.ts
- package.json
- expo
- Hanap Medisina Offline
- app/_layout.tsx
- ref_node_test
- Medicinal Plant Leaf Classification
- useTranslation
- renderApp.cjs
- uiWorkflows.test.cjs
- AGENTS.md
- android-smoke.cjs
- ref_node_assert
- compilerOptions
- MascotChatSlot.tsx
- scanInference.test.cjs
- scanLifecycle.test.cjs
- metro.config.js
- devDependencies
- scripts
- Hanap Medisina — UI Modernization Recommendations
- useTheme
- illnessCatalog.ts
- plantSearch.ts
- appContracts.test.cjs
- comparePicker.test.cjs
- Plant photograph credits
- useSettingsStore.ts
- physical-checklist.tsx
- mascotLayout.test.cjs
- dataStores.test.cjs
- profilePhotoSuccess.test.cjs
- index.ts
- plantLocalization.test.cjs
- filter-pills.tsx
- libraryBootstrap.test.cjs
- useScanInference.ts
- appRecovery.test.cjs
- decodeScan
- useLibraryStore.ts
- libraryAlphabetical.test.cjs
- useTFLite.ts
- Q: Check trained TFLite labels against the Library and fix symptom search

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 153 edges
2. `useTranslation()` - 105 edges
3. `react` - 74 edges
4. `react-native` - 66 edges
5. `@expo/vector-icons` - 41 edges
6. `useLibraryStore` - 38 edges
7. `Plant photograph credits` - 32 edges
8. `expo-router` - 25 edges
9. `react-native-reanimated` - 22 edges
10. `MedicinalPlant` - 20 edges

## Surprising Connections (you probably didn't know these)
- `Executive Summary` --references--> `ScanScreen()`  [INFERRED]
  codebase_audit_report.md → app/(tabs)/scan.tsx
- `4. Elevation, radius, and spacing scales` --references--> `HomeHeader()`  [INFERRED]
  UI_RECOMMENDATIONS.md → src/components/home/HomeHeader.tsx
- `1. The one that actually matters: the mascot never stopped animating` --references--> `MascotChatSlot()`  [INFERRED]
  UI_CHANGES.md → src/components/home/MascotChatSlot.tsx
- `Part 2 — The cramped "See all" cards` --references--> `SymptomGrid()`  [INFERRED]
  UI_NAVIGATION.md → src/components/home/SymptomGrid.tsx
- `What I did not change` --references--> `useTheme()`  [INFERRED]
  UI_CHANGES.md → src/theme/useTheme.ts

## Import Cycles
- None detected.

## Communities (54 total, 8 thin omitted)

### Community 0 - "dependencies"
Cohesion: 0.04
Nodes (48): dependencies, babel-preset-expo, buffer, clsx, expo, expo-asset, expo-blur, expo-build-properties (+40 more)

### Community 1 - "decodeScanJpeg"
Cohesion: 0.24
Nodes (6): decodeScanJpeg(), buildComponentData(), prepareComponents(), readDataBlock(), readUint16(), requestMemoryAllocation()

### Community 2 - "Multi-agent codebase audit"
Cohesion: 0.10
Nodes (19): 1. Map the repo (commands), 2. Partition heuristics, 3. Per-slice auditor subagent, 4. Cross-cutting / architecture critic, 5. Completeness critic, 6. Coverage ledger (goes in the final report), Partitioning, prompts & the coverage ledger, 1. Map the repo (+11 more)

### Community 3 - "localLibrary.ts"
Cohesion: 0.20
Nodes (16): getActivePlants(), getAllCategories(), getAllSymptoms(), getPlantById(), getPlantsByCategory(), getPlantsByPreparationMethod(), getPlantsBySymptom(), imageMap (+8 more)

### Community 4 - "useFeedStore.ts"
Cohesion: 0.18
Nodes (15): getHomeFeed(), mulberry32(), getAllIllnesses(), getAllPreparationGroups(), resolveMethodIcon(), FeedActions, FeedState, FeedStore (+7 more)

### Community 5 - "package.json"
Cohesion: 0.08
Nodes (25): main, name, private, version, babel-preset-expo, buffer, cross-env, expo-build-properties (+17 more)

### Community 6 - "expo"
Cohesion: 0.07
Nodes (29): backgroundColor, foregroundImage, adaptiveIcon, edgeToEdgeEnabled, package, predictiveBackGestureEnabled, typedRoutes, expo (+21 more)

### Community 7 - "Hanap Medisina Offline"
Cohesion: 0.12
Nodes (15): Architecture, Building for Distribution, Export & Import, Getting Started, Hanap Medisina Offline, How to Add New Plants, How to Update the TFLite Model, License (+7 more)

### Community 8 - "app/_layout.tsx"
Cohesion: 0.18
Nodes (12): AppContent(), ErrorBoundary(), RootLayout(), expo-font, @expo-google-fonts/quicksand, expo-splash-screen, Onboarding(), AppErrorBoundary (+4 more)

### Community 9 - "ref_node_test"
Cohesion: 0.20
Nodes (7): addHighRefreshRate(), { mergeContents }, withHighRefreshRate(), { withMainActivity }, { addHighRefreshRate }, assert, test

### Community 10 - "Medicinal Plant Leaf Classification"
Cohesion: 0.15
Nodes (12): Cell 1: Mount Google Drive, Cell 2: Set Up Data Pipeline, Cell 3: Build the MobileNetV3-Large Architecture, Cell 4: Train the AI, Cell 5: The Final Exam (Evaluating the Test Set), Cell 6: Export to TFLite and Save Labels, Cell 6b (Optional): Full-Integer Quantization for Maximum Accuracy Retention, Cell 7: The Retraining Phase (Fine-Tuning) (+4 more)

### Community 11 - "useTranslation"
Cohesion: 0.05
Nodes (88): NotFoundScreen(), AnimatedPressable, QuickRemediesScreen(), RemedyCard(), ViewMode, ViewToggle(), AllSymptomsScreen(), AnimatedPressable (+80 more)

### Community 12 - "renderApp.cjs"
Cohesion: 0.06
Nodes (30): react-test-renderer, { act }, assert, { environment }, setup(), test, { act }, assert (+22 more)

### Community 13 - "uiWorkflows.test.cjs"
Cohesion: 0.06
Nodes (31): Automated evidence and limits, Backup export/import and data integrity — 15 cases, Camera and scan — 17 cases, Completion checklist, Environment matrix, HanapMedisina functional test cases, History — 10 cases, Home, search, symptoms and preparations — 9 cases (+23 more)

### Community 15 - "android-smoke.cjs"
Cohesion: 0.13
Nodes (30): BlockedError, command(), crashLines(), crypto, decodeXml(), delay(), { execFileSync }, executableOnPath() (+22 more)

### Community 16 - "ref_node_assert"
Cohesion: 0.13
Nodes (9): { act }, assert, { environment }, illnessIds, test, { act }, assert, { environment } (+1 more)

### Community 17 - "compilerOptions"
Cohesion: 0.22
Nodes (8): expo/tsconfig.base, compilerOptions, module, moduleResolution, paths, strict, extends, include

### Community 18 - "MascotChatSlot.tsx"
Cohesion: 0.05
Nodes (33): 🗺 Coverage Ledger, Executive Summary, Hanap Medisina Offline — Codebase Re-Audit Report & Resolution Ledger, Historical Findings Verification Status, Partition Map & Coverage Ledger, Second-Pass Findings (NEW-01 through NEW-06) — Post-Fix Re-Audit, Tabular Implementation Plan (Final Status), Validation Summary (+25 more)

### Community 19 - "scanInference.test.cjs"
Cohesion: 0.11
Nodes (10): jpeg-js, assert, babel, { decodeScanJpeg }, fs, jpeg, { makeScanInput, decodeScanBase64, bestScanOutput }, path (+2 more)

### Community 20 - "scanLifecycle.test.cjs"
Cohesion: 0.12
Nodes (9): assert, fs, path, push(), { ScanSession }, test, ts, useEffect() (+1 more)

### Community 21 - "metro.config.js"
Cohesion: 0.40
Nodes (4): config, { getDefaultConfig }, { withNativeWind }, expo

### Community 22 - "devDependencies"
Cohesion: 0.40
Nodes (5): devDependencies, cross-env, react-test-renderer, @types/react, typescript

### Community 23 - "scripts"
Cohesion: 0.29
Nodes (7): scripts, android, android:release, ios, start, test, typecheck

### Community 24 - "Hanap Medisina — UI Modernization Recommendations"
Cohesion: 0.05
Nodes (40): expo-blur, AnimatedTouchableOpacity, PlantCard(), GlassCard(), GlassCardProps, Typography(), 1. The one that actually matters: the mascot never stopped animating, 2. Contrast (+32 more)

### Community 25 - "useTheme"
Cohesion: 0.05
Nodes (80): GlassTabBar(), NavItem(), TabLayout(), tabs, LibraryLayout(), ProfileScreen(), ScanScreen(), clsx (+72 more)

### Community 26 - "illnessCatalog.ts"
Cohesion: 0.22
Nodes (13): findIllness(), getIllnessItems(), getIllnessLabel(), ILLNESSES, illnessPlantIds, plantMatchesIllness(), plantsForIllness(), catalogs (+5 more)

### Community 27 - "plantSearch.ts"
Cohesion: 0.27
Nodes (14): aliases, containsTerms(), fieldCache, getFields(), groupPlantSearchResults(), initializeSearchRecords(), matchesDocumentedUse(), normalize() (+6 more)

### Community 32 - "appContracts.test.cjs"
Cohesion: 0.05
Nodes (33): assert, catalogs, color(), contrast(), { createLoader }, dictionaries, fs, { getHomeFeed } (+25 more)

### Community 33 - "comparePicker.test.cjs"
Cohesion: 0.15
Nodes (8): { act }, assert, control(), { environment }, React, setup(), test, textContent()

### Community 34 - "Plant photograph credits"
Cohesion: 0.06
Nodes (32): aloe-vera.jpg, alugbati.jpg, banaba.jpg, bayabas.jpg, calamansi.jpg, dila-dila.jpg, gumamela.jpg, guyabano.jpg (+24 more)

### Community 35 - "useSettingsStore.ts"
Cohesion: 0.31
Nodes (6): @react-native-async-storage/async-storage, zustand, ProfileData, ProfileState, SettingsState, useSettingsStore

### Community 37 - "physical-checklist.tsx"
Cohesion: 0.24
Nodes (8): PhysicalChecklistRow(), PhysicalChecklistRowProps, PhysicalChecklistTable(), PhysicalChecklistTableProps, TRAIT_META, TRAIT_ORDER, TranslationKey, ComparisonTraits

### Community 38 - "mascotLayout.test.cjs"
Cohesion: 0.14
Nodes (13): { act }, assert, assetNames, assetSize(), { createLoader }, { environment }, fs, layout() (+5 more)

### Community 39 - "dataStores.test.cjs"
Cohesion: 0.11
Nodes (15): assert, catalog, { createLoader }, environment(), { randomUUID }, test, assert, { createLoader } (+7 more)

### Community 40 - "profilePhotoSuccess.test.cjs"
Cohesion: 0.22
Nodes (4): { act }, assert, { environment }, test

### Community 41 - "index.ts"
Cohesion: 0.09
Nodes (28): expo-crypto, react-native-gesture-handler, ERD for hanap-medisina-offline, Notes, DeleteAction(), Props, SWIPE_ANIMATION, AnimatedTouchable (+20 more)

### Community 42 - "plantLocalization.test.cjs"
Cohesion: 0.10
Nodes (18): assert, compare(), english, filename, fs, loaded, numbers(), path (+10 more)

### Community 43 - "filter-pills.tsx"
Cohesion: 0.13
Nodes (20): FilterPills(), FilterPillsProps, Pill(), PillProps, SKELETON_WIDTHS, SkeletonPill(), CRITICAL_WARNING_TERMS, DetailsTab() (+12 more)

### Community 44 - "libraryBootstrap.test.cjs"
Cohesion: 0.15
Nodes (12): assert, catalog, { createRequire }, fs, load(), memory, modules, path (+4 more)

### Community 45 - "useScanInference.ts"
Cohesion: 0.46
Nodes (6): expo-image-manipulator, react-native-worklets-core, useScanInference(), bestScanOutput(), decodeScanBase64(), makeScanInput()

### Community 46 - "appRecovery.test.cjs"
Cohesion: 0.08
Nodes (23): typescript, { act, create }, assert, boundary, fs, native, path, React (+15 more)

### Community 49 - "decodeScan"
Cohesion: 0.36
Nodes (13): decode(), decodeScan(), decodeACFirst(), decodeACSuccessive(), decodeBaseline(), decodeBlock(), decodeDCFirst(), decodeDCSuccessive() (+5 more)

### Community 52 - "useLibraryStore.ts"
Cohesion: 0.09
Nodes (19): PlantCardProps, PlantGridCardProps, CompareTabProps, PlantSearchGroup, enqueueFavorites(), favoriteTasks, legacyFavoriteIds, LibraryActions (+11 more)

### Community 54 - "libraryAlphabetical.test.cjs"
Cohesion: 0.20
Nodes (5): { act }, assert, { environment }, expected, test

### Community 56 - "useTFLite.ts"
Cohesion: 0.29
Nodes (7): expo-asset, expo-file-system, react-native-fast-tflite, loadResource(), ModelResource, ModelState, useTFLite()

### Community 57 - "Q: Check trained TFLite labels against the Library and fix symptom search"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Check trained TFLite labels against the Library and fix symptom search, Source Nodes

## Knowledge Gaps
- **467 isolated node(s):** `name`, `slug`, `version`, `orientation`, `icon` (+462 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 589 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `useTheme` to `appContracts.test.cjs`, `comparePicker.test.cjs`, `physical-checklist.tsx`, `package.json`, `mascotLayout.test.cjs`, `app/_layout.tsx`, `index.ts`, `useTranslation`, `filter-pills.tsx`, `useScanInference.ts`, `appRecovery.test.cjs`, `renderApp.cjs`, `uiWorkflows.test.cjs`, `MascotChatSlot.tsx`, `scanLifecycle.test.cjs`, `useTFLite.ts`?**
  _High betweenness centrality (0.334) - this node is a cross-community bridge._
- **Why does `useTheme()` connect `useTheme` to `physical-checklist.tsx`, `app/_layout.tsx`, `index.ts`, `useTranslation`, `filter-pills.tsx`, `MascotChatSlot.tsx`, `Hanap Medisina — UI Modernization Recommendations`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `useTheme()` (e.g. with `3. Design tokens` and `What I did not change`) actually correct?**
  _`useTheme()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `slug`, `version` to the rest of the system?**
  _467 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.041666666666666664 - nodes in this community are weakly interconnected._
- **Should `Multi-agent codebase audit` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._