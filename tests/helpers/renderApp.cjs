const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const { randomUUID } = require('node:crypto');
const ts = require('typescript');
const React = require('react');
const { act, create } = require('react-test-renderer');

/**
 * JS workflow harness: real TSX components, bundled catalog and Zustand stores.
 * Native rendering, animation, sheets, filesystem, camera roll and navigation are
 * explicit substitutes. This does not exercise Android layout, gestures or APIs.
 */
exports.environment = function environment() {
  const modules = new Map();
  const memory = new Map();
  const state = {
    params: {}, routes: [], replacements: [], canGoBack: false, alerts: [], copies: [], deletions: [], failedDeletes: new Set(),
    permission: 'granted', picker: { canceled: true, assets: [] },
    permissionError: null, pickerError: null, copyError: null, hapticsError: null,
    permissionCalls: 0, pickerCalls: 0, haptics: 0, keyboardDismisses: 0,
  };
  const animation = {};
  for (const name of ['duration', 'springify', 'damping', 'delay']) animation[name] = () => animation;
  const animated = { View: 'AnimatedView', createAnimatedComponent: value => value };
  const Sheet = ({ visible, children, ...props }) => visible ? React.createElement('Sheet', props, children) : null;
  const Slot = type => props => React.createElement(type, props, props.children);
  const Image = Object.assign(React.forwardRef((props, ref) => React.createElement('Image', { ...props, ref })), {
    resolveAssetSource: asset => ({ uri: `asset://${asset}` }),
  });
  function FlatList(props) {
    const renderSlot = component => typeof component === 'function' ? React.createElement(component) : component;
    return React.createElement('FlatList', props,
      renderSlot(props.ListHeaderComponent),
      props.data.length ? props.data.map((item, index) => React.createElement(React.Fragment,
        { key: props.keyExtractor ? props.keyExtractor(item, index) : index }, props.renderItem({ item, index })))
        : renderSlot(props.ListEmptyComponent));
  }
  const native = {
    View: 'View', Text: 'Text', Pressable: 'Pressable', TouchableOpacity: 'TouchableOpacity',
    ScrollView: 'ScrollView', TextInput: 'TextInput', StatusBar: 'StatusBar', ActivityIndicator: 'ActivityIndicator',
    Image, FlatList, RefreshControl: 'RefreshControl',
    StyleSheet: { create: value => value, hairlineWidth: 1, absoluteFill: {} },
    Keyboard: { dismiss: () => { state.keyboardDismisses++; } },
    Alert: { alert: (...args) => { state.alerts.push(args); } },
    Dimensions: { get: () => ({ width: 390, height: 844 }) },
    Platform: { OS: 'android', select: options => options.android ?? options.default },
    useWindowDimensions: () => ({ width: 390, height: 844, fontScale: 1 }),
  };
  const mocks = {
    'react-native': native,
    '@react-native-async-storage/async-storage': {
      getItem: async key => memory.get(key) ?? null,
      setItem: async (key, value) => { memory.set(key, value); },
      removeItem: async key => { memory.delete(key); },
    },
    'expo-file-system': {
      documentDirectory: 'file:///documents/', cacheDirectory: 'file:///cache/',
      getInfoAsync: async () => ({ exists: true }), makeDirectoryAsync: async () => {},
      copyAsync: async options => { state.copies.push(options); if (state.copyError) throw state.copyError; },
      deleteAsync: async uri => { state.deletions.push(uri); if (state.failedDeletes.has(uri)) throw new Error('delete failed'); },
    },
    'expo-image-picker': {
      MediaTypeOptions: { Images: 'images' },
      requestMediaLibraryPermissionsAsync: async () => {
        state.permissionCalls++;
        if (state.permissionError) throw state.permissionError;
        return { status: state.permission };
      },
      launchImageLibraryAsync: async () => {
        state.pickerCalls++;
        if (state.pickerError) throw state.pickerError;
        return state.picker;
      },
    },
    'expo-haptics': {
      ImpactFeedbackStyle: { Light: 'light' }, NotificationFeedbackType: { Warning: 'warning' },
      impactAsync: async () => { state.haptics++; if (state.hapticsError) throw state.hapticsError; },
      notificationAsync: async () => {},
      selectionAsync: async () => {},
    },
    'expo-crypto': { randomUUID },
    'expo-router': { Stack: { Screen: 'StackScreen' }, useLocalSearchParams: () => state.params,
      useRouter: () => ({ push: route => state.routes.push(route), back: () => state.routes.push('back'),
        canGoBack: () => state.canGoBack, replace: route => state.replacements.push(route) }) },
    'expo-linear-gradient': { LinearGradient: 'LinearGradient' },
    '@expo/vector-icons': { Ionicons: 'Ionicons', Feather: 'Feather' },
    'lucide-react-native': { ArrowLeft: 'ArrowLeft', Check: 'Check' },
    'react-native-safe-area-context': { SafeAreaView: 'SafeAreaView', useSafeAreaInsets: () => ({ top: 24, bottom: 0, left: 0, right: 0 }) },
    'react-native-reanimated': {
      __esModule: true, default: animated, FadeIn: animation, FadeOut: animation, FadeInDown: animation,
      useReducedMotion: () => true, useSharedValue: value => ({ value }), useAnimatedStyle: factory => factory(),
      withSpring: value => value, interpolate: value => value, Extrapolation: { CLAMP: 'clamp' },
    },
    'react-native-gesture-handler/ReanimatedSwipeable': {
      __esModule: true, default: React.forwardRef(({ children, ...props }, ref) => React.createElement('Swipeable', { ...props, ref }, children)),
    },
    '@/src/theme/useTheme': { useTheme: () => ({ isDark: false }) },
    '@/src/components/ui/AppSheet': { AppSheet: Sheet, SheetProvider: Slot('SheetProvider') },
    '@/src/components/ui/PageTransition': { PageTransition: Slot('PageTransition') },
    '@/src/components/history/scan-detail-sheet': { ScanDetailSheet: Slot('ScanDetailSheet') },
    '@/src/components/profile/export-import-section': { ExportImportSection: Slot('ExportImportSection') },
    '@/src/components/profile/PhotoCreditsSheet': { PhotoCreditsSheet: Slot('PhotoCreditsSheet') },
  };
  function resolveFile(candidate) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
    return ['.ts', '.tsx', '/index.ts', '/index.tsx'].map(suffix => candidate + suffix).find(filename => fs.existsSync(filename))
      ?? candidate;
  }
  function load(filename) {
    filename = resolveFile(path.resolve(__dirname, '../..', filename));
    if (modules.has(filename)) return modules.get(filename).exports;
    const module = { exports: {} };
    modules.set(filename, module);
    const normalRequire = createRequire(filename);
    const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    }).outputText;
    function requireMock(name) {
      if (Object.hasOwn(mocks, name)) return mocks[name];
      if (/\.(jpg|png)$/.test(name)) return name;
      if (name.startsWith('@/') || name.startsWith('.')) {
        const candidate = name.startsWith('@/') ? path.resolve(__dirname, '../..', name.slice(2)) : path.resolve(path.dirname(filename), name);
        if (candidate.endsWith('.json')) return normalRequire(candidate);
        const mockKey = '@/'+path.relative(path.resolve(__dirname, '../..'), candidate).replaceAll('\\', '/');
        if (Object.hasOwn(mocks, mockKey)) return mocks[mockKey];
        return load(candidate);
      }
      return normalRequire(name);
    }
    new Function('require', 'module', 'exports', '__DEV__', source)(requireMock, module, module.exports, false);
    return module.exports;
  }
  async function mount(filename, props = {}) {
    const exported = load(filename);
    const Component = exported.default ?? exported[path.basename(filename).replace(/\.tsx?$/, '')]
      ?? Object.values(exported).find(value => typeof value === 'function');
    let tree;
    await act(async () => {
      tree = create(React.createElement(Component, props), { createNodeMock: node => ({
        focus: () => node.props.onFocus?.(), blur: () => node.props.onBlur?.(), scrollTo: () => {}, close: () => {},
      }) });
    });
    return tree;
  }
  return { state, memory, mocks, load, mount };
};
