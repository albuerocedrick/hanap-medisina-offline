const test = require("node:test");
const assert = require("node:assert/strict");
const { addHighRefreshRate } = require("../plugins/withHighRefreshRate");

test("the prebuild plugin is idempotent and respects the current display resolution", () => {
  const kotlin = "package test\nclass MainActivity : ReactActivity() {\n}\n";
  const generated = addHighRefreshRate(kotlin);
  assert.equal(addHighRefreshRate(generated), generated);
  assert.equal(generated.match(/override fun onResume/g).length, 1);
  assert.ok(generated.includes("it.physicalWidth == currentMode.physicalWidth"));
  assert.ok(generated.includes("it.physicalHeight == currentMode.physicalHeight"));
  assert.ok(generated.includes("VERSION_CODES.M"));
});
