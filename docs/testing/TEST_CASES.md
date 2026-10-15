# HanapMedisina functional test cases

This checklist contains **95 scenarios** for the Android app. Every scenario starts as **Not run**. A passing Node test is evidence for the JavaScript behavior it exercises; it does not mean the APK, camera, native storage, screen layout, or accessibility service passed on a device. Record device results separately for each environment below.

The app package is `com.sdnp.hanapmedisinaoffline`, its link scheme is `hanapmedisinaoffline`, and its bundled catalog contains 30 plants. Check the actual APK metadata before testing rather than relying on its filename or the version string alone.

## Run record and acceptance rules

For each run, record tester, Manila date/time, Git commit or dirty-source identifier, APK absolute path and SHA-256, installation type, device/model, Android version/API, ABI, available storage, language, theme, and connection state. Attach screenshots or screen recordings for UI failures and relevant logcat excerpts for crashes. Record **actual outcome** and a defect reference beside any failed scenario.

Use these statuses: `Not run`, `Pass`, `Fail`, `Blocked`, or `Not applicable (reason)`. Never convert a blocked camera/fault-injection case into Pass because its unit test passed. P0 means release-blocking core use or data integrity; P1 means major functionality or recovery; P2 means secondary behavior. Release acceptance requires all applicable P0 and P1 scenarios to pass, no unexplained crash/ANR, successful offline capture on a real camera, and retained data after restart and upgrade. State any remaining P2 exceptions explicitly.

## Environment matrix

Run the normal feature path on the primary real device, then repeat the relevant cases for each row. Test EN and TL in both light and dark themes; the four combinations need explicit results. Android API 36 is a compatibility target for this checklist, not a claim about the APK's configured target SDK.

| Environment | Required coverage | Result |
| --- | --- | --- |
| Real Android phone, `arm64-v8a`, rear camera with flash/focus | All normal cases; fresh installation and retained-data upgrade; fully offline capture | Not run |
| Android 7/API 24 device or emulator | Minimum-version installation, launch, navigation, fonts, permissions, storage, import/export; real-device capture if hardware is available | Not run |
| Android 16/API 36 device or emulator | Installation, edge-to-edge/insets, permissions/photo picker, background/resume, share/document picker, hardware back | Not run |
| Android `x86_64` emulator | Packaged native-library loading, launch and navigation; emulator camera results reported separately from real camera results | Not run |
| `armeabi-v7a` and `x86`, if distributed in the APK | Verify native libraries for each delivered ABI; install and run on a compatible test target, or record why unavailable | Not run |
| English/light, English/dark, Tagalog/light, Tagalog/dark | Labels, catalog text, filters, sheets, scan results and errors in every combination | Not run |
| Small phone at about 320–360 dp width; large phone/tablet | Keyboard, long names, two-column grids, bottom tabs, camera/result-sheet content and safe areas | Not run |
| TalkBack; largest supported system font/display size; reduced motion | Focus/order/labels, readable content and reachable controls; no animation-dependent actions | Not run |
| Airplane mode, Wi-Fi/mobile data off; online comparison run | Offline catalog, home feed, model, scans, persistence and local backup; external photo-source links are separately online | Not run |
| Low storage and controlled I/O/native-failure rig | Recovery without record loss, stuck spinners or overlapping requests | Not run |

Read-only APK/device preflight is available through `node scripts/android-smoke.cjs` once that script is present. Read its `--help` before enabling any install/launch option. Substitute the actual release path and the intended device serial only as supported by the script. An APK-only inspection cannot mark device scenarios Pass.

## Safe setup and fixtures

Use a spare device, emulator, or disposable test profile. Export existing data and copy the backup outside the app before reset, replace import, upgrade, uninstall, app-data clearing, or low-storage experiments. Do not clear a user's working app to prepare a test. Keep the original APK and its signing identity for upgrade tests. Do not change a daily-use phone's clock to test trivia.

The following setup names are used in the case tables:

| Setup | Preparation |
| --- | --- |
| Clean | Fresh installation in a disposable environment; no previous app data. Internet can be disabled before first launch. |
| Seeded | Onboarding complete; at least two successful scans at different times, one favorited history record, two saved library plants, a custom name and avatar. Save a baseline backup and note all counts. |
| Images | Use your own clear leaf photos/real leaves from a correctly identified supported species, plus a blank wall/non-leaf scene. Retain the originals for comparison. Model confidence is not botanical proof. |
| Fault rig | Developer-controlled native substitutes or a dedicated instrumented test build. Inject only the named failure. The shipping UI has no fault-injection switch. If unavailable, leave the native scenario Blocked and link the corresponding Node evidence separately. |
| Backup A | Export the Seeded app to a local JSON file; retain one untouched copy. This fixture includes real image/avatar bytes for round-trip checks. |
| Backup B | Create the small synthetic JSON below in a UTF-8 `.json` file; transfer it to the test device's Documents folder. It deliberately contains no image bytes. |
| Backup variants | Make separate copies of B with one change at a time: malformed JSON; version `2`; missing `scans`; confidence `1.1`; invalid date; unsafe ID `../escape`; repeated scan IDs; unknown favorite ID; or no favorites. Keep filenames descriptive. |
| Large backup | On the test workstation, create a valid B plus a harmless string property large enough to exceed 26,214,400 bytes. Check the encoded file size; do not use private photos to create it. Use a file at the exact limit separately. |
| Restart | Close/force-stop only the test app and relaunch it; do not clear app data. Distinguish restart from reinstall. |

