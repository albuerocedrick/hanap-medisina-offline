# Graph Report - hanap-medisina-offline  (2026-09-30)

## Corpus Check
- 94 files · ~3,043,837 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: .tflite 3, (none) 1, .ttf 1)

## Summary
- 603 nodes · 1501 edges · 25 communities (20 shown, 5 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 40 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4fb3eb1f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- dependencies
- useTranslation
- react
- react-native
- nativewind
- package.json
- expo
- Hanap Medisina Offline
- scan.tsx
- localLibrary.ts
- Medicinal Plant Leaf Classification
- (tabs)/_layout.tsx
- Navigation & UI pass — what changed, and what I'd do next
- @expo/vector-icons
- AGENTS.md
- compilerOptions
- app/_layout.tsx
- metro.config.js
- devDependencies
- scripts
- MySavedPlants.tsx
- utils.ts

## God Nodes (most connected - your core abstractions)
1. `useTranslation()` - 65 edges
2. `react` - 57 edges
3. `react-native` - 56 edges
4. `nativewind` - 42 edges
5. `useTheme()` - 40 edges
6. `@expo/vector-icons` - 39 edges
7. `useLibraryStore` - 37 edges
8. `expo-router` - 27 edges
9. `react-native-reanimated` - 24 edges
10. `MedicinalPlant` - 16 edges

## Surprising Connections (you probably didn't know these)
- `Part 2 — The cramped "See all" cards` --references--> `SymptomGrid()`  [INFERRED]
  UI_NAVIGATION.md → src/components/home/SymptomGrid.tsx
- `What I did not change` --references--> `useTheme()`  [INFERRED]
  UI_CHANGES.md → src/theme/useTheme.ts
- `Recommendation` --references--> `useTheme()`  [INFERRED]
  UI_RECOMMENDATIONS.md → src/theme/useTheme.ts
- `Suggested order of work` --references--> `useTheme()`  [INFERRED]
  UI_RECOMMENDATIONS.md → src/theme/useTheme.ts
- `4. Elevation, radius, and spacing scales` --references--> `HomeHeader()`  [INFERRED]
  UI_RECOMMENDATIONS.md → src/components/home/HomeHeader.tsx

## Import Cycles
- None detected.

## Communities (25 total, 5 thin omitted)

### Community 0 - "dependencies"
Cohesion: 0.04
Nodes (53): dependencies, babel-preset-expo, buffer, clsx, expo, expo-asset, expo-blur, expo-build-properties (+45 more)

### Community 1 - "useTranslation"
Cohesion: 0.11
Nodes (26): ProfileScreen(), @react-native-async-storage/async-storage, EditProfileModal(), Props, ExportImportSection(), AnimatedTouchable, ProfileAvatar(), Props (+18 more)

### Community 2 - "react"
Cohesion: 0.10
Nodes (38): NotFoundScreen(), AnimatedPressable, QuickRemediesScreen(), RemedyCard(), ViewMode, ViewToggle(), AllSymptomsScreen(), AnimatedPressable (+30 more)

### Community 3 - "react-native"
Cohesion: 0.06
Nodes (41): HomeScreen(), react-native, @react-navigation/native, SPRITE, DailyTrivia(), SkeletonChip(), SkeletonTriviaCard(), usePulseStyle() (+33 more)

### Community 4 - "nativewind"
Cohesion: 0.09
Nodes (37): HistoryScreen(), expo-file-system, nativewind, react-native-safe-area-context, ERD for hanap-medisina-offline, Notes, AnimatedTouchable, HistoryCard() (+29 more)

### Community 5 - "package.json"
Cohesion: 0.06
Nodes (32): main, name, private, version, babel-preset-expo, cross-env, expo-build-properties, expo-constants (+24 more)

### Community 6 - "expo"
Cohesion: 0.07
Nodes (29): backgroundColor, foregroundImage, adaptiveIcon, edgeToEdgeEnabled, package, predictiveBackGestureEnabled, typedRoutes, expo (+21 more)

### Community 7 - "Hanap Medisina Offline"
Cohesion: 0.14
Nodes (13): Architecture, Building for Distribution, Export & Import, Getting Started, Hanap Medisina Offline, How to Add New Plants, How to Update the TFLite Model, License (+5 more)

### Community 8 - "scan.tsx"
Cohesion: 0.11
Nodes (21): CornerMark(), ErrorState(), { height: SCREEN_HEIGHT, width: SCREEN_WIDTH }, LoadingState(), PermissionGate(), RETICLE_H, RETICLE_W, ScanBottomSheet() (+13 more)

### Community 9 - "localLibrary.ts"
Cohesion: 0.05
Nodes (60): PLACEHOLDER_IMAGE, PlantComparisonScreen(), loadComparisonData(), LibraryFeed(), expo-linear-gradient, PhysicalChecklistRow(), PhysicalChecklistRowProps, PhysicalChecklistTable() (+52 more)

### Community 10 - "Medicinal Plant Leaf Classification"
Cohesion: 0.15
Nodes (12): Cell 1: Mount Google Drive, Cell 2: Set Up Data Pipeline, Cell 3: Build the MobileNetV3-Large Architecture, Cell 4: Train the AI, Cell 5: The Final Exam (Evaluating the Test Set), Cell 6: Export to TFLite and Save Labels, Cell 6b (Optional): Full-Integer Quantization for Maximum Accuracy Retention, Cell 7: The Retraining Phase (Fine-Tuning) (+4 more)

### Community 11 - "(tabs)/_layout.tsx"
Cohesion: 0.14
Nodes (14): AnimatedPressable, CustomTabBar(), TabItem(), TabLayout(), TABS, tokens, expo-blur, expo-haptics (+6 more)

### Community 12 - "Navigation & UI pass — what changed, and what I'd do next"
Cohesion: 0.17
Nodes (11): Navigation & UI pass — what changed, and what I'd do next, Part 1 — The back button problem, Part 2 — The cramped "See all" cards, Part 3 — The rest of the pass, Part 4 — What I'd replace or remake next, The actual root cause, The fix, Tier 1 — high impact, low risk (+3 more)

### Community 13 - "@expo/vector-icons"
Cohesion: 0.09
Nodes (31): PLACEHOLDER_IMAGE, PlantDetailsScreen(), loadPlantData(), PlantSummary, TabKey, @expo/vector-icons, CompareTab(), CompareTabProps (+23 more)

### Community 17 - "compilerOptions"
Cohesion: 0.22
Nodes (8): expo/tsconfig.base, compilerOptions, module, moduleResolution, paths, strict, extends, include

### Community 18 - "app/_layout.tsx"
Cohesion: 0.29
Nodes (4): expo-font, @expo-google-fonts/quicksand, expo-splash-screen, react-native-gesture-handler

### Community 21 - "metro.config.js"
Cohesion: 0.40
Nodes (4): config, { getDefaultConfig }, { withNativeWind }, expo

### Community 22 - "devDependencies"
Cohesion: 0.40
Nodes (5): devDependencies, cross-env, react-test-renderer, @types/react, typescript

### Community 23 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, android, android:release, ios, start

### Community 24 - "MySavedPlants.tsx"
Cohesion: 0.07
Nodes (34): HomeHeader(), MascotChatSlot(), AnimatedTouchableOpacity, MySavedPlants(), PlantCard(), GlassCard(), colorStyles, Typography() (+26 more)

## Knowledge Gaps
- **227 isolated node(s):** `name`, `slug`, `version`, `orientation`, `icon` (+222 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 270 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.144) - this node is a cross-community bridge._
- **Why does `react-native` connect `react-native` to `useTranslation`, `react`, `nativewind`, `package.json`, `scan.tsx`, `localLibrary.ts`, `(tabs)/_layout.tsx`, `@expo/vector-icons`, `MySavedPlants.tsx`?**
  _High betweenness centrality (0.117) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `useTranslation`, `react-native`, `nativewind`, `package.json`, `scan.tsx`, `localLibrary.ts`, `(tabs)/_layout.tsx`, `@expo/vector-icons`, `app/_layout.tsx`, `MySavedPlants.tsx`?**
  _High betweenness centrality (0.102) - this node is a cross-community bridge._
- **What connects `name`, `slug`, `version` to the rest of the system?**
  _227 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.03773584905660377 - nodes in this community are weakly interconnected._
- **Should `useTranslation` be split into smaller, more focused modules?**
  _Cohesion score 0.10796221322537113 - nodes in this community are weakly interconnected._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.09713487071977638 - nodes in this community are weakly interconnected._