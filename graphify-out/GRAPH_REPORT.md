# Graph Report - hanap-medisina-offline  (2026-10-04)

## Corpus Check
- 105 files · ~2,932,274 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: .tflite 3, (none) 1, .ttf 1)

## Summary
- 675 nodes · 1688 edges · 34 communities (26 shown, 8 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 41 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `68f40adc`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- dependencies
- index.ts
- details-tab.tsx
- (tabs)/index.tsx
- react
- package.json
- expo
- Hanap Medisina Offline
- Onboarding.tsx
- withHighRefreshRate.js
- Medicinal Plant Leaf Classification
- useTheme.ts
- expo-file-system
- release-builds/README.md
- AGENTS.md
- plantSearch.ts
- scan.tsx
- compilerOptions
- useTranslation
- localLibrary.ts
- Navigation & UI pass — what changed, and what I'd do next
- metro.config.js
- devDependencies
- scripts
- MySavedPlants.tsx
- utils.ts
- Plant photograph credits
- cultivation-tab.tsx
- research-tab.tsx
- MascotChatSlot.tsx

## God Nodes (most connected - your core abstractions)
1. `useTranslation()` - 79 edges
2. `react` - 61 edges
3. `react-native` - 60 edges
4. `useTheme()` - 58 edges
5. `nativewind` - 39 edges
6. `@expo/vector-icons` - 36 edges
7. `useLibraryStore` - 35 edges
8. `expo-router` - 25 edges
9. `react-native-reanimated` - 23 edges
10. `MedicinalPlant` - 18 edges

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

## Communities (34 total, 8 thin omitted)

### Community 0 - "dependencies"
Cohesion: 0.04
Nodes (53): dependencies, babel-preset-expo, buffer, clsx, expo, expo-asset, expo-blur, expo-build-properties (+45 more)

### Community 1 - "index.ts"
Cohesion: 0.10
Nodes (28): expo-document-picker, expo-sharing, ERD for hanap-medisina-offline, Notes, Props, RecentScans, RecentScansHandle, RecentScansProps (+20 more)

### Community 2 - "details-tab.tsx"
Cohesion: 0.33
Nodes (8): CRITICAL_WARNING_TERMS, DetailsTab(), DetailsTabProps, EmptySection(), getWarningSeverity(), SectionHeader(), WarningSeverity, PlantDetails

### Community 3 - "(tabs)/index.tsx"
Cohesion: 0.10
Nodes (33): AnimatedPressable, QuickRemediesScreen(), RemedyCard(), ViewMode, ViewToggle(), HomeScreen(), DailyTrivia(), SkeletonChip() (+25 more)

### Community 4 - "react"
Cohesion: 0.05
Nodes (59): NotFoundScreen(), ViewMode, HistoryScreen(), PLACEHOLDER_IMAGE, PLACEHOLDER_IMAGE, PlantSummary, TabKey, expo-router (+51 more)

### Community 5 - "package.json"
Cohesion: 0.07
Nodes (29): main, name, private, version, babel-preset-expo, cross-env, expo-build-properties, expo-constants (+21 more)

### Community 6 - "expo"
Cohesion: 0.07
Nodes (29): backgroundColor, foregroundImage, adaptiveIcon, edgeToEdgeEnabled, package, predictiveBackGestureEnabled, typedRoutes, expo (+21 more)

### Community 7 - "Hanap Medisina Offline"
Cohesion: 0.14
Nodes (13): Architecture, Building for Distribution, Export & Import, Getting Started, Hanap Medisina Offline, How to Add New Plants, How to Update the TFLite Model, License (+5 more)

### Community 8 - "Onboarding.tsx"
Cohesion: 0.31
Nodes (7): RootLayout(), expo-font, @expo-google-fonts/quicksand, expo-splash-screen, react-native-gesture-handler, Onboarding(), useOnboardingStore

### Community 10 - "Medicinal Plant Leaf Classification"
Cohesion: 0.15
Nodes (12): Cell 1: Mount Google Drive, Cell 2: Set Up Data Pipeline, Cell 3: Build the MobileNetV3-Large Architecture, Cell 4: Train the AI, Cell 5: The Final Exam (Evaluating the Test Set), Cell 6: Export to TFLite and Save Labels, Cell 6b (Optional): Full-Integer Quantization for Maximum Accuracy Retention, Cell 7: The Retraining Phase (Fine-Tuning) (+4 more)

### Community 11 - "useTheme.ts"
Cohesion: 0.16
Nodes (17): react-native-reanimated, AnimatedTouchable, IconButton(), AnimatedTouchable, CategoryChip, PLACEHOLDER_IMAGE, PlantCardComponent(), IconButton() (+9 more)

### Community 12 - "expo-file-system"
Cohesion: 0.33
Nodes (4): expo-asset, expo-file-system, react-native-fast-tflite, useTFLite()

### Community 15 - "plantSearch.ts"
Cohesion: 0.06
Nodes (37): typescript, HomeSearchBar(), aliases, containsTerms(), fieldCache, getFields(), groupPlantSearchResults(), matchesDocumentedUse() (+29 more)

### Community 16 - "scan.tsx"
Cohesion: 0.14
Nodes (18): CornerMark(), ErrorState(), { height: SCREEN_HEIGHT, width: SCREEN_WIDTH }, LoadingState(), PermissionGate(), RETICLE_H, RETICLE_W, ScanBottomSheet() (+10 more)

### Community 17 - "compilerOptions"
Cohesion: 0.22
Nodes (8): expo/tsconfig.base, compilerOptions, module, moduleResolution, paths, strict, extends, include

### Community 18 - "useTranslation"
Cohesion: 0.08
Nodes (41): AllSymptomsScreen(), AnimatedPressable, SymptomCard(), ViewToggle(), GlassTabBar(), NavItem(), TabLayout(), tabs (+33 more)

### Community 19 - "localLibrary.ts"
Cohesion: 0.07
Nodes (46): PlantComparisonScreen(), loadComparisonData(), PlantDetailsScreen(), loadPlantData(), LibraryFeed(), ScanDetailSheet(), loadScanData(), FilterPills() (+38 more)

### Community 20 - "Navigation & UI pass — what changed, and what I'd do next"
Cohesion: 0.18
Nodes (10): Navigation & UI pass — what changed, and what I'd do next, Part 1 — The back button problem, Part 2 — The cramped "See all" cards, Part 3 — The rest of the pass, Part 4 — What I'd replace or remake next, The actual root cause, Tier 1 — high impact, low risk, Tier 2 — meaningful UX wins (+2 more)

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
Nodes (36): expo-blur, HomeHeader(), MascotChatSlot(), AnimatedTouchableOpacity, MySavedPlants(), PlantCard(), GlassCard(), GlassCardProps (+28 more)

### Community 34 - "Plant photograph credits"
Cohesion: 0.25
Nodes (7): bayabas.jpg, kamaria.jpg, lagundi.jpg, madre-cacao.jpg, Plant photograph credits, sambong.jpg, serpentina.jpg

### Community 35 - "cultivation-tab.tsx"
Cohesion: 0.48
Nodes (6): CultivationTab(), CultivationTabProps, EmptySection(), SectionHeader(), SectionItem(), CultivationGuide

### Community 36 - "research-tab.tsx"
Cohesion: 0.43
Nodes (5): ResearchCard(), ResearchCardProps, ResearchTab(), ResearchTabProps, ResearchEntry

### Community 37 - "MascotChatSlot.tsx"
Cohesion: 0.33
Nodes (5): @react-navigation/native, EXPRESSION_MESSAGES, IDLE_MESSAGES, MASCOT_CONFIG, MascotMode

## Knowledge Gaps
- **257 isolated node(s):** `name`, `slug`, `version`, `orientation`, `icon` (+252 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 305 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.130) - this node is a cross-community bridge._
- **Why does `react-native` connect `react` to `index.ts`, `details-tab.tsx`, `(tabs)/index.tsx`, `cultivation-tab.tsx`, `package.json`, `MascotChatSlot.tsx`, `research-tab.tsx`, `Onboarding.tsx`, `useTheme.ts`, `plantSearch.ts`, `scan.tsx`, `useTranslation`, `localLibrary.ts`, `MySavedPlants.tsx`?**
  _High betweenness centrality (0.113) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `index.ts`, `details-tab.tsx`, `(tabs)/index.tsx`, `cultivation-tab.tsx`, `package.json`, `MascotChatSlot.tsx`, `research-tab.tsx`, `Onboarding.tsx`, `useTheme.ts`, `expo-file-system`, `plantSearch.ts`, `scan.tsx`, `useTranslation`, `localLibrary.ts`, `MySavedPlants.tsx`?**
  _High betweenness centrality (0.091) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `useTheme()` (e.g. with `3. Design tokens` and `What I did not change`) actually correct?**
  _`useTheme()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `slug`, `version` to the rest of the system?**
  _257 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.03773584905660377 - nodes in this community are weakly interconnected._
- **Should `index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10476190476190476 - nodes in this community are weakly interconnected._