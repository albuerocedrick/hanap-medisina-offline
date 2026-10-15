# Graph Report - hanap-medisina-offline  (2026-10-15)

## Corpus Check
- 138 files · ~1,021,887 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: .tflite 4, (none) 1, .ttf 1)

## Summary
- 1036 nodes · 2448 edges · 60 communities (52 shown, 8 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 79 edges (avg confidence: 0.91)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `756593e7`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- dependencies
- scanInference.test.cjs
- Multi-agent codebase audit
- localLibrary.ts
- [id].tsx
- package.json
- expo
- Hanap Medisina Offline
- (tabs)/_layout.tsx
- ref_node_assert
- Medicinal Plant Leaf Classification
- useTheme.ts
- useTFLite.ts
- uiWorkflows.test.cjs
- AGENTS.md
- android-smoke.cjs
- react-native
- compilerOptions
- useTranslation
- (tabs)/index.tsx
- scanLifecycle.test.cjs
- metro.config.js
- devDependencies
- scripts
- Hanap Medisina — UI Modernization Recommendations
- @expo/vector-icons
- cn
- react
- appContracts.test.cjs
- export-import-section.tsx
- Plant photograph credits
- appRecovery.test.cjs
- scanFailurePaths.test.cjs
- symptoms.tsx
- dataWorkflows.test.cjs
- Audit finding resolutions
- details-tab.tsx
- plantLocalization.test.cjs
- decodeScan
- libraryBootstrap.test.cjs
- decodeScanJpeg
- renderApp.cjs
- dataStores.test.cjs
- Navigation & UI pass — what changed, and what I'd do next
- useScanInference.ts
- research-tab.tsx
- useLibraryStore.ts
- useTheme
- QuickRemedies.tsx
- Q: Check trained TFLite labels against the Library and fix symptom search
- Typography.tsx
- GlassCard.tsx
- profile-stats.tsx

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 151 edges
2. `useTranslation()` - 103 edges
3. `react` - 69 edges
4. `react-native` - 65 edges
5. `@expo/vector-icons` - 39 edges
6. `useLibraryStore` - 38 edges
7. `Plant photograph credits` - 31 edges
8. `expo-router` - 25 edges
9. `react-native-reanimated` - 23 edges
10. `MedicinalPlant` - 19 edges

## Surprising Connections (you probably didn't know these)
- `4. Elevation, radius, and spacing scales` --references--> `HomeHeader()`  [INFERRED]
  UI_RECOMMENDATIONS.md → src/components/home/HomeHeader.tsx
- `Part 2 — The cramped "See all" cards` --references--> `SymptomGrid()`  [INFERRED]
  UI_NAVIGATION.md → src/components/home/SymptomGrid.tsx
- `What I did not change` --references--> `useTheme()`  [INFERRED]
  UI_CHANGES.md → src/theme/useTheme.ts
- `Recommendation` --references--> `useTheme()`  [INFERRED]
  UI_RECOMMENDATIONS.md → src/theme/useTheme.ts
- `Suggested order of work` --references--> `useTheme()`  [INFERRED]
  UI_RECOMMENDATIONS.md → src/theme/useTheme.ts

## Import Cycles
- None detected.

## Communities (60 total, 8 thin omitted)

### Community 0 - "dependencies"
Cohesion: 0.04
Nodes (48): dependencies, babel-preset-expo, buffer, clsx, expo, expo-asset, expo-blur, expo-build-properties (+40 more)

### Community 1 - "scanInference.test.cjs"
Cohesion: 0.11
Nodes (10): jpeg-js, assert, babel, { decodeScanJpeg }, fs, jpeg, { makeScanInput, decodeScanBase64, bestScanOutput }, path (+2 more)

### Community 2 - "Multi-agent codebase audit"
Cohesion: 0.10
Nodes (19): 1. Map the repo (commands), 2. Partition heuristics, 3. Per-slice auditor subagent, 4. Cross-cutting / architecture critic, 5. Completeness critic, 6. Coverage ledger (goes in the final report), Partitioning, prompts & the coverage ledger, 1. Map the repo (+11 more)

### Community 3 - "localLibrary.ts"
Cohesion: 0.07
Nodes (47): HomeSearchBar(), getHomeFeed(), mulberry32(), getActivePlants(), getAllCategories(), getAllPreparationGroups(), getAllSymptoms(), getPlantsByCategory() (+39 more)

### Community 4 - "[id].tsx"
Cohesion: 0.13
Nodes (17): PLACEHOLDER_IMAGE, PlantSummary, TabKey, PlantCardProps, AnimatedTouchable, PLACEHOLDER_IMAGE, PlantGridCardComponent(), PlantGridCardProps (+9 more)

### Community 5 - "package.json"
Cohesion: 0.08
Nodes (24): main, name, private, version, babel-preset-expo, buffer, cross-env, expo-build-properties (+16 more)

### Community 6 - "expo"
Cohesion: 0.07
Nodes (29): backgroundColor, foregroundImage, adaptiveIcon, edgeToEdgeEnabled, package, predictiveBackGestureEnabled, typedRoutes, expo (+21 more)

### Community 7 - "Hanap Medisina Offline"
Cohesion: 0.12
Nodes (15): Architecture, Building for Distribution, Export & Import, Getting Started, Hanap Medisina Offline, How to Add New Plants, How to Update the TFLite Model, License (+7 more)

### Community 8 - "(tabs)/_layout.tsx"
Cohesion: 0.09
Nodes (22): AppContent(), ErrorBoundary(), RootLayout(), GlassTabBar(), NavItem(), TabLayout(), tabs, expo-font (+14 more)

### Community 9 - "ref_node_assert"
Cohesion: 0.18
Nodes (7): addHighRefreshRate(), { mergeContents }, withHighRefreshRate(), { withMainActivity }, { addHighRefreshRate }, assert, test

### Community 10 - "Medicinal Plant Leaf Classification"
Cohesion: 0.15
Nodes (12): Cell 1: Mount Google Drive, Cell 2: Set Up Data Pipeline, Cell 3: Build the MobileNetV3-Large Architecture, Cell 4: Train the AI, Cell 5: The Final Exam (Evaluating the Test Set), Cell 6: Export to TFLite and Save Labels, Cell 6b (Optional): Full-Integer Quantization for Maximum Accuracy Retention, Cell 7: The Retraining Phase (Fine-Tuning) (+4 more)

### Community 11 - "useTheme.ts"
Cohesion: 0.15
Nodes (18): expo-haptics, nativewind, AnimatedTouchable, HomeHeader(), IconButton(), PLACEHOLDER_IMAGE, IconButton(), IconButtonProps (+10 more)

### Community 12 - "useTFLite.ts"
Cohesion: 0.29
Nodes (7): expo-asset, expo-file-system, react-native-fast-tflite, loadResource(), ModelResource, ModelState, useTFLite()

### Community 13 - "uiWorkflows.test.cjs"
Cohesion: 0.06
Nodes (32): Automated evidence and limits, Backup export/import and data integrity — 15 cases, Camera and scan — 17 cases, Completion checklist, Environment matrix, HanapMedisina functional test cases, History — 10 cases, Home, search, symptoms and preparations — 9 cases (+24 more)

### Community 15 - "android-smoke.cjs"
Cohesion: 0.13
Nodes (30): BlockedError, command(), crashLines(), crypto, decodeXml(), delay(), { execFileSync }, executableOnPath() (+22 more)

### Community 16 - "react-native"
Cohesion: 0.07
Nodes (32): ScanScreen(), 🗺 Coverage Ledger, Executive Summary, Hanap Medisina Offline — Codebase Re-Audit Report & Resolution Ledger, Historical Findings Verification Status, Partition Map & Coverage Ledger, Second-Pass Findings (NEW-01 through NEW-06) — Post-Fix Re-Audit, Tabular Implementation Plan (Final Status) (+24 more)

### Community 17 - "compilerOptions"
Cohesion: 0.22
Nodes (8): expo/tsconfig.base, compilerOptions, module, moduleResolution, paths, strict, extends, include

### Community 18 - "useTranslation"
Cohesion: 0.20
Nodes (16): ProfileScreen(), lucide-react-native, EditProfileModal(), PhotoCreditsSheet(), AppSheet(), Context, Request, SheetFrame() (+8 more)

### Community 19 - "(tabs)/index.tsx"
Cohesion: 0.08
Nodes (39): HomeScreen(), ERD for hanap-medisina-offline, Notes, Props, Props, ANIM_CONFIG, Props, ScanDetailSheet() (+31 more)

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
Cohesion: 0.17
Nodes (11): 1. The core problem: there is no single source of truth for colour, 2. Contrast: three muted-text values currently fall below AA, 3. Cards read as flat outlines (light mode), 4. Elevation, radius, and spacing scales, 6. Touch targets and accessibility, 8. Housekeeping, 9. Verified on device: the app never becomes idle, Duplicates worth collapsing (+3 more)

### Community 25 - "@expo/vector-icons"
Cohesion: 0.18
Nodes (16): HistoryScreen(), @expo/vector-icons, react-native-gesture-handler, react-native-reanimated, AnimatedTouchable, DeleteAction(), HistoryCard, HistoryEmptyState() (+8 more)

### Community 26 - "cn"
Cohesion: 0.29
Nodes (7): clsx, tailwind-merge, Button(), ButtonProps, ScreenWrapper(), ScreenWrapperProps, cn()

### Community 27 - "react"
Cohesion: 0.19
Nodes (13): NotFoundScreen(), AnimatedPressable, QuickRemediesScreen(), RemedyCard(), ViewMode, ViewToggle(), expo-router, react (+5 more)

### Community 32 - "appContracts.test.cjs"
Cohesion: 0.09
Nodes (20): assert, catalogs, color(), contrast(), { createLoader }, dictionaries, fs, { getHomeFeed } (+12 more)

### Community 33 - "export-import-section.tsx"
Cohesion: 0.33
Nodes (9): ExportImportSection(), AnimatedTouchable, ProfileMenuItem(), Props, applyImport(), ensureDir(), exportData(), importData() (+1 more)

### Community 34 - "Plant photograph credits"
Cohesion: 0.06
Nodes (31): aloe-vera.jpg, alugbati.jpg, banaba.jpg, bayabas.jpg, calamansi.jpg, dila-dila.jpg, gumamela.jpg, guyabano.jpg (+23 more)

### Community 35 - "appRecovery.test.cjs"
Cohesion: 0.15
Nodes (10): react-test-renderer, { act, create }, assert, boundary, fs, native, path, React (+2 more)

### Community 37 - "scanFailurePaths.test.cjs"
Cohesion: 0.11
Nodes (13): { act, create }, assert, fs, inferenceHarness(), load(), path, React, scanner() (+5 more)

### Community 38 - "symptoms.tsx"
Cohesion: 0.22
Nodes (15): AllSymptomsScreen(), AnimatedPressable, SymptomCard(), ViewMode, ViewToggle(), DailyTrivia(), SkeletonChip(), SkeletonTriviaCard() (+7 more)

### Community 39 - "dataWorkflows.test.cjs"
Cohesion: 0.18
Nodes (9): assert, { createLoader }, environment(), ready(), importedScan(), { randomUUID }, scan(), test (+1 more)

### Community 40 - "Audit finding resolutions"
Cohesion: 0.29
Nodes (6): Audit finding resolutions, Critical findings, Cross-cutting and performance findings, Informational findings, Validation, Warning findings

### Community 41 - "details-tab.tsx"
Cohesion: 0.23
Nodes (11): CRITICAL_WARNING_TERMS, DetailsTab(), DetailsTabProps, EmptySection(), getWarningSeverity(), SectionHeader(), WarningSeverity, categoryLabels (+3 more)

### Community 42 - "plantLocalization.test.cjs"
Cohesion: 0.18
Nodes (12): assert, compare(), english, filename, fs, loaded, numbers(), path (+4 more)

### Community 43 - "decodeScan"
Cohesion: 0.36
Nodes (13): decode(), decodeScan(), decodeACFirst(), decodeACSuccessive(), decodeBaseline(), decodeBlock(), decodeDCFirst(), decodeDCSuccessive() (+5 more)

### Community 44 - "libraryBootstrap.test.cjs"
Cohesion: 0.15
Nodes (12): assert, catalog, { createRequire }, fs, load(), memory, modules, path (+4 more)

### Community 45 - "decodeScanJpeg"
Cohesion: 0.24
Nodes (6): decodeScanJpeg(), buildComponentData(), prepareComponents(), readDataBlock(), readUint16(), requestMemoryAllocation()

### Community 46 - "renderApp.cjs"
Cohesion: 0.09
Nodes (21): typescript, { createRequire }, fs, path, ts, { act, create }, { createRequire }, fs (+13 more)

### Community 47 - "dataStores.test.cjs"
Cohesion: 0.10
Nodes (13): assert, catalog, { createLoader }, environment(), { randomUUID }, test, createLoader(), assert (+5 more)

### Community 49 - "Navigation & UI pass — what changed, and what I'd do next"
Cohesion: 0.18
Nodes (10): Navigation & UI pass — what changed, and what I'd do next, Part 1 — The back button problem, Part 2 — The cramped "See all" cards, Part 3 — The rest of the pass, Part 4 — What I'd replace or remake next, The actual root cause, Tier 1 — high impact, low risk, Tier 2 — meaningful UX wins (+2 more)

### Community 50 - "useScanInference.ts"
Cohesion: 0.46
Nodes (6): expo-image-manipulator, react-native-worklets-core, useScanInference(), bestScanOutput(), decodeScanBase64(), makeScanInput()

### Community 51 - "research-tab.tsx"
Cohesion: 0.43
Nodes (5): ResearchCard(), ResearchCardProps, ResearchTab(), ResearchTabProps, ResearchEntry

### Community 52 - "useLibraryStore.ts"
Cohesion: 0.06
Nodes (50): PLACEHOLDER_IMAGE, PlantComparisonScreen(), loadComparisonData(), PlantDetailsScreen(), loadPlantData(), LibraryFeed(), PhysicalChecklistRow(), PhysicalChecklistRowProps (+42 more)

### Community 53 - "useTheme"
Cohesion: 0.26
Nodes (11): LibraryLayout(), CultivationTab(), CultivationTabProps, EmptySection(), SectionHeader(), SectionItem(), AnimatedTouchable, ProfileAvatar() (+3 more)

### Community 54 - "QuickRemedies.tsx"
Cohesion: 0.67
Nodes (5): AnimatedPressable, QuickRemedies(), RemedyCard(), useRemedyCardMetrics(), selectPreparationGroups()

### Community 57 - "Q: Check trained TFLite labels against the Library and fix symptom search"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Check trained TFLite labels against the Library and fix symptom search, Source Nodes

### Community 64 - "Typography.tsx"
Cohesion: 0.33
Nodes (5): Typography(), TypographyProps, variantStyles, 2. Contrast, 5. Typography

### Community 66 - "GlassCard.tsx"
Cohesion: 0.33
Nodes (5): expo-blur, GlassCard(), GlassCardProps, 6. Housekeeping, 7. Screen-level notes

### Community 69 - "profile-stats.tsx"
Cohesion: 0.50
Nodes (4): ProfileStats(), Props, StatPill(), StatPillProps

## Knowledge Gaps
- **408 isolated node(s):** `name`, `slug`, `version`, `orientation`, `icon` (+403 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 506 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `localLibrary.ts`, `[id].tsx`, `package.json`, `(tabs)/_layout.tsx`, `useTheme.ts`, `useTFLite.ts`, `uiWorkflows.test.cjs`, `react-native`, `useTranslation`, `(tabs)/index.tsx`, `scanLifecycle.test.cjs`, `@expo/vector-icons`, `cn`, `export-import-section.tsx`, `appRecovery.test.cjs`, `scanFailurePaths.test.cjs`, `symptoms.tsx`, `details-tab.tsx`, `renderApp.cjs`, `useScanInference.ts`, `research-tab.tsx`, `useLibraryStore.ts`, `useTheme`, `QuickRemedies.tsx`, `Typography.tsx`, `profile-stats.tsx`?**
  _High betweenness centrality (0.279) - this node is a cross-community bridge._
- **Why does `useTheme()` connect `useTheme` to `localLibrary.ts`, `[id].tsx`, `(tabs)/_layout.tsx`, `useTheme.ts`, `react-native`, `useTranslation`, `(tabs)/index.tsx`, `Hanap Medisina — UI Modernization Recommendations`, `@expo/vector-icons`, `cn`, `react`, `export-import-section.tsx`, `symptoms.tsx`, `details-tab.tsx`, `Navigation & UI pass — what changed, and what I'd do next`, `research-tab.tsx`, `useLibraryStore.ts`, `QuickRemedies.tsx`, `Typography.tsx`, `GlassCard.tsx`, `profile-stats.tsx`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.083) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `useTheme()` (e.g. with `3. Design tokens` and `What I did not change`) actually correct?**
  _`useTheme()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `slug`, `version` to the rest of the system?**
  _408 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.041666666666666664 - nodes in this community are weakly interconnected._
- **Should `scanInference.test.cjs` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._