Backup B:

```json
{
  "version": 1,
  "exportedAt": "2026-10-15T00:00:00.000Z",
  "profile": { "firstName": "QA", "lastName": "Tester" },
  "scans": [
    {
      "id": "fixture_older",
      "plantId": "mango",
      "plantName": "Mango",
      "confidence": 0.92,
      "scannedAt": "2026-10-13T02:00:00.000Z",
      "isFavorite": false,
      "notes": "Synthetic older scan"
    },
    {
      "id": "fixture_newer",
      "plantId": "lagundi",
      "plantName": "Lagundi",
      "confidence": 0.38,
      "scannedAt": "2026-10-15T02:00:00.000Z",
      "isFavorite": true
    }
  ],
  "favorites": ["lagundi", "bayabas"]
}
```

To make the size fixtures on a workstation with Node, save B as `backup-b.json` in a disposable folder, change into that folder, and run:

```powershell
node -e 'const fs=require("node:fs");const b=JSON.parse(fs.readFileSync("backup-b.json","utf8"));const limit=25*1024*1024;for(const [name,size] of [["backup-exact-limit.json",limit],["backup-over-limit.json",limit+1]]){const base=JSON.stringify({...b,padding:""});fs.writeFileSync(name,JSON.stringify({...b,padding:"x".repeat(size-Buffer.byteLength(base))}));}'
```

Use a document provider that reports file size for the normal import path. An exact-limit JSON file can still require considerably more runtime memory; a size-limit check alone is not a memory-pressure pass.

## Automated evidence and limits

From the repository root run `npm test` and `npm run typecheck`. Record their actual results in the run report, with command and source/APK identity. Device execution statuses below remain independent.

| Area | Executable evidence |
| --- | --- |
| UI workflows: onboarding, profile, language, library, detail tabs, history, delete dialogs | [uiWorkflows.test.cjs](../../tests/uiWorkflows.test.cjs), with [native substitute harness](../../tests/helpers/renderApp.cjs) |
| Startup and recoverable rendering failures | [appRecovery.test.cjs](../../tests/appRecovery.test.cjs) |
| Catalog/schema/assets, translations, feed links, themes | [appContracts.test.cjs](../../tests/appContracts.test.cjs), [modelCatalog.test.cjs](../../tests/modelCatalog.test.cjs), [plantLocalization.test.cjs](../../tests/plantLocalization.test.cjs) |
| Search/filtering, first-launch catalog and preference hydration | [plantSearch.test.cjs](../../tests/plantSearch.test.cjs), [libraryBootstrap.test.cjs](../../tests/libraryBootstrap.test.cjs) |
| Scan session, model lifecycle, inference/preprocessing and failure branches | [scanLifecycle.test.cjs](../../tests/scanLifecycle.test.cjs), [scanInference.test.cjs](../../tests/scanInference.test.cjs), [scanFailurePaths.test.cjs](../../tests/scanFailurePaths.test.cjs) |
| Persistence, import/export, migrations, partial failures | [dataStores.test.cjs](../../tests/dataStores.test.cjs), [dataWorkflows.test.cjs](../../tests/dataWorkflows.test.cjs) |
| Android configuration plugin | [highRefreshPlugin.test.cjs](../../tests/highRefreshPlugin.test.cjs) |

For a focused run, for example: `node --test --test-name-pattern "avatar" tests/uiWorkflows.test.cjs`. Assertions inspect behavior and data; mocked camera/filesystem/native APIs cannot establish sensor quality, Android permission behavior, JNI/ABI compatibility, actual disk-failure recovery, or visual layout.

## Launch and onboarding — 7 cases

