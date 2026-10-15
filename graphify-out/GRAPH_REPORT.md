# Graph Report - hanap-medisina-offline  (2026-10-15)

## Corpus Check
- 111 files · ~2,537,464 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: .tflite 4, (none) 1, .ttf 1)

## Summary
- 1143 nodes · 3368 edges · 70 communities (61 shown, 9 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 259 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `47dda976`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- dependencies
- e
- details-tab.tsx
- @expo/vector-icons
- react
- package.json
- expo
- Hanap Medisina Offline
- app/_layout.tsx
- withHighRefreshRate.js
- Medicinal Plant Leaf Classification
- useTheme.ts
- useTFLite.ts
- release-builds/README.md
- AGENTS.md
- plantSearch.ts
- scan.tsx
- compilerOptions
- useTranslation
- ap
- useTheme
- metro.config.js
- devDependencies
- scripts
- Hanap Medisina — UI Modernization Recommendations
- nativewind
- utils.ts
- [id].tsx
- fu
- n
- Plant photograph credits
- mc
- localLibrary.ts
- wc
- site.js
- h
- cd
- s
- plantLocalization.test.cjs
- split
- libraryBootstrap.test.cjs
- Co
- modelCatalog.test.cjs
- plantSearch.test.cjs
- cultivation-tab.tsx
- es
- dr
- research-tab.tsx
- useLibraryStore.ts
- (tabs)/_layout.tsx
- physical-checklist.tsx
- El
- filter-pills.tsx
- Q: Check trained TFLite labels against the Library and fix symptom search
- Navigation & UI pass — what changed, and what I'd do next
- Herbi.tsx
- homeFeed.ts
- Fo
- UI fixes — implementation notes
- uu
- Typography.tsx
- E
- GlassCard.tsx
- MascotChatSlot.tsx
- Build & verification
- profile-stats.tsx

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

## Communities (70 total, 9 thin omitted)

### Community 0 - "dependencies"
Cohesion: 0.04
Nodes (53): dependencies, babel-preset-expo, buffer, clsx, expo, expo-asset, expo-blur, expo-build-properties (+45 more)

### Community 1 - "e"
Cohesion: 0.20
Nodes (12): create(), cs(), fs(), gs(), Ia(), je(), jo(), np() (+4 more)

### Community 2 - "details-tab.tsx"
Cohesion: 0.31
Nodes (9): CRITICAL_WARNING_TERMS, DetailsTab(), DetailsTabProps, EmptySection(), getWarningSeverity(), SectionHeader(), WarningSeverity, getPlantFactLabel() (+1 more)

### Community 3 - "@expo/vector-icons"
Cohesion: 0.13
Nodes (27): HomeScreen(), @expo/vector-icons, loadScanData(), DailyTrivia(), HomeSearchBar(), SkeletonChip(), SkeletonTriviaCard(), usePulseStyle() (+19 more)

### Community 4 - "react"
Cohesion: 0.12
Nodes (21): PLACEHOLDER_IMAGE, LibraryFeed(), react, react-native, react-native-reanimated, react-native-safe-area-context, PlantCard, AnimatedTouchable (+13 more)

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
Cohesion: 0.31
Nodes (7): RootLayout(), expo-font, @expo-google-fonts/quicksand, expo-splash-screen, react-native-gesture-handler, Onboarding(), useOnboardingStore

### Community 10 - "Medicinal Plant Leaf Classification"
Cohesion: 0.15
Nodes (12): Cell 1: Mount Google Drive, Cell 2: Set Up Data Pipeline, Cell 3: Build the MobileNetV3-Large Architecture, Cell 4: Train the AI, Cell 5: The Final Exam (Evaluating the Test Set), Cell 6: Export to TFLite and Save Labels, Cell 6b (Optional): Full-Integer Quantization for Maximum Accuracy Retention, Cell 7: The Retraining Phase (Fine-Tuning) (+4 more)

### Community 11 - "useTheme.ts"
Cohesion: 0.16
Nodes (18): AnimatedTouchable, HomeHeader(), IconButton(), AnimatedTouchable, CategoryChip, PLACEHOLDER_IMAGE, PlantCardComponent(), IconButton() (+10 more)

### Community 12 - "useTFLite.ts"
Cohesion: 0.40
Nodes (3): expo-asset, react-native-fast-tflite, useTFLite()

### Community 15 - "plantSearch.ts"
Cohesion: 0.24
Nodes (15): aliases, containsTerms(), fieldCache, getFields(), groupPlantSearchResults(), matchesDocumentedUse(), normalize(), queryVariants() (+7 more)

### Community 16 - "scan.tsx"
Cohesion: 0.12
Nodes (21): CornerMark(), ErrorState(), { height: SCREEN_HEIGHT, width: SCREEN_WIDTH }, LoadingState(), PermissionGate(), RETICLE_H, RETICLE_W, ScanBottomSheet() (+13 more)

### Community 17 - "compilerOptions"
Cohesion: 0.22
Nodes (8): expo/tsconfig.base, compilerOptions, module, moduleResolution, paths, strict, extends, include

### Community 18 - "useTranslation"
Cohesion: 0.16
Nodes (21): ProfileScreen(), lucide-react-native, CaptureGuide(), EditProfileModal(), ExportImportSection(), PhotoCreditsSheet(), AnimatedTouchable, ProfileMenuItem() (+13 more)

### Community 19 - "ap"
Cohesion: 0.25
Nodes (7): ap(), ip(), kp(), op(), rp(), tp(), wp()

### Community 20 - "useTheme"
Cohesion: 0.18
Nodes (16): NotFoundScreen(), AnimatedPressable, QuickRemediesScreen(), RemedyCard(), ViewMode, ViewToggle(), AllSymptomsScreen(), AnimatedPressable (+8 more)

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
Cohesion: 0.17
Nodes (11): 1. The core problem: there is no single source of truth for colour, 2. Contrast: three muted-text values currently fall below AA, 3. Cards read as flat outlines (light mode), 4. Elevation, radius, and spacing scales, 6. Touch targets and accessibility, 8. Housekeeping, 9. Verified on device: the app never becomes idle, Duplicates worth collapsing (+3 more)

### Community 25 - "nativewind"
Cohesion: 0.07
Nodes (42): HistoryScreen(), expo-file-system, nativewind, @react-native-async-storage/async-storage, zustand, ERD for hanap-medisina-offline, Notes, AnimatedTouchable (+34 more)

### Community 27 - "[id].tsx"
Cohesion: 0.22
Nodes (14): PlantComparisonScreen(), loadComparisonData(), PLACEHOLDER_IMAGE, PlantDetailsScreen(), loadPlantData(), PlantSummary, TabKey, CompareTab() (+6 more)

### Community 32 - "fu"
Cohesion: 0.09
Nodes (45): ad(), Au(), Be(), bu(), Cu(), di(), du(), fu() (+37 more)

### Community 33 - "n"
Cohesion: 0.13
Nodes (58): Aa(), a(), b(), c(), d(), f(), g(), i() (+50 more)

### Community 34 - "Plant photograph credits"
Cohesion: 0.06
Nodes (31): aloe-vera.jpg, alugbati.jpg, banaba.jpg, bayabas.jpg, calamansi.jpg, dila-dila.jpg, gumamela.jpg, guyabano.jpg (+23 more)

### Community 35 - "mc"
Cohesion: 0.11
Nodes (40): ac(), ae(), ce(), cf(), ci(), de(), fa(), fc() (+32 more)

### Community 36 - "localLibrary.ts"
Cohesion: 0.15
Nodes (18): getHomeFeed(), mulberry32(), getActivePlants(), getAllCategories(), getAllPreparationGroups(), getAllSymptoms(), getPlantsByCategory(), getPlantsByPreparationMethod() (+10 more)

### Community 37 - "wc"
Cohesion: 0.13
Nodes (33): $a(), bc(), Bd(), bo(), cc(), ec(), eo(), ff() (+25 more)

### Community 38 - "site.js"
Cohesion: 0.06
Nodes (13): Dc(), ei(), Eu(), gt(), Hr(), ku(), Ou(), us() (+5 more)

### Community 39 - "h"
Cohesion: 0.14
Nodes (33): h(), af(), cl(), ct(), df(), ef(), ft(), gf() (+25 more)

### Community 40 - "cd"
Cohesion: 0.13
Nodes (20): cd(), cr(), dp(), dt(), en(), fr(), G(), Kn() (+12 more)

### Community 41 - "s"
Cohesion: 0.09
Nodes (34): ba(), dd(), Et(), fd(), Ht(), It(), kt(), lt() (+26 more)

### Community 42 - "plantLocalization.test.cjs"
Cohesion: 0.15
Nodes (12): assert, compare(), english, filename, fs, loaded, numbers(), path (+4 more)

### Community 43 - "split"
Cohesion: 0.08
Nodes (36): advance(), al(), bl(), checkOverflow(), cleanUpClassName(), constructor(), destroy(), emit() (+28 more)

### Community 44 - "libraryBootstrap.test.cjs"
Cohesion: 0.14
Nodes (12): assert, catalog, { createRequire }, fs, load(), memory, modules, path (+4 more)

### Community 45 - "Co"
Cohesion: 0.17
Nodes (16): Ao(), as(), Co(), Do(), is(), ko(), mo(), No() (+8 more)

### Community 46 - "modelCatalog.test.cjs"
Cohesion: 0.15
Nodes (10): typescript, assert, catalogs, filename, fs, labels, loaded, path (+2 more)

### Community 47 - "plantSearch.test.cjs"
Cohesion: 0.14
Nodes (10): assert, { createRequire }, en, filename, fs, loaded, path, test (+2 more)

### Community 48 - "cultivation-tab.tsx"
Cohesion: 0.48
Nodes (6): CultivationTab(), CultivationTabProps, EmptySection(), SectionHeader(), SectionItem(), CultivationGuide

### Community 49 - "es"
Cohesion: 0.25
Nodes (8): es(), Jr(), ks(), la(), ns(), So(), ws(), yr()

### Community 50 - "dr"
Cohesion: 0.33
Nodes (6): At(), br(), dr(), gr(), ls(), xr()

### Community 51 - "research-tab.tsx"
Cohesion: 0.43
Nodes (5): ResearchCard(), ResearchCardProps, ResearchTab(), ResearchTabProps, ResearchEntry

### Community 52 - "useLibraryStore.ts"
Cohesion: 0.10
Nodes (13): PlantCardProps, PlantGridCardProps, CompareTabProps, LookAlikeCard(), PLACEHOLDER_IMAGE, PlantSearchGroup, LibraryActions, LibraryErrorCode (+5 more)

### Community 53 - "(tabs)/_layout.tsx"
Cohesion: 0.20
Nodes (7): GlassTabBar(), NavItem(), TabLayout(), tabs, expo-haptics, expo-linear-gradient, InputProps

### Community 54 - "physical-checklist.tsx"
Cohesion: 0.24
Nodes (8): PhysicalChecklistRow(), PhysicalChecklistRowProps, PhysicalChecklistTable(), PhysicalChecklistTableProps, TRAIT_META, TRAIT_ORDER, TranslationKey, ComparisonTraits

### Community 55 - "El"
Cohesion: 0.50
Nodes (5): El(), kl(), ol(), sl(), Tl()

### Community 56 - "filter-pills.tsx"
Cohesion: 0.23
Nodes (11): FilterPills(), FilterPillsProps, Pill(), PillProps, SKELETON_WIDTHS, SkeletonPill(), categoryLabels, factLabels (+3 more)

### Community 57 - "Q: Check trained TFLite labels against the Library and fix symptom search"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Check trained TFLite labels against the Library and fix symptom search, Source Nodes

### Community 58 - "Navigation & UI pass — what changed, and what I'd do next"
Cohesion: 0.18
Nodes (10): Navigation & UI pass — what changed, and what I'd do next, Part 1 — The back button problem, Part 2 — The cramped "See all" cards, Part 3 — The rest of the pass, Part 4 — What I'd replace or remake next, The actual root cause, Tier 1 — high impact, low risk, Tier 2 — meaningful UX wins (+2 more)

### Community 60 - "homeFeed.ts"
Cohesion: 0.38
Nodes (6): FeedActions, FeedState, HomeFeedData, PreparationGroup, SymptomItem, TriviaItem

### Community 61 - "Fo"
Cohesion: 0.67
Nodes (4): Fo(), Io(), Lo(), Po()

### Community 62 - "UI fixes — implementation notes"
Cohesion: 0.27
Nodes (9): MascotChatSlot(), AnimatedTouchableOpacity, PlantCard(), 1. The one that actually matters: the mascot never stopped animating, 2. Contrast, 4. Touch targets, 5. Card surfaces, UI fixes — implementation notes (+1 more)

### Community 63 - "uu"
Cohesion: 0.33
Nodes (6): ca(), ds(), jl(), ld(), sa(), uu()

### Community 64 - "Typography.tsx"
Cohesion: 0.29
Nodes (6): colorStyles, Typography(), TypographyProps, variantStyles, 3. Design tokens, 5. Typography

### Community 65 - "E"
Cohesion: 0.40
Nodes (5): dn(), E(), pn(), t(), register()

### Community 66 - "GlassCard.tsx"
Cohesion: 0.33
Nodes (5): expo-blur, GlassCard(), GlassCardProps, 6. Housekeeping, 7. Screen-level notes

### Community 67 - "MascotChatSlot.tsx"
Cohesion: 0.33
Nodes (5): @react-navigation/native, EXPRESSION_MESSAGES, IDLE_MESSAGES, MASCOT_CONFIG, MascotMode

### Community 68 - "Build & verification"
Cohesion: 0.67
Nodes (3): Build & verification, Still worth a human eye, Two things to know about the build

### Community 69 - "profile-stats.tsx"
Cohesion: 0.50
Nodes (4): ProfileStats(), Props, StatPill(), StatPillProps

## Knowledge Gaps
- **303 isolated node(s):** `name`, `slug`, `version`, `orientation`, `icon` (+298 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 377 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `en()` connect `cd` to `e`, `useTranslation`, `site.js`?**
  _High betweenness centrality (0.412) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.113) - this node is a cross-community bridge._
- **Why does `react-native` connect `react` to `details-tab.tsx`, `@expo/vector-icons`, `package.json`, `useTheme.ts`, `scan.tsx`, `useTranslation`, `useTheme`, `nativewind`, `[id].tsx`, `localLibrary.ts`, `cultivation-tab.tsx`, `research-tab.tsx`, `useLibraryStore.ts`, `(tabs)/_layout.tsx`, `physical-checklist.tsx`, `filter-pills.tsx`, `Herbi.tsx`, `Typography.tsx`, `GlassCard.tsx`, `MascotChatSlot.tsx`, `profile-stats.tsx`?**
  _High betweenness centrality (0.078) - this node is a cross-community bridge._
- **Are the 6 inferred relationships involving `s()` (e.g. with `ad()` and `ep()`) actually correct?**
  _`s()` has 6 INFERRED edges - model-reasoned connections that need verification._
- **Are the 5 inferred relationships involving `useTheme()` (e.g. with `3. Design tokens` and `What I did not change`) actually correct?**
  _`useTheme()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `slug`, `version` to the rest of the system?**
  _303 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.03773584905660377 - nodes in this community are weakly interconnected._