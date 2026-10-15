import * as FileSystem from "expo-file-system";
import * as ImageManipulator from "expo-image-manipulator";
import { useCallback, useMemo } from "react";
import type { TensorflowModel } from "react-native-fast-tflite";
import { Worklets, useWorklet } from "react-native-worklets-core";
import { decodeScanJpeg } from "@/src/lib/jpegDecoder.worklet";
import { bestScanOutput, decodeScanBase64, makeScanInput } from "@/src/services/scanInference";

export function useScanInference(model: TensorflowModel | null) {
  const context = useMemo(() => Worklets.createContext("PlantScanInference"), []);
  const run = useWorklet(context, (base64: string) => {
    "worklet";
    if (!model) throw new Error("Model not ready");
    const shape = model.inputs[0]?.shape;
    if (!shape || shape.length !== 4 || shape[0] !== 1 || shape[1] !== 224 || shape[2] !== 224 || shape[3] !== 3) {
      throw new Error("Unsupported model input shape");
    }
    const image = decodeScanJpeg(decodeScanBase64(base64));
    const input = makeScanInput(image.data, image.width, image.height, model.inputs[0].dataType);
    const output = model.runSync([input]);
    if (!output[0]) throw new Error("The model returned no output");
    return bestScanOutput(output[0], model.outputs[0].dataType);
  });

  return useCallback(async (uri: string) => {
    let upright: string | undefined;
    let resized: string | undefined;
    try {
      // Expo performs EXIF normalization and resize on native background queues.
      const photo = await ImageManipulator.manipulateAsync(uri, [], { format: ImageManipulator.SaveFormat.JPEG });
      upright = photo.uri;
      const scale = 224 / Math.max(photo.width, photo.height);
      const small = await ImageManipulator.manipulateAsync(photo.uri, [{ resize: {
        width: Math.max(1, Math.round(photo.width * scale)),
        height: Math.max(1, Math.round(photo.height * scale)),
      } }], { format: ImageManipulator.SaveFormat.JPEG, compress: 1, base64: true });
      resized = small.uri;
      if (!small.base64) throw new Error("Image resize failed");
      // The same still image is decoded, padded, and inferred entirely off JS.
      return await run(small.base64);
    } finally {
      await Promise.allSettled([upright, resized].filter((path): path is string => !!path && path !== uri)
        .map(path => FileSystem.deleteAsync(path, { idempotent: true })));
    }
  }, [run]);
}
