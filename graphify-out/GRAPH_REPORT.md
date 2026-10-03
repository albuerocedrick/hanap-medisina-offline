# Graph Report - hanap-medisina-offline  (2026-10-03)

## Corpus Check
- 103 files · ~2,931,689 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: .tflite 3, (none) 1, .ttf 1)

## Summary
- 658 nodes · 1669 edges · 38 communities (31 shown, 7 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 41 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `54fab86b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- dependencies
- dataTransfer.ts
- details-tab.tsx
- nativewind
- react
- package.json
- expo
- Hanap Medisina Offline
- Onboarding.tsx
- withHighRefreshRate.js
- Medicinal Plant Leaf Classification
- @expo/vector-icons
- expo-file-system
- localLibrary.ts
- AGENTS.md
- plantSearch.ts
- scan.tsx
- compilerOptions
- useTranslation
- library/index.tsx
- [id].tsx
- metro.config.js
- devDependencies
- scripts
- MySavedPlants.tsx
- useLibraryStore
- utils.ts
- plant-grid-card.tsx
- useLibraryStore.ts
- physical-checklist.tsx
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
7. `useLibraryStore` - 36 edges
8. `expo-router` - 25 edges
9. `react-native-reanimated` - 23 edges
10. `MedicinalPlant` - 18 edges

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

## Communities (38 total, 7 thin omitted)

### Community 0 - "dependencies"
Cohesion: 0.04
Nodes (53): dependencies, babel-preset-expo, buffer, clsx, expo, expo-asset, expo-blur, expo-build-properties (+45 more)

### Community 1 - "dataTransfer.ts"
Cohesion: 0.22
Nodes (14): expo-document-picker, expo-sharing, ExportImportSection(), AnimatedTouchable, ProfileMenuItem(), Props, applyImport(), ensureDir() (+6 more)

### Community 2 - "details-tab.tsx"
Cohesion: 0.33
Nodes (8): CRITICAL_WARNING_TERMS, DetailsTab(), DetailsTabProps, EmptySection(), getWarningSeverity(), SectionHeader(), WarningSeverity, PlantDetails

### Community 3 - "nativewind"
Cohesion: 0.09
Nodes (39): AnimatedPressable, QuickRemediesScreen(), RemedyCard(), ViewMode, ViewToggle(), AllSymptomsScreen(), AnimatedPressable, SymptomCard() (+31 more)

### Community 4 - "react"
Cohesion: 0.06
Nodes (37): NotFoundScreen(), LibraryLayout(), react, react-native, SPRITE, AnimatedTouchable, IconButton(), AnimatedTouchable (+29 more)

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

### Community 11 - "@expo/vector-icons"
Cohesion: 0.10
Nodes (34): HistoryScreen(), expo-linear-gradient, @expo/vector-icons, react-native-reanimated, react-native-safe-area-context, AnimatedTouchable, DeleteAction(), HistoryCard (+26 more)

### Community 12 - "expo-file-system"
Cohesion: 0.33
Nodes (4): expo-asset, expo-file-system, react-native-fast-tflite, useTFLite()

### Community 13 - "localLibrary.ts"
Cohesion: 0.17
Nodes (12): getHomeFeed(), mulberry32(), getAllPreparationGroups(), getAllSymptoms(), imageMap, METHOD_ICON_RULES, plantsEn, plantsTl (+4 more)

### Community 15 - "plantSearch.ts"
Cohesion: 0.08
Nodes (25): typescript, HomeSearchBar(), aliases, containsTerms(), fieldCache, getFields(), groupPlantSearchResults(), matchesDocumentedUse() (+17 more)

### Community 16 - "scan.tsx"
Cohesion: 0.14
Nodes (18): CornerMark(), ErrorState(), { height: SCREEN_HEIGHT, width: SCREEN_WIDTH }, LoadingState(), PermissionGate(), RETICLE_H, RETICLE_W, ScanBottomSheet() (+10 more)

### Community 17 - "compilerOptions"
Cohesion: 0.22
Nodes (8): expo/tsconfig.base, compilerOptions, module, moduleResolution, paths, strict, extends, include

### Community 18 - "useTranslation"
Cohesion: 0.11
Nodes (33): GlassTabBar(), NavItem(), TabLayout(), tabs, ProfileScreen(), expo-haptics, lucide-react-native, @react-native-async-storage/async-storage (+25 more)

### Community 19 - "library/index.tsx"
Cohesion: 0.21
Nodes (13): LibraryFeed(), FilterPills(), FilterPillsProps, Pill(), PillProps, SKELETON_WIDTHS, SkeletonPill(), PlantCard (+5 more)

### Community 20 - "[id].tsx"
Cohesion: 0.20
Nodes (11): PLACEHOLDER_IMAGE, PlantDetailsScreen(), loadPlantData(), PlantSummary, TabKey, CompareTab(), CompareTabProps, LookAlikeCard() (+3 more)

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
Cohesion: 0.05
Nodes (39): expo-blur, MascotChatSlot(), AnimatedTouchableOpacity, MySavedPlants(), PlantCard(), GlassCard(), GlassCardProps, Typography() (+31 more)

### Community 25 - "useLibraryStore"
Cohesion: 0.24
Nodes (15): PLACEHOLDER_IMAGE, PlantComparisonScreen(), loadComparisonData(), SearchBar(), SearchBarProps, getActivePlants(), getAllCategories(), getPlantsByCategory() (+7 more)

### Community 27 - "plant-grid-card.tsx"
Cohesion: 0.18
Nodes (11): ERD for hanap-medisina-offline, Notes, PlantCardProps, AnimatedTouchable, PLACEHOLDER_IMAGE, PlantGridCardComponent(), PlantGridCardProps, PlantSearchGroup (+3 more)

### Community 32 - "useLibraryStore.ts"
Cohesion: 0.18
Nodes (4): LibraryErrorCode, LibraryStore, LibraryStoreError, wrapError()

### Community 33 - "physical-checklist.tsx"
Cohesion: 0.28
Nodes (7): PhysicalChecklistRow(), PhysicalChecklistRowProps, PhysicalChecklistTable(), PhysicalChecklistTableProps, TRAIT_META, TRAIT_ORDER, ComparisonTraits

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
- **246 isolated node(s):** `name`, `slug`, `version`, `orientation`, `icon` (+241 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 297 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.133) - this node is a cross-community bridge._
- **Why does `react-native` connect `react` to `dataTransfer.ts`, `details-tab.tsx`, `nativewind`, `package.json`, `Onboarding.tsx`, `@expo/vector-icons`, `localLibrary.ts`, `plantSearch.ts`, `scan.tsx`, `useTranslation`, `library/index.tsx`, `[id].tsx`, `MySavedPlants.tsx`, `useLibraryStore`, `plant-grid-card.tsx`, `physical-checklist.tsx`, `cultivation-tab.tsx`, `research-tab.tsx`, `MascotChatSlot.tsx`?**
  _High betweenness centrality (0.114) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `dataTransfer.ts`, `details-tab.tsx`, `nativewind`, `package.json`, `Onboarding.tsx`, `@expo/vector-icons`, `expo-file-system`, `plantSearch.ts`, `scan.tsx`, `useTranslation`, `library/index.tsx`, `[id].tsx`, `MySavedPlants.tsx`, `useLibraryStore`, `plant-grid-card.tsx`, `physical-checklist.tsx`, `cultivation-tab.tsx`, `research-tab.tsx`, `MascotChatSlot.tsx`?**
  _High betweenness centrality (0.093) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `useTheme()` (e.g. with `3. Design tokens` and `What I did not change`) actually correct?**
  _`useTheme()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `slug`, `version` to the rest of the system?**
  _246 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.03773584905660377 - nodes in this community are weakly interconnected._
- **Should `nativewind` be split into smaller, more focused modules?**
  _Cohesion score 0.09433962264150944 - nodes in this community are weakly interconnected._