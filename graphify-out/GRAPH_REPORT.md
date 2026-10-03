# Graph Report - hanap-medisina-offline  (2026-10-03)

## Corpus Check
- 98 files · ~3,044,626 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: .tflite 3, (none) 1, .ttf 1)

## Summary
- 616 nodes · 1585 edges · 27 communities (19 shown, 8 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 40 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4d94aec5`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- dependencies
- profile.tsx
- useTranslation.ts
- nativewind
- useTheme
- package.json
- expo
- Hanap Medisina Offline
- react-native
- withHighRefreshRate.js
- Medicinal Plant Leaf Classification
- react
- useTFLite.ts
- Navigation & UI pass — what changed, and what I'd do next
- AGENTS.md
- compilerOptions
- useTranslation
- metro.config.js
- devDependencies
- scripts
- MySavedPlants.tsx
- localLibrary.ts
- utils.ts

## God Nodes (most connected - your core abstractions)
1. `useTranslation()` - 77 edges
2. `react` - 60 edges
3. `react-native` - 59 edges
4. `useTheme()` - 54 edges
5. `nativewind` - 40 edges
6. `useLibraryStore` - 37 edges
7. `@expo/vector-icons` - 36 edges
8. `expo-router` - 25 edges
9. `react-native-reanimated` - 23 edges
10. `MedicinalPlant` - 16 edges

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

## Communities (27 total, 8 thin omitted)

### Community 0 - "dependencies"
Cohesion: 0.04
Nodes (53): dependencies, babel-preset-expo, buffer, clsx, expo, expo-asset, expo-blur, expo-build-properties (+45 more)

### Community 1 - "profile.tsx"
Cohesion: 0.11
Nodes (29): ProfileScreen(), expo-file-system, react-native-reanimated, ERD for hanap-medisina-offline, Notes, AnimatedTouchable, HomeHeader(), IconButton() (+21 more)

### Community 2 - "useTranslation.ts"
Cohesion: 0.08
Nodes (33): PLACEHOLDER_IMAGE, PlantDetailsScreen(), loadPlantData(), PlantSummary, TabKey, CompareTab(), LookAlikeCard(), LookAlikeSkeletonCard() (+25 more)

### Community 3 - "nativewind"
Cohesion: 0.08
Nodes (40): HomeScreen(), nativewind, @react-native-async-storage/async-storage, @react-navigation/native, zustand, DailyTrivia(), SkeletonChip(), SkeletonTriviaCard() (+32 more)

### Community 4 - "useTheme"
Cohesion: 0.10
Nodes (33): NotFoundScreen(), AnimatedPressable, QuickRemediesScreen(), RemedyCard(), ViewMode, ViewToggle(), AllSymptomsScreen(), AnimatedPressable (+25 more)

### Community 5 - "package.json"
Cohesion: 0.06
Nodes (32): main, name, private, version, babel-preset-expo, cross-env, expo-build-properties, expo-constants (+24 more)

### Community 6 - "expo"
Cohesion: 0.07
Nodes (29): backgroundColor, foregroundImage, adaptiveIcon, edgeToEdgeEnabled, package, predictiveBackGestureEnabled, typedRoutes, expo (+21 more)

### Community 7 - "Hanap Medisina Offline"
Cohesion: 0.14
Nodes (13): Architecture, Building for Distribution, Export & Import, Getting Started, Hanap Medisina Offline, How to Add New Plants, How to Update the TFLite Model, License (+5 more)

### Community 8 - "react-native"
Cohesion: 0.09
Nodes (17): GlassTabBar(), NavItem(), TabLayout(), tabs, expo-haptics, lucide-react-native, react-native, react-native-safe-area-context (+9 more)

### Community 10 - "Medicinal Plant Leaf Classification"
Cohesion: 0.15
Nodes (12): Cell 1: Mount Google Drive, Cell 2: Set Up Data Pipeline, Cell 3: Build the MobileNetV3-Large Architecture, Cell 4: Train the AI, Cell 5: The Final Exam (Evaluating the Test Set), Cell 6: Export to TFLite and Save Labels, Cell 6b (Optional): Full-Integer Quantization for Maximum Accuracy Retention, Cell 7: The Retraining Phase (Fine-Tuning) (+4 more)

### Community 11 - "react"
Cohesion: 0.10
Nodes (34): HistoryScreen(), expo-linear-gradient, @expo/vector-icons, react, AnimatedTouchable, DeleteAction(), HistoryCard, Props (+26 more)

### Community 13 - "Navigation & UI pass — what changed, and what I'd do next"
Cohesion: 0.18
Nodes (10): Navigation & UI pass — what changed, and what I'd do next, Part 1 — The back button problem, Part 2 — The cramped "See all" cards, Part 3 — The rest of the pass, Part 4 — What I'd replace or remake next, The actual root cause, Tier 1 — high impact, low risk, Tier 2 — meaningful UX wins (+2 more)

### Community 17 - "compilerOptions"
Cohesion: 0.22
Nodes (8): expo/tsconfig.base, compilerOptions, module, moduleResolution, paths, strict, extends, include

### Community 18 - "useTranslation"
Cohesion: 0.10
Nodes (28): RootLayout(), CornerMark(), ErrorState(), { height: SCREEN_HEIGHT, width: SCREEN_WIDTH }, LoadingState(), PermissionGate(), RETICLE_H, RETICLE_W (+20 more)

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
Cohesion: 0.06
Nodes (35): expo-blur, MascotChatSlot(), AnimatedTouchableOpacity, MySavedPlants(), PlantCard(), GlassCard(), GlassCardProps, colorStyles (+27 more)

### Community 25 - "localLibrary.ts"
Cohesion: 0.05
Nodes (58): PLACEHOLDER_IMAGE, PlantComparisonScreen(), loadComparisonData(), LibraryFeed(), PhysicalChecklistRow(), PhysicalChecklistRowProps, PhysicalChecklistTable(), PhysicalChecklistTableProps (+50 more)

## Knowledge Gaps
- **226 isolated node(s):** `name`, `slug`, `version`, `orientation`, `icon` (+221 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 273 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.140) - this node is a cross-community bridge._
- **Why does `react-native` connect `react-native` to `profile.tsx`, `useTranslation.ts`, `nativewind`, `useTheme`, `package.json`, `react`, `useTranslation`, `MySavedPlants.tsx`, `localLibrary.ts`?**
  _High betweenness centrality (0.111) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `profile.tsx`, `useTranslation.ts`, `nativewind`, `useTheme`, `package.json`, `react-native`, `useTFLite.ts`, `useTranslation`, `MySavedPlants.tsx`, `localLibrary.ts`?**
  _High betweenness centrality (0.095) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `useTheme()` (e.g. with `3. Design tokens` and `What I did not change`) actually correct?**
  _`useTheme()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `slug`, `version` to the rest of the system?**
  _226 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.03773584905660377 - nodes in this community are weakly interconnected._
- **Should `profile.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11095305832147938 - nodes in this community are weakly interconnected._