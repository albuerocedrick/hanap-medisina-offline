const test = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const { act } = require('react-test-renderer');
const { environment } = require('./helpers/renderApp.cjs');

async function historyWithActions() {
  const env = environment();
  let closes = 0;
  env.mocks['react-native-gesture-handler/ReanimatedSwipeable'] = {
    __esModule: true,
    default: React.forwardRef(({ children, renderRightActions, ...props }, ref) => {
      React.useImperativeHandle(ref, () => ({ close: () => { closes++; } }), []);
      return React.createElement('Swipeable', props, children,
        renderRightActions({ value: 1 }, { value: -88 }));
    }),
  };
  const store = env.load('src/store/useHistoryStore.ts').useHistoryStore;
  await store.persist.rehydrate();
  store.setState({ scans: [
    { id: 'older', plantId: 'sambong', plantName: 'Sambong', confidence: 0.8,
      imageUri: 'file:///documents/older.jpg', scannedAt: '2026-10-14T00:00:00Z', isFavorite: false },
    { id: 'newer', plantId: 'lagundi', plantName: 'Lagundi', confidence: 0.9,
      imageUri: 'file:///documents/newer.jpg', scannedAt: '2026-10-15T00:00:00Z', isFavorite: false },
  ] });
  const tree = await env.mount('app/(tabs)/history/index.tsx');
  const Delete = env.load('src/components/ui/DeleteConfirmationModal.tsx').DeleteConfirmationModal;
  const t = env.load('src/i18n/en.ts').default;
  const action = () => tree.root.findAllByType('TouchableOpacity')
    .find(node => node.props.accessibilityLabel === `${t.history_delete}: Lagundi`);
  return { tree, store, Delete, action, closes: () => closes };
}

test('history swipe follows the finger, settles promptly, and still requires confirmed deletion', async () => {
  const { tree, store, Delete, action, closes } = await historyWithActions();
  try {
    const row = tree.root.findAllByType('Swipeable')[0];
    assert.equal(row.props.friction, 1, 'do not make a swipe lag behind the finger');
    assert.ok(row.props.animationOptions.duration <= 250, 'override the native one-second settling default');
    assert.equal(row.props.animationOptions.dampingRatio, 1);
    assert.equal(row.props.overshootRight, false);
    assert.equal(store.getState().scans.length, 2, 'revealing an action must not delete a scan');
    await act(async () => action().props.onPress());
    assert.equal(closes(), 1);
    assert.equal(tree.root.findByType(Delete).props.visible, true);
    assert.equal(store.getState().scans.length, 2, 'a tap requests confirmation before any removal');
    await act(async () => tree.root.findByType(Delete).props.onCancel());
    assert.equal(store.getState().scans.length, 2);
    await act(async () => action().props.onPress());
    await act(async () => tree.root.findByType(Delete).props.onConfirm());
    assert.deepEqual(store.getState().scans.map(scan => scan.id), ['older']);
  } finally { act(() => tree.unmount()); }
});

test('entering history selection closes revealed rows and prevents single-row deletion', async () => {
  const { tree, store, Delete, action, closes } = await historyWithActions();
  try {
    const card = tree.root.findAllByType('TouchableOpacity').find(node => node.props.onLongPress);
    await act(async () => card.props.onLongPress());
    assert.equal(closes(), 2, 'all mounted row actions close when multi-select starts');
    assert.ok(tree.root.findAllByType('Swipeable').every(row => row.props.enabled === false));
    assert.equal(action().props.disabled, true);
    await act(async () => action().props.onPress());
    assert.equal(tree.root.findByType(Delete).props.visible, false);
    assert.equal(store.getState().scans.length, 2);
  } finally { act(() => tree.unmount()); }
});
