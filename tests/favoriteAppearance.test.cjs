const test = require('node:test');
const assert = require('node:assert/strict');
const { act } = require('react-test-renderer');
const { environment } = require('./helpers/renderApp.cjs');

const flattenStyle = style => Array.isArray(style)
  ? Object.assign({}, ...style.filter(Boolean).map(flattenStyle))
  : style ?? {};

for (const mode of ['light', 'dark']) {
  test(`${mode} photo favorite controls use transparent blur and keep a visible saved state`, async () => {
    const env = environment();
    const tokens = env.load('src/theme/tokens.ts');
    const theme = { ...(mode === 'dark' ? tokens.darkTheme : tokens.lightTheme), isDark: mode === 'dark' };
    env.mocks['@/src/theme/useTheme'] = { useTheme: () => theme };
    const store = env.load('src/store/useLibraryStore.ts').useLibraryStore;
    await store.getState().loadFavorites();
    const plant = store.getState().plants.find(plant => plant.id === 'litlit');
    const t = env.load('src/i18n/en.ts').default;
    env.state.params = { id: plant.id };
    const trees = [
      await env.mount('app/(tabs)/library/[id].tsx'),
      await env.mount('src/components/library/plant-grid-card.tsx', { plant }),
    ];
    const favorite = tree => tree.root.findAllByType('TouchableOpacity')
      .find(node => [t.a11y_add_favorite, t.a11y_remove_favorite].includes(node.props.accessibilityLabel));
    try {
      for (const tree of trees) {
        const control = favorite(tree);
        const style = flattenStyle(control.props.style);
        assert.equal(style.backgroundColor, 'transparent', 'the heart must not have a solid white surface');
        assert.equal(style.overflow, 'hidden', 'clip the blur to the circular button');
        assert.equal(style.width, style.height);
        assert.equal(style.borderRadius, style.width / 2);
        assert.equal(style.borderColor, theme.imageBorder);
        const blur = control.findByType('BlurView');
        assert.equal(blur.props.pointerEvents, 'none', 'the blur must not intercept favorite taps');
        assert.equal(blur.props.experimentalBlurMethod, 'dimezisBlurView', 'enable native blur on Android');
        assert.equal(blur.props.tint, 'default', 'keep the glass tint neutral');
        assert.ok(blur.props.intensity > 0 && blur.props.intensity < 50, 'keep the plant image visible through a light blur');
        assert.equal(control.findByType('Ionicons').props.color, theme.onImage);
      }
      // The favorite stays reachable in the fixed header while details scroll.
      const heroFavorite = favorite(trees[0]);
      let ancestor = heroFavorite.parent;
      while (ancestor && ancestor.type !== 'ScrollView') ancestor = ancestor.parent;
      assert.equal(ancestor, null, 'the heart must stay outside scrolling content');
      assert.equal(heroFavorite.parent.props.style.position, 'absolute');
      assert.equal(heroFavorite.props.style.top, 0);
      assert.equal(heroFavorite.props.style.right, 0);
      await act(async () => favorite(trees[0]).props.onPress());
      for (const tree of trees) {
        const control = favorite(tree);
        assert.equal(control.props.accessibilityState.selected, true);
        assert.equal(control.findByType('Ionicons').props.name, 'heart');
        assert.equal(control.findByType('Ionicons').props.color, theme.danger);
      }
      await act(async () => favorite(trees[1]).props.onPress());
      assert.equal(store.getState().isFavorite(plant.id), false);
      for (const tree of trees) {
        const control = favorite(tree);
        assert.equal(control.props.accessibilityState.selected, false);
        assert.equal(control.findByType('Ionicons').props.name, 'heart-outline');
        assert.equal(control.findByType('Ionicons').props.color, theme.onImage);
      }
    } finally {
      act(() => trees.forEach(tree => tree.unmount()));
    }
  });
}