| ID | Priority | Setup | Exact steps | Expected outcome | Device execution |
| --- | --- | --- | --- | --- | --- |
| BOOT-001 | P0 | Clean; release APK; offline | Install the selected APK; open from launcher; wait for startup; tap each of the five tabs after onboarding. | Installation succeeds on the chosen ABI; splash ends; no blank screen/crash; Home, Library, Scan, History and Profile are reachable. | Not run |
| BOOT-002 | P1 | Clean; onboarding visible | Tap Next; confirm the preparation page; tap Back; tap Next twice; inspect the progress indicator on each page. | Welcome, preparation and capture pages appear in order; Back returns one page; progress reads 1/3 through 3/3; no Back on page one. | Not run |
| BOOT-003 | P1 | Clean; onboarding visible | Tap Skip on page one; restart the app. | Home opens; onboarding completion persists; the welcome flow does not return on ordinary restart. | Not run |
| BOOT-004 | P1 | Clean; onboarding visible | Advance to page three; tap Start; restart. | Home opens once; completion persists; taps do not leave an onboarding overlay or duplicate navigation. | Not run |
| BOOT-005 | P1 | Onboarding complete | Open Profile; tap the replay-introduction/help menu item; complete or skip the replay; return to Scan. | Replay begins at the welcome page; saved profile/scans/favorites survive; replay does not incorrectly reset camera-guide completion. | Not run |
| BOOT-006 | P1 | Fault rig; font loading fails | Reject the initial font asset load; launch; then navigate between tabs. | Font failure ends the splash and exposes usable content using fallback fonts; there is no endless spinner or unreadable control. JavaScript branch: appRecovery tests. | Not run |
| BOOT-007 | P0 | Fault rig; recoverable screen render exception | Trigger one render exception; inspect recovery text; remove the injected failure; tap Retry. | Recovery replaces the failed subtree and releases the splash if necessary; Retry remounts usable content without exposing a stack trace to the user. JavaScript branch: appRecovery tests. | Not run |

## Home, search, symptoms and preparations — 9 cases

| ID | Priority | Setup | Exact steps | Expected outcome | Device execution |
| --- | --- | --- | --- | --- | --- |
| HOME-001 | P1 | Clean, then Seeded | Inspect Home greeting, saved plants, recent scans and statistics; create one scan and save one plant; return Home. | Clean state is understandable; greeting uses the current first name; scan and saved-plant totals update without reopening the app; catalog total is 30. | Not run |
| HOME-002 | P0 | Clean; Library never opened; offline | Finish onboarding; immediately type `Lagundi` into Home search. | The bundled catalog is searchable before visiting Library; a matching plant card appears; no network request is required for catalog availability. | Not run |
| HOME-003 | P1 | Home; English, then Tagalog | Search `Vitex`, `cough`, and a matching local/scientific name; repeat with a term from the Tagalog catalog. | Name/scientific/description/use matching produces relevant grouped results; labels/counts are readable; there are no duplicated cards within a group. | Not run |
| HOME-004 | P1 | Home search focused | Enter `zzzz-no-such-plant`; inspect empty state; tap the clear control; type spaces only. | No-match text appears for the unmatched query; clear empties the field and keeps it usable; whitespace shows the search hint rather than a failure. | Not run |
| HOME-005 | P1 | Home search focused; keyboard visible | Type a query; press Android Back once; reopen search; hide the keyboard; reopen and switch to another tab, then Home. | Search closes cleanly and clears its query; the dashboard returns; hidden dashboard controls do not intercept search touches or accessibility focus. | Not run |
| HOME-006 | P0 | Home with search results and seeded cards | Tap a search result; go back; tap a saved plant; go back; tap a recent scan; close its sheet; tap Scan Now. | Each plant opens its own detail page; recent scan opens its scan sheet; Scan Now opens Scan; no stale sheet blocks navigation. | Not run |
| HOME-007 | P1 | Home; symptom data loaded | Open all symptoms; toggle grid/list; select a symptom such as cough; inspect Library; clear the displayed symptom banner. | Layout changes retain all symptom entries/counts; selection filters the complete catalog by preparation uses; Clear restores the catalog; Back remains available. | Not run |
| HOME-008 | P1 | Home; preparation data loaded | Open all quick remedies; toggle grid/list; select a preparation such as decoction; inspect Library; clear the preparation banner. | Selection filters by preparation method; shown plants include that method; counts/layout are coherent; Clear restores all plants. | Not run |
| HOME-009 | P2 | Home; disposable clock-controlled emulator or test rig | Note today's trivia; refresh Home; restart; advance the test date to the next local weekday; reopen Home. | The same weekday chooses the same nonempty trivia; another weekday uses its own card; refresh ends; existing recent scans remain present. | Not run |

## Library — 10 cases

