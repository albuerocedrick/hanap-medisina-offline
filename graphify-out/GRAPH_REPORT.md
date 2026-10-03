# Graph Report - hanap-medisina-offline  (2026-10-03)

## Corpus Check
- 97 files · ~3,044,438 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: .tflite 3, (none) 1, .ttf 1)

## Summary
- 611 nodes · 1569 edges · 29 communities (23 shown, 6 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 40 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4f8e167e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- dependencies
- dataTransfer.ts
- [id].tsx
- useLibraryStore
- react
- package.json
- expo
- Hanap Medisina Offline
- scan.tsx
- Hanap Medisina — UI Modernization Recommendations
- Medicinal Plant Leaf Classification
- expo-router
- expo-file-system
- Navigation & UI pass — what changed, and what I'd do next
- AGENTS.md
- filter-pills.tsx
- compilerOptions
- useTranslation.ts
- metro.config.js
- devDependencies
- scripts
- useTranslation
- localLibrary.ts
- utils.ts
- Onboarding.tsx

## God Nodes (most connected - your core abstractions)
1. `useTranslation()` - 73 edges
2. `react` - 60 edges
3. `react-native` - 59 edges
4. `useTheme()` - 52 edges
5. `nativewind` - 41 edges
6. `useLibraryStore` - 37 edges
7. `@expo/vector-icons` - 36 edges
8. `expo-router` - 25 edges
9. `react-native-reanimated` - 24 edges
10. `MedicinalPlant` - 16 edges

## Surprising Connections (you probably didn't know these)
- `4. Elevation, radius, and spacing scales` --references--> `HomeHeader()`  [INFERRED]
  UI_RECOMMENDATIONS.md → src/components/home/HomeHeader.tsx
- `Part 2 — The cramped "See all" cards` --references--> `SymptomGrid()`  [INFERRED]
  UI_NAVIGATION.md → src/components/home/SymptomGrid.tsx
- `5. Typography` --references--> `Typography()`  [INFERRED]
  UI_RECOMMENDATIONS.md → src/components/ui/Typography.tsx
- `What I did not change` --references--> `useTheme()`  [INFERRED]
  UI_CHANGES.md → src/theme/useTheme.ts
- `Recommendation` --references--> `useTheme()`  [INFERRED]
  UI_RECOMMENDATIONS.md → src/theme/useTheme.ts

## Import Cycles
- None detected.

## Communities (29 total, 6 thin omitted)

### Community 0 - "dependencies"
Cohesion: 0.04
Nodes (53): dependencies, babel-preset-expo, buffer, clsx, expo, expo-asset, expo-blur, expo-build-properties (+45 more)

### Community 1 - "dataTransfer.ts"
Cohesion: 0.16
Nodes (17): expo-document-picker, expo-sharing, ERD for hanap-medisina-offline, Notes, ExportImportSection(), AnimatedTouchable, ProfileMenuItem(), Props (+9 more)

### Community 2 - "[id].tsx"
Cohesion: 0.09
Nodes (29): PLACEHOLDER_IMAGE, PlantDetailsScreen(), loadPlantData(), PlantSummary, TabKey, CompareTab(), LookAlikeCard(), LookAlikeSkeletonCard() (+21 more)

### Community 3 - "useLibraryStore"
Cohesion: 0.11
Nodes (34): AnimatedPressable, QuickRemediesScreen(), RemedyCard(), ViewMode, ViewToggle(), AllSymptomsScreen(), AnimatedPressable, SymptomCard() (+26 more)

### Community 4 - "react"
Cohesion: 0.07
Nodes (37): NotFoundScreen(), LibraryLayout(), expo-haptics, react, react-native, SPRITE, AnimatedTouchable, IconButton() (+29 more)

### Community 5 - "package.json"
Cohesion: 0.06
Nodes (30): main, name, private, version, babel-preset-expo, cross-env, expo-build-properties, expo-constants (+22 more)

### Community 6 - "expo"
Cohesion: 0.07
Nodes (29): backgroundColor, foregroundImage, adaptiveIcon, edgeToEdgeEnabled, package, predictiveBackGestureEnabled, typedRoutes, expo (+21 more)

### Community 7 - "Hanap Medisina Offline"
Cohesion: 0.14
Nodes (13): Architecture, Building for Distribution, Export & Import, Getting Started, Hanap Medisina Offline, How to Add New Plants, How to Update the TFLite Model, License (+5 more)

### Community 8 - "scan.tsx"
Cohesion: 0.14
Nodes (18): CornerMark(), ErrorState(), { height: SCREEN_HEIGHT, width: SCREEN_WIDTH }, LoadingState(), PermissionGate(), RETICLE_H, RETICLE_W, ScanBottomSheet() (+10 more)

### Community 9 - "Hanap Medisina — UI Modernization Recommendations"
Cohesion: 0.15
Nodes (12): 1. The core problem: there is no single source of truth for colour, 2. Contrast: three muted-text values currently fall below AA, 3. Cards read as flat outlines (light mode), 4. Elevation, radius, and spacing scales, 5. Typography, 6. Touch targets and accessibility, 8. Housekeeping, 9. Verified on device: the app never becomes idle (+4 more)

### Community 10 - "Medicinal Plant Leaf Classification"
Cohesion: 0.15
Nodes (12): Cell 1: Mount Google Drive, Cell 2: Set Up Data Pipeline, Cell 3: Build the MobileNetV3-Large Architecture, Cell 4: Train the AI, Cell 5: The Final Exam (Evaluating the Test Set), Cell 6: Export to TFLite and Save Labels, Cell 6b (Optional): Full-Integer Quantization for Maximum Accuracy Retention, Cell 7: The Retraining Phase (Fine-Tuning) (+4 more)

### Community 11 - "expo-router"
Cohesion: 0.12
Nodes (27): HistoryScreen(), LibraryFeed(), expo-router, AnimatedTouchable, HistoryCard(), Props, HistoryEmptyState(), AnimatedTouchable (+19 more)

### Community 12 - "expo-file-system"
Cohesion: 0.33
Nodes (4): expo-asset, expo-file-system, react-native-fast-tflite, useTFLite()

### Community 13 - "Navigation & UI pass — what changed, and what I'd do next"
Cohesion: 0.20
Nodes (9): Navigation & UI pass — what changed, and what I'd do next, Part 1 — The back button problem, Part 2 — The cramped "See all" cards, Part 3 — The rest of the pass, Part 4 — What I'd replace or remake next, The actual root cause, Tier 2 — meaningful UX wins, Tier 3 — polish and platform correctness (+1 more)

### Community 16 - "filter-pills.tsx"
Cohesion: 0.33
Nodes (8): FilterPills(), FilterPillsProps, Pill(), PillProps, SKELETON_WIDTHS, SkeletonPill(), selectActiveCategory(), selectCategories()

### Community 17 - "compilerOptions"
Cohesion: 0.22
Nodes (8): expo/tsconfig.base, compilerOptions, module, moduleResolution, paths, strict, extends, include

### Community 18 - "useTranslation.ts"
Cohesion: 0.09
Nodes (29): GlassTabBar(), NavItem(), TabLayout(), tabs, ProfileScreen(), expo-linear-gradient, lucide-react-native, @react-native-async-storage/async-storage (+21 more)

### Community 21 - "metro.config.js"
Cohesion: 0.40
Nodes (4): config, { getDefaultConfig }, { withNativeWind }, expo

### Community 22 - "devDependencies"
Cohesion: 0.40
Nodes (5): devDependencies, cross-env, react-test-renderer, @types/react, typescript

### Community 23 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, android, android:release, ios, start

### Community 24 - "useTranslation"
Cohesion: 0.07
Nodes (43): HomeScreen(), expo-blur, @expo/vector-icons, nativewind, @react-navigation/native, AnimatedTouchable, HistoryHeader(), HistoryHeaderProps (+35 more)

### Community 25 - "localLibrary.ts"
Cohesion: 0.05
Nodes (47): PLACEHOLDER_IMAGE, PlantComparisonScreen(), loadComparisonData(), PhysicalChecklistRow(), PhysicalChecklistRowProps, PhysicalChecklistTable(), PhysicalChecklistTableProps, TRAIT_META (+39 more)

### Community 27 - "Onboarding.tsx"
Cohesion: 0.31
Nodes (7): RootLayout(), expo-font, @expo-google-fonts/quicksand, expo-splash-screen, react-native-gesture-handler, Onboarding(), useOnboardingStore

## Knowledge Gaps
- **225 isolated node(s):** `name`, `slug`, `version`, `orientation`, `icon` (+220 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 270 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.143) - this node is a cross-community bridge._
- **Why does `react-native` connect `react` to `dataTransfer.ts`, `[id].tsx`, `useLibraryStore`, `package.json`, `scan.tsx`, `expo-router`, `filter-pills.tsx`, `useTranslation.ts`, `useTranslation`, `localLibrary.ts`, `Onboarding.tsx`?**
  _High betweenness centrality (0.115) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `dataTransfer.ts`, `[id].tsx`, `useLibraryStore`, `package.json`, `scan.tsx`, `expo-router`, `expo-file-system`, `filter-pills.tsx`, `useTranslation.ts`, `useTranslation`, `localLibrary.ts`, `Onboarding.tsx`?**
  _High betweenness centrality (0.098) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `useTheme()` (e.g. with `3. Design tokens` and `What I did not change`) actually correct?**
  _`useTheme()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `slug`, `version` to the rest of the system?**
  _225 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.03773584905660377 - nodes in this community are weakly interconnected._
- **Should `[id].tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09009009009009009 - nodes in this community are weakly interconnected._