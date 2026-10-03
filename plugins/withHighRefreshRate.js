const { withMainActivity } = require("@expo/config-plugins");
const { mergeContents } = require("@expo/config-plugins/build/utils/generateCode");

// A window preference lets Android honor display and power-saving settings.
// Keep the current resolution and request an advertised rate up to 120 Hz.
const HIGH_REFRESH_CODE = `
  @Suppress("DEPRECATION")
  override fun onResume() {
    super.onResume()
    if (android.os.Build.VERSION.SDK_INT < android.os.Build.VERSION_CODES.M) return
    val currentDisplay = windowManager.defaultDisplay
    val currentMode = currentDisplay.mode
    val preferredMode = currentDisplay.supportedModes
      .filter { it.physicalWidth == currentMode.physicalWidth &&
        it.physicalHeight == currentMode.physicalHeight && it.refreshRate <= 120.5f }
      .maxByOrNull { it.refreshRate } ?: currentMode
    window.attributes = window.attributes.apply {
      preferredRefreshRate = maxOf(currentMode.refreshRate, preferredMode.refreshRate)
    }
  }
`;

function addHighRefreshRate(contents) {
  return mergeContents({
    src: contents,
    newSrc: HIGH_REFRESH_CODE,
    tag: "hanap-high-refresh-rate",
    anchor: /^class MainActivity : ReactActivity\(\) \{/,
    offset: 1,
    comment: "//",
  }).contents;
}

module.exports = function withHighRefreshRate(config) {
  return withMainActivity(config, config => {
    if (config.modResults.language !== "kt") throw new Error("High refresh support requires a Kotlin MainActivity.");
    config.modResults.contents = addHighRefreshRate(config.modResults.contents);
    return config;
  });
};
module.exports.addHighRefreshRate = addHighRefreshRate;