| ID | Priority | Setup | Exact steps | Expected outcome | Device execution |
| --- | --- | --- | --- | --- | --- |
| LIB-001 | P0 | Clean; offline; filters clear | Open Library; scroll to the end; count unique plants; open several cards including the last one. | All 30 bundled plants are available with local images/details; no partial cache, duplicate ID, unresolved spinner or network gate hides records. | Not run |
| LIB-002 | P1 | Library | Select a category; focus search; type `Lag` then `Lagundi` rapidly; wait at least 320 ms after the final edit. | Chrome collapses during focus; the final query wins; hidden category/symptom/preparation filters are cleared when a new search starts; Lagundi is shown once. | Not run |
| LIB-003 | P1 | Library search active | Type a pending query; press Cancel before debounce completes; wait; repeat and press the keyboard Search action; navigate away during another pending edit. | Cancel clears query and restores chrome without a late stale update; Search submits immediately and dismisses keyboard; leaving/unmounting does not commit an obsolete timer. | Not run |
| LIB-004 | P1 | Library; search empty | Tap two different category pills in turn; inspect selected state and each plant's categories; tap All. | Only the chosen category is active; each result belongs to it; All restores the full catalog; pill scrolling remains usable. | Not run |
| LIB-005 | P1 | Enter Library from a Home symptom | Note the symptom banner; select a category; repeat with a new symptom; tap the banner's Clear. | Switching filter type removes the previous hidden symptom/preparation state; Clear removes the visible symptom filter; no unrelated intersection empties valid results. | Not run |
| LIB-006 | P1 | Enter Library from a preparation | Inspect each result's preparation; start a name search; clear it; select another preparation from Home. | Method filtering matches the chosen preparation; a new name search resets the method; returning with another method uses the current value. | Not run |
| LIB-007 | P0 | No saved plants, then save two | Toggle Favorites only; return to all plants; save two plant cards/details; toggle Favorites only again; remove one favorite. | Empty favorites is usable and can return to All; saved-only list updates immediately; removal removes only the chosen saved plant. | Not run |
| LIB-008 | P0 | Two saved plants; one view-mode preference | Restart; inspect favorites; change language; inspect again; rapidly favorite/unfavorite the same card. | Favorite membership survives and resolves current-language bundled records; final tap sequence is reflected consistently without lost IDs or corrupt preferences. | Not run |
| LIB-009 | P1 | Full catalog, then an odd-sized category/result set | Toggle list to grid and back; scroll through both; inspect the final odd grid row; tap a card. | Order and all records survive; grid has two columns with a valid final single item; no FlatList column-change crash; tapping opens the correct plant. | Not run |
| LIB-010 | P1 | Fault rig for catalog fetch/image errors | Trigger catalog loading/failure with an empty list; tap Try Again; pull to refresh after recovery; trigger a card-image load failure. | Loading/error/empty states are distinct; retry and refresh end and restore data; a missing image has a themed fallback without removing its card or navigation. | Not run |

## Plant details and comparison — 7 cases

| ID | Priority | Setup | Exact steps | Expected outcome | Device execution |
| --- | --- | --- | --- | --- | --- |
| DETAIL-001 | P0 | Library; known plant | Open Lagundi; inspect name/scientific name/categories; open Details, Research, Cultivation and Compare; scroll each to its end. | Each tab renders its corresponding bundled fields and warnings; selected-tab state tracks the tap; long content is reachable without overlapping bottom controls. | Not run |
| DETAIL-002 | P1 | Plant with look-alikes, e.g. Bayabas or Tsaang Gubat | Open Compare; tap a look-alike card; inspect the two names/images and physical checklist. | Comparison uses the source plant as A and the chosen look-alike as B; both IDs exist and differ; traits belong to those plants. | Not run |
| DETAIL-003 | P1 | Plant comparison | Choose Select from Library; search/select a second plant; use Change to select another; cancel the picker on an existing comparison. | The primary plant cannot select itself; the chosen second plant and checklist refresh; cancel retains an existing comparison; canceling an initial pick returns safely. | Not run |
| DETAIL-004 | P1 | Test link or debug navigation to missing/invalid plant/comparison ID | Open an invalid detail ID; tap its Back control with no navigation history; repeat with missing/invalid comparison parameters. | A readable error appears with a working route back to Library; no permanent white/blank screen, raw exception or dead-end back button. | Not run |
| DETAIL-005 | P2 | Fault rig with missing preparation/research/cultivation/traits | Open each affected detail tab and comparison; restore normal data and reopen. | Sections show their documented empty states; absent/partial fields do not crash the entire detail page; normal data returns after recovery. | Not run |
| DETAIL-006 | P0 | Detail page for an unsaved plant | Tap the heart; observe its accessible selected state; alter that plant's favorite externally in Library; return; restart. | The heart reflects current store membership; save/remove persists; unrelated favorite changes do not reload/reset the active detail tab. | Not run |
| DETAIL-007 | P2 | Detail page; then injected image failure | Change language while browsing a plant; reopen details; trigger hero-image failure; use Back with/without route history. | Text/categories are in the current language; fallback image appears; both normal Back and cold-link fallback lead to a usable screen. | Not run |

## Camera and scan — 17 cases

