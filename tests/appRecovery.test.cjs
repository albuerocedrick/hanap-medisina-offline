const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const React = require("react");
const { act, create } = require("react-test-renderer");

function load(filename, mocks) {
  const source = ts.transpileModule(fs.readFileSync(path.resolve(__dirname, "..", filename), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const module = { exports: {} };
  new Function("require", "module", "exports", "__DEV__", source)(name => {
    if (Object.hasOwn(mocks, name)) return mocks[name];
    return require(name);
  }, module, module.exports, false);
  return module.exports;
}

const native = { View: "View", Text: "Text", Pressable: "Pressable", StyleSheet: { create: value => value } };
let recoverySplashHidden = 0;
const boundary = load("src/components/ui/AppErrorBoundary.tsx", {
  "expo-splash-screen": { hideAsync: async () => { recoverySplashHidden++; } },
  "react-native": native,
  "@/src/theme/useTheme": { useTheme: () => ({}) },
  "@/src/i18n/useTranslation": { useTranslation: () => ({ t: key => key }) },
});

test("render errors show a recoverable fallback and retry remounts the content", () => {
  let shouldFail = true;
  function Screen() {
    if (shouldFail) throw new Error("failed screen");
    return React.createElement("Ready");
  }
  const originalError = console.error;
  console.error = () => {};
  let tree;
  try {
    act(() => { tree = create(React.createElement(boundary.AppErrorBoundary, null, React.createElement(Screen))); });
    assert.equal(tree.root.findByType("Pressable").props.accessibilityRole, "button");
    assert.equal(tree.root.findAllByType("Text")[0].props.children, "app_error_title");
    assert.equal(recoverySplashHidden, 1, "startup errors must reveal recovery even before fonts finish loading");
    shouldFail = false;
    act(() => tree.root.findByType("Pressable").props.onPress());
    assert.equal(tree.root.findAllByType("Ready").length, 1);
  } finally {
    console.error = originalError;
    act(() => tree?.unmount());
  }
});

test("a failed font load renders the app and releases language subscriptions on unmount", async () => {
  let splashHidden = 0;
  let subscriptions = 0;
  let unsubscriptions = 0;
  let favoritesLoaded = 0;
  let fontResult = [false, null];
  const onboarding = Object.assign(selector => selector({ completed: true }), {
    persist: { hasHydrated: () => true, onFinishHydration: () => () => {} },
  });
  const Stack = Object.assign(({ children }) => React.createElement("Stack", null, children), { Screen: () => null });
  const { default: RootLayout } = load("app/_layout.tsx", {
    "expo-font": { useFonts: () => fontResult },
    "react-native-gesture-handler": { GestureHandlerRootView: "GestureRoot" },
    "expo-router": { Stack },
    "expo-splash-screen": { preventAutoHideAsync: async () => {}, hideAsync: async () => { splashHidden++; } },
    "@/src/components/onboarding/Onboarding": { Onboarding: () => null },
    "@/src/store/useOnboardingStore": { useOnboardingStore: onboarding },
    "@/src/components/ui/AppErrorBoundary": boundary,
    "@/src/store/dataLanguageSync": { initializeDataLanguageSync: () => { subscriptions++; return () => { unsubscriptions++; }; } },
    "@/src/store/useLibraryStore": { useLibraryStore: { getState: () => ({ loadFavorites: async () => { favoritesLoaded++; } }) } },
    "@expo-google-fonts/quicksand": {},
    "../global.css": {},
  });
  let tree;
  await act(async () => { tree = create(React.createElement(RootLayout)); });
  assert.equal(tree.toJSON(), null);
  fontResult = [false, new Error("font asset failed")];
  await act(async () => { tree.update(React.createElement(RootLayout)); });
  assert.equal(tree.root.findAllByType("Stack").length, 1);
  assert.equal(splashHidden, 1);
  assert.equal(subscriptions, 1);
  assert.equal(favoritesLoaded, 1);
  act(() => tree.unmount());
  assert.equal(unsubscriptions, 1);
});
