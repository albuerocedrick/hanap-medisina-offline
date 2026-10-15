/** Match the model's 224px resize-with-pad training input. */
export function makeScanInput(data: Uint8Array, width: number, height: number, dataType: string) {
  "worklet";
  if (width < 1 || height < 1 || width > 224 || height > 224 || data.length !== width * height * 4) {
    throw new Error("Invalid resized image dimensions");
  }
  if (dataType !== "float32" && dataType !== "uint8" && dataType !== "int8") {
    throw new Error(`Unsupported model input type: ${dataType}`);
  }
  const input = dataType === "int8" ? new Int8Array(224 * 224 * 3)
    : dataType === "uint8" ? new Uint8Array(224 * 224 * 3) : new Float32Array(224 * 224 * 3);
  // Quantized black is -128 for signed input, zero for the other supported types.
  if (dataType === "int8") input.fill(-128);
  const padX = Math.floor((224 - width) / 2);
  const padY = Math.floor((224 - height) / 2);
  const offset = dataType === "int8" ? 128 : 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const source = (y * width + x) * 4;
      const target = ((y + padY) * 224 + x + padX) * 3;
      input[target] = data[source] - offset;
      input[target + 1] = data[source + 1] - offset;
      input[target + 2] = data[source + 2] - offset;
    }
  }
  return input;
}

export function decodeScanBase64(base64: string): Uint8Array {
  "worklet";
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  const data = new Uint8Array(base64.length * 3 / 4 - padding);
  let output = 0;
  for (let i = 0; i < base64.length; i += 4) {
    const a = alphabet.indexOf(base64[i]);
    const b = alphabet.indexOf(base64[i + 1]);
    const c = base64[i + 2] === "=" ? 0 : alphabet.indexOf(base64[i + 2]);
    const d = base64[i + 3] === "=" ? 0 : alphabet.indexOf(base64[i + 3]);
    if (a < 0 || b < 0 || c < 0 || d < 0) throw new Error("Invalid image base64");
    const bytes = (a << 18) | (b << 12) | (c << 6) | d;
    if (output < data.length) data[output++] = (bytes >>> 16) & 255;
    if (output < data.length) data[output++] = (bytes >>> 8) & 255;
    if (output < data.length) data[output++] = bytes & 255;
  }
  return data;
}

export function bestScanOutput(output: ArrayLike<number | bigint>, dataType: string) {
  "worklet";
  let confidence = -Number.MAX_VALUE;
  let index = -1;
  for (let i = 0; i < output.length; i++) {
    let value = Number(output[i]);
    if (dataType === "uint8") value /= 255;
    else if (dataType === "int8") value = (value + 128) / 255;
    if (Number.isFinite(value) && value > confidence) { confidence = value; index = i; }
  }
  if (index < 0) throw new Error("The model returned no valid probabilities");
  return { index, confidence };
}