| ID | Priority | Setup | Exact steps | Expected outcome | Device execution |
| --- | --- | --- | --- | --- | --- |
| SCAN-001 | P1 | Clean; first visit to Scan | Open Scan; read all four capture tips; close the guide; leave/revisit Scan; reopen Capture Help and close it. | Guide appears initially and is replayable; closing marks it seen; it does not reappear on every visit; camera/capture stay inactive while the guide is open. | Not run |
| SCAN-002 | P0 | Camera permission not yet granted | Open Scan; close guide; tap the permission button; grant camera permission in Android. | Android camera permission is requested; only necessary camera permission is used; live rear preview becomes available and capture becomes enabled when the model is ready. | Not run |
| SCAN-003 | P0 | Camera permission denied | Deny once; revisit Scan; deny permanently if available; grant permission from Android app settings; return. | Permission explanation remains usable after denial; other tabs work; returning after settings grant recovers the preview without clearing data or reinstalling. | Not run |
| SCAN-004 | P1 | Camera unavailable/error rig; optional camera-less emulator | Open Scan with no rear device; then inject Camera onError; tap Try Again after restoring availability. | Readable camera-unavailable state appears; retry remounts/reinitializes the camera; recovery does not leave a result-sheet dismissal lock. | Not run |
| SCAN-005 | P0 | Fresh process; slow model-load rig | Open Scan before model loading completes; tap Capture and the selected Scan tab while loading; let loading finish. | Busy/disabled state prevents native capture before model and labels are ready; loading completes; the first later intentional capture works. | Not run |
| SCAN-006 | P0 | Real device; Images; model ready; offline | Frame one supported leaf on a plain background; tap Capture; wait for analysis/save; open History. | Accepted match shows label and finite confidence; one durable history record and image are saved; no network is required; count increases by exactly one. Record actual species/confidence separately. | Not run |
| SCAN-007 | P0 | Scan active and idle | Tap Capture rapidly several times; repeat using the selected Scan tab; wait for completion and dismiss. | One operation owns the camera/worker/storage lock; no overlapping capture, duplicate history record, replayed trigger or stuck busy tab; a later deliberate scan succeeds. | Not run |
| SCAN-008 | P0 | Blank/non-leaf scene; deterministic Unknown/low-confidence rig | Capture a non-leaf scene; use the rig to return Unknown, absent catalog label, invalid output index, and confidence below 0.35 individually. | Deterministic rejected outputs show not-recognized/retry state and save no history; temporary images are cleaned. Record real non-leaf predictions honestly rather than assuming every scene must score low. | Not run |
| SCAN-009 | P0 | Model-load failure rig | Reject model or label initialization; visit Scan; navigate away; restore dependency and revisit. | Model failure is visible; capture remains disabled; no endless loading; a new consumer can retry model initialization after previous consumers leave. | Not run |
| SCAN-010 | P0 | Fault rig | Reject takePhoto, then inference/preprocessing in separate runs; dismiss each error; restore the rig and scan again. | Recoverable failure state appears; processing lock and generated images are released; no unhandled rejection; a fresh scan works. | Not run |
| SCAN-011 | P0 | Successful recognition; scan-directory/copy/history-save failure rig | Trigger each storage failure separately after inference; inspect result and History; dismiss and retry with storage restored. | Recognition stays readable with a save-failed message; failed saves do not produce invalid history/image records; no orphan permanent image remains; later saving recovers. | Not run |
| SCAN-012 | P1 | Success/error result sheet | After saving finishes, dismiss via close/backdrop/Android Back in separate runs; on an error tap Try Again; capture again. | Sheet closes once; camera resumes after close animation; temporary preview is removed while durable history photo remains; no dismissal-lock deadlock. | Not run |
| SCAN-013 | P0 | Slow capture/inference/storage rig | Start a scan; switch tabs during each stage separately; return after completion; initiate one new scan. | Inactive work cannot publish late results or history; temporary/staged files are cleaned; the global lock clears only after in-flight native work settles; a new scan succeeds. | Not run |
| SCAN-014 | P0 | Real device; Scan preview or in-flight scan | Press Home or lock the phone; wait; unlock/resume; repeat while analysis is running. | Camera pauses in the background; stale work does not navigate or publish unwanted results; resume yields usable preview or clear recovery, without a black/stuck camera or crash. | Not run |
| SCAN-015 | P1 | Device with flash, then without flash if available | Cycle flash Off → On → Auto → Off; capture in each supported mode; try changing flash during capture. | Label/icon tracks the mode passed to capture; control is disabled during processing; devices without flash have no unusable flash action. | Not run |
| SCAN-016 | P2 | Rear device supporting focus | Tap different preview points; wait two seconds; repeat while guide/result sheet is open; test an unsupported-focus device or failure rig. | Focus indicator appears briefly at the tapped point; only active unobstructed preview focuses; unsupported/failed focus does not crash or interfere with capture. | Not run |
| SCAN-017 | P0 | Successful scan; saved result; offline | Tap View Details after save; use Back; restart the app offline; make another scan; repeat after several tab transitions. | Details open only after the sheet closes and only while Scan remains active; history image survives restart; model/camera remain usable across repeated offline sessions. | Not run |

