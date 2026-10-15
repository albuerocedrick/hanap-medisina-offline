const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const babel = require('@babel/core');
const jpeg = require('jpeg-js');

// Execute the exact serialized function sent to the background runtime. A normal
// JS invocation would hide illegal captures of functions from the React runtime.
function loadWorklets(relativePath) {
  const result = babel.transformFileSync(path.resolve(__dirname, '..', relativePath), {
    configFile: false, babelrc: false,
    plugins: ['react-native-worklets-core/plugin', '@babel/plugin-transform-typescript', '@babel/plugin-transform-modules-commonjs'],
  });
  const loaded = { exports: {} };
  new Function('module', 'exports', result.code)(loaded, loaded.exports);
  return Object.fromEntries(Object.entries(loaded.exports).map(([name, worklet]) => {
    assert.deepEqual(Object.keys(worklet.__closure), [], `${name} must have no React-runtime captures`);
    const isolated = vm.runInNewContext(`(${worklet.__initData.code})`);
    return [name, (...args) => isolated.call({ __closure: {} }, ...args)];
  }));
}

const { decodeScanJpeg } = loadWorklets('src/lib/jpegDecoder.worklet.ts');
const { makeScanInput, decodeScanBase64, bestScanOutput } = loadWorklets('src/services/scanInference.ts');

test('serialized JPEG worklet matches jpeg-js for portrait, landscape, odd dimensions, and quality levels', () => {
  for (const [width, height] of [[168, 224], [224, 168], [113, 224], [224, 223], [1, 1]]) {
    const rgba = Buffer.alloc(width * height * 4);
    for (let i = 0; i < rgba.length; i++) rgba[i] = (i * 31 + Math.floor(i / 11)) % 256;
    for (const quality of [40, 100]) {
      const encoded = jpeg.encode({ width, height, data: rgba }, quality).data;
      const bytes = decodeScanBase64(encoded.toString('base64'));
      assert.deepEqual(Buffer.from(bytes), encoded, 'background base64 decoding must preserve every JPEG byte');
      const expected = jpeg.decode(encoded, { useTArray: true });
      const actual = decodeScanJpeg(bytes);
      assert.equal(actual.width, expected.width);
      assert.equal(actual.height, expected.height);
      assert.deepEqual(Buffer.from(actual.data), Buffer.from(expected.data));
    }
  }
});

test('base64 decoding handles all final-group lengths', () => {
  for (let count = 0; count <= 10; count++) {
    const bytes = Buffer.from(Array.from({ length: count }, (_, index) => (index * 71) % 256));
    assert.deepEqual(Buffer.from(decodeScanBase64(bytes.toString('base64'))), bytes);
  }
});

test('serialized tensor worklet center-pads RGB without normalizing float values', () => {
  const pixels = new Uint8Array([0, 127, 255, 255, 255, 128, 0, 255]);
  for (const type of ['uint8', 'float32', 'int8']) {
    const input = makeScanInput(pixels, 2, 1, type);
    const offset = ((111 * 224) + 111) * 3;
    const black = type === 'int8' ? -128 : 0;
    assert.equal(input.length, 224 * 224 * 3);
    assert.equal(input[0], black);
    assert.equal(input[input.length - 1], black);
    assert.deepEqual(Array.from(input.slice(offset, offset + 6)), type === 'int8' ? [-128, -1, 127, 127, 0, -128] : [0, 127, 255, 255, 128, 0]);
    assert.equal(input[offset - 1], black);
    assert.equal(input[offset + 6], black);
  }
  assert.throws(() => makeScanInput(pixels, 225, 1, 'float32'), /dimensions/);
  assert.throws(() => makeScanInput(pixels, 2, 1, 'float16'), /input type/);
});

test('background output interpretation preserves probability thresholds and rejects corrupt output', () => {
  assert.deepEqual({ ...bestScanOutput(new Float32Array([0.2, 0.8]), 'float32') }, { index: 1, confidence: new Float32Array([0.8])[0] });
  assert.equal(bestScanOutput(new Uint8Array([0, 255]), 'uint8').confidence, 1);
  assert.equal(bestScanOutput(new Int8Array([-128, 127]), 'int8').confidence, 1);
  assert.throws(() => bestScanOutput(new Float32Array([NaN, Infinity]), 'float32'), /valid probabilities/);
  assert.throws(() => decodeScanJpeg(new Uint8Array([0, 1, 2])), /SOI/);
});

test('the inference worker captures only a native model and serialized helper worklets', () => {
  const source = fs.readFileSync(path.resolve(__dirname, '../src/hooks/useScanInference.ts'), 'utf8');
  const ast = babel.parseSync(source, { configFile: false, parserOpts: { plugins: ['typescript'] } });
  const traverse = require('@babel/traverse').default;
  let callback;
  traverse(ast, { CallExpression(nodePath) {
    if (nodePath.node.callee.name === 'useWorklet') callback = nodePath.node.arguments[1];
  } });
  assert.ok(callback);
  const generate = require('@babel/generator').default;
  const code = `const model = globalThis.model; const decodeScanJpeg = globalThis.decodeScanJpeg; const decodeScanBase64 = globalThis.decodeScanBase64; const makeScanInput = globalThis.makeScanInput; const bestScanOutput = globalThis.bestScanOutput; module.exports = ${generate(callback).code};`;
  const compiled = babel.transformSync(code, { filename: path.resolve(__dirname, '../src/hooks/useScanInference.ts'), configFile: false, babelrc: false,
    plugins: ['react-native-worklets-core/plugin', '@babel/plugin-transform-typescript'] }).code;
  const model = { inputs: [{ shape: [1, 224, 224, 3], dataType: 'float32' }], outputs: [{ dataType: 'float32' }], runSync([input]) {
    assert.equal(input.length, 224 * 224 * 3);
    return [new Float32Array([0.1, 0.9])];
  } };
  const sandbox = { module: {}, model, decodeScanJpeg, decodeScanBase64, makeScanInput, bestScanOutput };
  vm.runInNewContext(compiled, sandbox);
  const worker = sandbox.module.exports;
  assert.deepEqual(Object.keys(worker.__closure).sort(), ['bestScanOutput', 'decodeScanBase64', 'decodeScanJpeg', 'makeScanInput', 'model']);
  const run = vm.runInNewContext(`(${worker.__initData.code})`);
  const jpegBytes = jpeg.encode({ width: 2, height: 1, data: Buffer.alloc(8, 127) }, 100).data;
  assert.equal(run.call({ __closure: worker.__closure }, jpegBytes.toString('base64')).index, 1);
});
