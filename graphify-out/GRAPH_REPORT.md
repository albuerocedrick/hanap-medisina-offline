# Graph Report - hanap-medisina-offline  (2026-10-14)

## Corpus Check
- 111 files · ~2,948,182 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: .tflite 4, (none) 1, .ttf 1)

## Summary
- 1118 nodes · 3337 edges · 62 communities (53 shown, 9 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 259 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `870acd4b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- dependencies
- useLibraryStore
- details-tab.tsx
- nativewind
- react-native
- package.json
- expo
- Hanap Medisina Offline
- app/_layout.tsx
- withHighRefreshRate.js
- Medicinal Plant Leaf Classification
- react
- useTFLite.ts
- release-builds/README.md
- AGENTS.md
- plantSearch.ts
- useTranslation
- compilerOptions
- useTranslation.ts
- plant-grid-card.tsx
- useFeedStore.ts
- metro.config.js
- devDependencies
- scripts
- Hanap Medisina — UI Modernization Recommendations
- cultivation-tab.tsx
- utils.ts
- [id].tsx
- cd
- t
- Plant photograph credits
- s
- localLibrary.ts
- n
- site.js
- h
- wc
- fu
- plantLocalization.test.cjs
- scrollTo
- libraryBootstrap.test.cjs
- split
- modelCatalog.test.cjs
- plantSearch.test.cjs
- re
- cs
- qr
- up
- useLibraryStore.ts
- (tabs)/_layout.tsx
- physical-checklist.tsx
- constructor
- filter-pills.tsx
- Q: Check trained TFLite labels against the Library and fix symptom search
- profile-stats.tsx
- Herbi.tsx
- ds
- Fo

## God Nodes (most connected - your core abstractions)
1. `useTranslation()` - 86 edges
2. `s()` - 68 edges
3. `react` - 61 edges
4. `react-native` - 60 edges
5. `useTheme()` - 58 edges
6. `n()` - 48 edges
7. `t()` - 44 edges
8. `wc()` - 42 edges
9. `nativewind` - 39 edges
10. `r()` - 38 edges

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

## Communities (62 total, 9 thin omitted)

### Community 0 - "dependencies"
Cohesion: 0.04
Nodes (53): dependencies, babel-preset-expo, buffer, clsx, expo, expo-asset, expo-blur, expo-build-properties (+45 more)

### Community 1 - "useLibraryStore"
Cohesion: 0.30
Nodes (12): PLACEHOLDER_IMAGE, PlantComparisonScreen(), LibraryFeed(), ScanDetailSheet(), loadScanData(), PlantCard, PlantGridCard, SearchBar() (+4 more)

### Community 2 - "details-tab.tsx"
Cohesion: 0.23
Nodes (11): CRITICAL_WARNING_TERMS, DetailsTab(), DetailsTabProps, EmptySection(), getWarningSeverity(), SectionHeader(), WarningSeverity, categoryLabels (+3 more)

### Community 3 - "nativewind"
Cohesion: 0.10
Nodes (32): HomeScreen(), expo-router, @expo/vector-icons, nativewind, react-native-reanimated, @react-navigation/native, ANIM_CONFIG, Props (+24 more)

### Community 4 - "react-native"
Cohesion: 0.13
Nodes (23): HistoryScreen(), react-native, AnimatedTouchable, DeleteAction(), HistoryCard, Props, HistoryEmptyState(), AnimatedTouchable (+15 more)

### Community 5 - "package.json"
Cohesion: 0.06
Nodes (31): main, name, private, version, babel-preset-expo, cross-env, expo-build-properties, expo-constants (+23 more)

### Community 6 - "expo"
Cohesion: 0.07
Nodes (29): backgroundColor, foregroundImage, adaptiveIcon, edgeToEdgeEnabled, package, predictiveBackGestureEnabled, typedRoutes, expo (+21 more)

### Community 7 - "Hanap Medisina Offline"
Cohesion: 0.14
Nodes (13): Architecture, Building for Distribution, Export & Import, Getting Started, Hanap Medisina Offline, How to Add New Plants, How to Update the TFLite Model, License (+5 more)

### Community 8 - "app/_layout.tsx"
Cohesion: 0.33
Nodes (4): expo-font, @expo-google-fonts/quicksand, expo-splash-screen, react-native-gesture-handler

### Community 10 - "Medicinal Plant Leaf Classification"
Cohesion: 0.15
Nodes (12): Cell 1: Mount Google Drive, Cell 2: Set Up Data Pipeline, Cell 3: Build the MobileNetV3-Large Architecture, Cell 4: Train the AI, Cell 5: The Final Exam (Evaluating the Test Set), Cell 6: Export to TFLite and Save Labels, Cell 6b (Optional): Full-Integer Quantization for Maximum Accuracy Retention, Cell 7: The Retraining Phase (Fine-Tuning) (+4 more)

### Community 11 - "react"
Cohesion: 0.09
Nodes (34): NotFoundScreen(), AllSymptomsScreen(), AnimatedPressable, SymptomCard(), ViewMode, ViewToggle(), LibraryLayout(), react (+26 more)

### Community 12 - "useTFLite.ts"
Cohesion: 0.40
Nodes (3): expo-asset, react-native-fast-tflite, useTFLite()

### Community 15 - "plantSearch.ts"
Cohesion: 0.23
Nodes (13): aliases, containsTerms(), fieldCache, getFields(), groupPlantSearchResults(), matchesDocumentedUse(), normalize(), queryVariants() (+5 more)

### Community 16 - "useTranslation"
Cohesion: 0.13
Nodes (24): RootLayout(), CornerMark(), ErrorState(), { height: SCREEN_HEIGHT, width: SCREEN_WIDTH }, LoadingState(), PermissionGate(), RETICLE_H, RETICLE_W (+16 more)

### Community 17 - "compilerOptions"
Cohesion: 0.22
Nodes (8): expo/tsconfig.base, compilerOptions, module, moduleResolution, paths, strict, extends, include

### Community 18 - "useTranslation.ts"
Cohesion: 0.10
Nodes (30): ProfileScreen(), expo-file-system, @react-native-async-storage/async-storage, EditProfileModal(), ExportImportSection(), AnimatedTouchable, ProfileMenuItem(), Props (+22 more)

### Community 19 - "plant-grid-card.tsx"
Cohesion: 0.13
Nodes (16): ERD for hanap-medisina-offline, Notes, PlantCardProps, AnimatedTouchable, PLACEHOLDER_IMAGE, PlantGridCardComponent(), PlantGridCardProps, CompareTab() (+8 more)

### Community 20 - "useFeedStore.ts"
Cohesion: 0.15
Nodes (18): AnimatedPressable, QuickRemediesScreen(), RemedyCard(), ViewMode, ViewToggle(), AnimatedPressable, QuickRemedies(), RemedyCard() (+10 more)

### Community 21 - "metro.config.js"
Cohesion: 0.40
Nodes (4): config, { getDefaultConfig }, { withNativeWind }, expo

### Community 22 - "devDependencies"
Cohesion: 0.40
Nodes (5): devDependencies, cross-env, react-test-renderer, @types/react, typescript

### Community 23 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, android, android:release, ios, start

### Community 24 - "Hanap Medisina — UI Modernization Recommendations"
Cohesion: 0.05
Nodes (43): expo-blur, MascotChatSlot(), AnimatedTouchableOpacity, PlantCard(), GlassCard(), GlassCardProps, colorStyles, Typography() (+35 more)

### Community 25 - "cultivation-tab.tsx"
Cohesion: 0.48
Nodes (6): CultivationTab(), CultivationTabProps, EmptySection(), SectionHeader(), SectionItem(), CultivationGuide

### Community 27 - "[id].tsx"
Cohesion: 0.17
Nodes (16): loadComparisonData(), PLACEHOLDER_IMAGE, PlantDetailsScreen(), loadPlantData(), PlantSummary, TabKey, ResearchCard(), ResearchCardProps (+8 more)

### Community 32 - "cd"
Cohesion: 0.06
Nodes (63): ad(), Au(), Be(), bu(), cd(), cr(), Cu(), dd() (+55 more)

### Community 33 - "t"
Cohesion: 0.17
Nodes (45): Aa(), a(), b(), c(), d(), f(), g(), i() (+37 more)

### Community 34 - "Plant photograph credits"
Cohesion: 0.22
Nodes (8): bayabas.jpg, kamaria.jpg, lagundi.jpg, litlit.jpg, madre-cacao.jpg, Plant photograph credits, sambong.jpg, serpentina.jpg

### Community 35 - "s"
Cohesion: 0.09
Nodes (47): $a(), ac(), ba(), Bd(), cf(), ci(), Dc(), ec() (+39 more)

### Community 36 - "localLibrary.ts"
Cohesion: 0.14
Nodes (18): getHomeFeed(), mulberry32(), getActivePlants(), getAllCategories(), getAllPreparationGroups(), getAllSymptoms(), getPlantsByCategory(), getPlantsByPreparationMethod() (+10 more)

### Community 37 - "n"
Cohesion: 0.08
Nodes (37): af(), Ao(), C(), Co(), dn(), E(), fl(), fromTo() (+29 more)

### Community 38 - "site.js"
Cohesion: 0.06
Nodes (15): as(), Do(), ei(), gt(), Hr(), is(), Nu(), qo() (+7 more)

### Community 39 - "h"
Cohesion: 0.10
Nodes (43): h(), cl(), ct(), df(), ef(), Et(), fd(), ft() (+35 more)

### Community 40 - "wc"
Cohesion: 0.18
Nodes (24): bc(), bo(), cc(), Fi(), go(), Ha(), ho(), Ki() (+16 more)

### Community 41 - "fu"
Cohesion: 0.20
Nodes (11): At(), br(), dr(), fu(), gr(), gu(), Ke(), ls() (+3 more)

### Community 42 - "plantLocalization.test.cjs"
Cohesion: 0.16
Nodes (13): typescript, assert, compare(), english, filename, fs, loaded, numbers() (+5 more)

### Community 43 - "scrollTo"
Cohesion: 0.14
Nodes (20): advance(), bl(), checkOverflow(), emit(), gl(), internalStart(), internalStop(), l() (+12 more)

### Community 44 - "libraryBootstrap.test.cjs"
Cohesion: 0.14
Nodes (12): assert, catalog, { createRequire }, fs, load(), memory, modules, path (+4 more)

### Community 45 - "split"
Cohesion: 0.27
Nodes (10): al(), create(), hl(), il(), kill(), nl(), on(), Qc() (+2 more)

### Community 46 - "modelCatalog.test.cjs"
Cohesion: 0.15
Nodes (9): assert, catalogs, filename, fs, labels, loaded, path, test (+1 more)

### Community 47 - "plantSearch.test.cjs"
Cohesion: 0.15
Nodes (10): assert, { createRequire }, en, filename, fs, loaded, path, test (+2 more)

### Community 48 - "re"
Cohesion: 0.30
Nodes (12): ae(), b(), ce(), de(), Fe(), Hd(), ie(), le() (+4 more)

### Community 49 - "cs"
Cohesion: 0.18
Nodes (13): cs(), gs(), Ia(), jl(), ks(), np(), t(), Ra() (+5 more)

### Community 50 - "qr"
Cohesion: 0.33
Nodes (7): es(), Jr(), la(), ns(), qr(), yr(), Zr()

### Community 51 - "up"
Cohesion: 0.16
Nodes (14): ap(), cp(), dp(), ip(), kp(), lp(), mp(), op() (+6 more)

### Community 52 - "useLibraryStore.ts"
Cohesion: 0.18
Nodes (4): LibraryErrorCode, LibraryStore, LibraryStoreError, wrapError()

### Community 53 - "(tabs)/_layout.tsx"
Cohesion: 0.15
Nodes (11): GlassTabBar(), NavItem(), TabLayout(), tabs, expo-haptics, expo-linear-gradient, lucide-react-native, zustand (+3 more)

### Community 54 - "physical-checklist.tsx"
Cohesion: 0.24
Nodes (8): PhysicalChecklistRow(), PhysicalChecklistRowProps, PhysicalChecklistTable(), PhysicalChecklistTableProps, TRAIT_META, TRAIT_ORDER, TranslationKey, ComparisonTraits

### Community 55 - "constructor"
Cohesion: 0.18
Nodes (12): cleanUpClassName(), constructor(), destroy(), El(), isLocked(), isScrolling(), isStopped(), kl() (+4 more)

### Community 56 - "filter-pills.tsx"
Cohesion: 0.31
Nodes (9): FilterPills(), FilterPillsProps, Pill(), PillProps, SKELETON_WIDTHS, SkeletonPill(), getPlantCategoryLabel(), selectActiveCategory() (+1 more)

### Community 57 - "Q: Check trained TFLite labels against the Library and fix symptom search"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Check trained TFLite labels against the Library and fix symptom search, Source Nodes

### Community 58 - "profile-stats.tsx"
Cohesion: 0.50
Nodes (4): ProfileStats(), Props, StatPill(), StatPillProps

### Community 60 - "ds"
Cohesion: 0.50
Nodes (4): ca(), ds(), ld(), sa()

### Community 61 - "Fo"
Cohesion: 0.67
Nodes (4): Fo(), Io(), Lo(), Po()

## Knowledge Gaps
- **280 isolated node(s):** `name`, `slug`, `version`, `orientation`, `icon` (+275 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 354 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `en()` connect `cd` to `useTranslation.ts`, `n`, `site.js`?**
  _High betweenness centrality (0.415) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.113) - this node is a cross-community bridge._
- **Why does `react-native` connect `react-native` to `useLibraryStore`, `details-tab.tsx`, `nativewind`, `localLibrary.ts`, `package.json`, `Herbi.tsx`, `react`, `useTranslation`, `useTranslation.ts`, `plant-grid-card.tsx`, `useFeedStore.ts`, `(tabs)/_layout.tsx`, `physical-checklist.tsx`, `filter-pills.tsx`, `cultivation-tab.tsx`, `profile-stats.tsx`, `[id].tsx`, `Hanap Medisina — UI Modernization Recommendations`?**
  _High betweenness centrality (0.071) - this node is a cross-community bridge._
- **Are the 6 inferred relationships involving `s()` (e.g. with `ad()` and `ep()`) actually correct?**
  _`s()` has 6 INFERRED edges - model-reasoned connections that need verification._
- **Are the 5 inferred relationships involving `useTheme()` (e.g. with `3. Design tokens` and `What I did not change`) actually correct?**
  _`useTheme()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `slug`, `version` to the rest of the system?**
  _280 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.03773584905660377 - nodes in this community are weakly interconnected._