## History — 10 cases

| ID | Priority | Setup | Exact steps | Expected outcome | Device execution |
| --- | --- | --- | --- | --- | --- |
| HIST-001 | P1 | Clean history | Open History; switch All/Favorites; switch list/grid. | Empty states are understandable in both tabs/layouts; controls remain usable; no missing-data crash. | Not run |
| HIST-002 | P1 | Backup B imported into disposable environment | Compare Newest and Oldest ordering; restart in the chosen order. | Ordering follows timestamps, not array insertion order; newer/older fixture appears first as appropriate; preference persists. | Not run |
| HIST-003 | P1 | At least two scans; one favorited | Toggle a history heart; switch Favorites/All; compare count badges and Home statistics; inspect the corresponding library plant favorite. | Favorite scan tab/count updates immediately and persists; history favorites and saved library plants remain separate features. | Not run |
| HIST-004 | P1 | Several scans including odd count | Switch list/grid repeatedly; scroll; open the final item. | Same scan records remain accessible in both layouts; the final single grid card is present; no lost record/column-layout crash. | Not run |
| HIST-005 | P1 | History with multiple records | Long-press one record; tap another to select; tap each again to deselect; repeat and tap selection Cancel. | Selected count/appearance are correct; selected taps do not open a detail sheet; zero selections or Cancel exits selection cleanly. | Not run |
| HIST-006 | P0 | History with multiple records | Request single deletion using swipe/detail action; cancel; select multiple; request batch deletion; cancel. | Both confirmations name/count the intended targets; no scan/image changes before confirm; cancel retains records and an intentional selection can still be retried. | Not run |
| HIST-007 | P0 | Baseline backup retained | Confirm deletion of one record; inspect counts/other records; restart; repeat with two selected records and rapidly tap Confirm. | Only confirmed targets and their images disappear; remaining data survives; one deletion task runs while busy; modal dismissal/cancel cannot interrupt an active delete. | Not run |
| HIST-008 | P0 | Fault rig; one selected image cannot be deleted | Select two scans; confirm deletion with one native delete rejection; restore I/O; retry the remaining selection. | Successful target disappears; failed record/image remains; clear failure is shown; only failed IDs remain selected; retry succeeds without reselecting or deleting unrelated scans. | Not run |
| HIST-009 | P1 | Scan with saved photo | Open its detail sheet; inspect name/confidence/date; enlarge the captured/reference image; close viewer, then sheet using close and Android Back separately. | Correct record data appears; images are viewable; Back dismisses the topmost layer; main History navigation remains usable; favorites reflect store changes. | Not run |
| HIST-010 | P1 | English Mango scan, then Tagalog; repeat reverse direction | Switch language after scanning/importing; open the old scan; inspect reference image and View in Library; tap it. | Stable plant ID resolves the same catalog plant despite renamed `Mango`/`Mangga`; translated reference/details remain available; no incorrect-name match or missing link. | Not run |

## Profile, settings and credits — 10 cases

| ID | Priority | Setup | Exact steps | Expected outcome | Device execution |
| --- | --- | --- | --- | --- | --- |
| PROF-001 | P1 | Profile | Open Edit Profile; enter first name `  Ana  ` and blank last name; save; return Home; restart. | Leading/trailing spaces are trimmed; optional last name can be empty; profile and Home greeting update and persist. | Not run |
| PROF-002 | P1 | Profile editor | Open without changes; inspect Save; enter spaces as first name; enter 31 characters in each field; restore a valid first name. | Unchanged/blank first name disables Save and blank name shows validation; inputs cap at 30 characters; valid changed data enables Save. | Not run |
| PROF-003 | P1 | Profile editor | Change both fields; dismiss through the sheet close/back action; reopen. | Cancellation does not update persisted names; reopening uses the saved values rather than the abandoned draft. | Not run |
| PROF-004 | P1 | Photo permission available; own test image | Tap avatar edit; grant media access; choose and crop a square image; confirm; restart. | App copies the chosen image to app-owned local storage; success is visible; avatar remains available after process restart and source-picker closure. | Not run |
| PROF-005 | P1 | Existing custom avatar | Deny media permission; retry and cancel the picker; retry with no usable selected asset in the rig. | Permission explanation or quiet cancel as appropriate; old avatar remains intact; no copy or misleading success alert; later retry is possible. | Not run |
| PROF-006 | P0 | Existing custom avatar; fault rig | Reject permission request, picker launch, directory creation and image copy in separate runs; restore after each and retry. | Every rejection produces controlled recovery; no unhandled event-handler rejection; existing avatar survives; subsequent editing works. | Not run |
| PROF-007 | P1 | Slow native picker/permission rig | Tap avatar edit rapidly while permission/picker remains pending; cancel; tap edit again. | Only one request/picker opens; guard releases after cancel/failure/success; later edit is not permanently blocked. | Not run |
| PROF-008 | P0 | Seeded; English | Open Language; choose English again; reopen and choose Tagalog; browse Home/Library/details/History/Scan; restart; switch back. | Current option is checked; unchanged choice closes; changed selection persists and updates UI/catalog/filter labels without losing stable favorite/history IDs. | Not run |
| PROF-009 | P0 | Seeded; external baseline backup retained | Open Reset Profile; cancel and inspect data; reopen and confirm; inspect history/favorites/language/onboarding. | Cancel changes nothing; confirm restores default Plant Explorer name and clears avatar; history, library favorites, language and onboarding completion are retained. | Not run |
| PROF-010 | P2 | Profile; online then offline | Open Photo Credits; scroll to the last entry; open a source/license link online; return; repeat offline and dismiss. | Name/species/artist/license and crop note are visible as applicable; external links open supported browser; failure to open offline does not crash or trap the app. | Not run |

## Backup export/import and data integrity — 15 cases

| ID | Priority | Setup | Exact steps | Expected outcome | Device execution |
| --- | --- | --- | --- | --- | --- |
| DATA-001 | P0 | Seeded; own images/avatar; local share target | Export Backup; save JSON outside app storage; inspect profile, scan notes/timestamps/confidence/favorites and embedded image fields; restore into a disposable empty app. | Version-1 JSON is usable; image/avatar bytes and metadata round-trip; local files are restored under app-owned unique names; all restored records can be opened. | Not run |
| DATA-002 | P1 | Missing/unreadable-image rig; otherwise valid records | Export with one missing scan photo and missing avatar; import into a disposable app; open both scans. | Readable metadata is retained; missing image data is omitted gracefully; image-less scan records do not create empty bogus image files or crash detail views. | Not run |
| DATA-003 | P1 | Normal share sheet, then unavailable-sharing rig | Start export and cancel sharing; repeat with Sharing unavailable; retry when available. | Cancel retains app data and releases busy state; unavailable sharing shows a clear message; another export is possible. | Not run |
| DATA-004 | P1 | Profile; document picker | Tap Import Backup; cancel the picker; repeat and back out before choosing a document. | No preview/app mutation occurs; busy indicator does not remain; import/export controls still work. | Not run |
| DATA-005 | P0 | Seeded; Backup B | Select B; verify preview counts/profile name; tap Cancel. | Preview reports two incoming scans, QA Tester and two favorite IDs; preview/cancel writes no profile/history/favorite/image data. | Not run |
| DATA-006 | P0 | Malformed JSON and version-2 variants | Import each separately; dismiss error; then select valid B. | Malformed/unsupported files show actionable errors without mutation; version incompatibility is identified; a valid file can still be previewed afterward. | Not run |
| DATA-007 | P0 | Schema variants | Import missing scans, confidence 1.1, invalid date and unsafe `../escape` scan-ID variants individually. | Every malformed structure is rejected before any local image/record write; no path escapes app storage; existing data remains intact. | Not run |
| DATA-008 | P0 | Exact-limit and over-limit fixtures; size/read failure rig | Select over-limit file; select exact-limit file and cancel after preview; separately inject missing/negative/nonfinite size, directory selection and read rejection. | More than 25 MiB is rejected; valid exact-limit metadata/content can preview if memory permits; unavailable/invalid metadata/read errors are reported; no partial import is exposed. | Not run |
| DATA-009 | P0 | Seeded; B contains an existing ID and one new ID | Select B; choose Merge (Add); inspect existing profile/avatar, history and favorites. | Existing scan and image win on conflicting ID; only new IDs are added; current profile/avatar remain; favorite IDs are unioned with catalog resolution. | Not run |
| DATA-010 | P0 | B with duplicate incoming IDs/unknown favorite; seeded app | Merge once; merge the same file again; count records and inspect the conflicting image/metadata. | One record per ID; first valid incoming record wins within a duplicate list; repeated merge is idempotent; unknown favorite IDs do not become invalid plant cards. | Not run |
| DATA-011 | P0 | Seeded; B | Choose Replace (Overwrite) at preview; cancel the second destructive confirmation; inspect all baseline data. | The explicit second confirmation appears; cancel retains all data and releases import busy state. | Not run |
| DATA-012 | P0 | Seeded with avatar; baseline protected; B without avatar/favorites variant | Confirm Replace with B; inspect names, scans and avatar; repeat with empty favorites. | History/profile are replaced; absent backup avatar clears old avatar; favorite replacement can be empty; old app-owned obsolete images are removed without deleting unrelated files. | Not run |
| DATA-013 | P0 | Seeded; backup with images; fault rig | Reject image staging, avatar staging and favorite persistence in separate Replace runs; inspect baseline stores/files; restore I/O and retry. | Failed preparation leaves prior profile/history/favorites intact; staged files are cleaned; no partly applied replacement is presented as complete; retry is possible. | Not run |
| DATA-014 | P0 | Successful Merge and successful Replace runs | Restart after each import; browse scans/images/profile/favorites; change language; export again. | Imported records/preferences survive hydration and language changes; restored file URIs remain readable; new export represents the current durable state. | Not run |
| DATA-015 | P0 | Seeded; export-write failure rig; low-storage device | Force export's final JSON write to fail; dismiss error; inspect all app records; free test storage and export again. | Export failure is visible and clears busy UI; saved data is not cleared; successful retry produces a valid backup. | Not run |

## Themes, accessibility, offline and lifecycle — 10 cases

| ID | Priority | Setup | Exact steps | Expected outcome | Device execution |
| --- | --- | --- | --- | --- | --- |
| SYS-001 | P1 | EN/TL; light/dark combinations | Toggle theme from Home; visit all tabs, detail/comparison, guides and confirmation sheets; compare status/navigation bars. | Semantic surfaces/text/icons follow the theme consistently; over-image controls and danger actions remain legible; no unthemed white error screen. | Not run |
| SYS-002 | P1 | Largest supported Android font/display size | Open onboarding, Profile editor, Library, comparison and scan result; scroll and use keyboard; inspect long English/Tagalog labels. | Content and actions remain reachable; essential labels/value fields are not clipped beyond comprehension; no overlap prevents Save/Cancel/Capture/navigation. | Not run |
| SYS-003 | P1 | TalkBack enabled | Traverse tabs, search, filters, detail tabs, favorite buttons, scan controls, language radios and delete confirmation; activate each using TalkBack. | Controls have meaningful labels/roles and selected/disabled states; focus order is sensible; hidden dashboard/result layers do not receive focus; modal dismissal and recovery are reachable. Record missing labels as defects. | Not run |
| SYS-004 | P2 | Android reduced-motion setting enabled | Replay onboarding; change tabs; press cards; open/close app and scan sheets; perform a scan. | Reduced-motion-aware transitions remain usable; no feature relies on animation completion for input forever; any remaining large animation is recorded for accessibility review. | Not run |
| SYS-005 | P1 | Small phone and large/tablet viewport; keyboard; gesture/three-button nav | Browse grids; edit names; open comparison picker and scan result; inspect top/bottom controls; attempt device rotation. | Safe areas/tab bar/keyboard do not hide required actions; portrait configuration is respected; no clipped modal, unusable grid or incorrect capture viewport. | Not run |
| SYS-006 | P0 | Clean and Seeded; airplane mode before launch | Launch offline; complete onboarding; search/browse all catalog and Home sections; scan; inspect History/Profile; export/import a local file. | Bundled content, model and local workflows function without network/login; no fetch spinner blocks offline operation; external browser links may need connectivity. | Not run |
| SYS-007 | P0 | Seeded; view/sort/language set | Force-stop and reopen three times; reboot test device once; compare profile/avatar/history/scans/favorites/preferences to baseline. | Durable state survives; no default/hydration race overwrites favorites, view mode, sort or language; action functions remain usable. | Not run |
| SYS-008 | P0 | Older signed APK with legacy saved data; external backup | Record baseline; install newer APK over it with the same signing identity; launch offline; inspect migrated favorites/history/view mode/profile. | Upgrade preserves user data; old favorites formats resolve to current bundled IDs; no forced reset or stale serialized plant detail survives as the authoritative catalog. | Not run |
| SYS-009 | P0 | Disposable low-storage environment; baseline protected | Reduce free space using removable test files; attempt scan save, avatar update, export and import separately; restore space and retry. | Every failed operation recovers with truthful feedback and intact prior data; no stuck lock, duplicate request or invalid saved image; operations recover after space is restored. | Not run |
| SYS-010 | P1 | Real device; repeated-use session | Cycle Home → Library → details → comparison → Scan → History → Profile for 20 iterations; include screen lock/resume, search and several scans; inspect logs/memory. | No crash/ANR, growing duplicated listeners, stale modal, runaway temporary files or progressive slowdown; record actual timing/memory evidence rather than assuming a performance pass. | Not run |

## Completion checklist

- Link the exact APK hash and automated command results to this run.
- Record results for the required environment/language/theme combinations; explain unavailable hardware/ABI coverage.
- Attach before/after counts and image evidence for P0 data operations.
- Keep automated and physical-device results separate; list every remaining Not run/Blocked/Fail case.
- Re-run a failed scenario after its fix and the directly affected neighboring scenarios. Rebuild the APK before claiming a production fix was device-tested.
- Retain the baseline backup until upgrade/restore checks finish; remove only disposable fixture data with the tester's normal environment controls.
