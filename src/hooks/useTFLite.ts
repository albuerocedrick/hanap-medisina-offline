import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system";
import { useEffect, useState } from "react";
import { loadTensorflowModel, type TensorflowModel } from "react-native-fast-tflite";

type ModelResource = { model: TensorflowModel; labels: string[] };
type ModelState = { model: TensorflowModel | null; labels: string[]; loading: boolean; error: Error | null; retry: () => void };
let sharedLoad: { promise: Promise<ModelResource>; users: number } | null = null;

async function loadResource(): Promise<ModelResource> {
  const [{ localUri }] = await Asset.loadAsync(require("../../assets/model/labels.txt"));
  if (!localUri) throw new Error("Failed to load model labels");
  const text = await FileSystem.readAsStringAsync(localUri);
  const labels = text.split(/\r?\n/).map(label => label.trim()).filter(Boolean);
  const model = await loadTensorflowModel(require("../../assets/model/medicinal_model_oct_9.tflite"));
  const shape = model.outputs[0]?.shape;
  if (labels.length !== shape?.[shape.length - 1]) {
    throw new Error("The model output does not match the bundled labels");
  }
  return { model, labels };
}

export function useTFLite(): ModelState {
  const [state, setState] = useState<{ model: TensorflowModel | null; labels: string[]; loading: boolean; error: Error | null }>({
    model: null,
    labels: [],
    loading: true,
    error: null,
  });
  const [attempt, setAttempt] = useState(0);

  const retry = () => {
    sharedLoad = null;
    setState({ model: null, labels: [], loading: true, error: null });
    setAttempt(a => a + 1);
  };

  useEffect(() => {
    let active = true;
    const resource = sharedLoad ?? { promise: loadResource(), users: 0 };
    sharedLoad = resource;
    resource.users++;
    resource.promise.then(
      value => { if (active) setState({ ...value, loading: false, error: null }); },
      cause => {
        if (sharedLoad === resource) sharedLoad = null;
        if (__DEV__) console.error("Model loading failed:", cause);
        if (active) setState({ model: null, labels: [], loading: false, error: cause instanceof Error ? cause : new Error(String(cause)) });
      },
    );
    return () => {
      active = false;
      resource.users--;
      if (resource.users === 0 && sharedLoad === resource) sharedLoad = null;
      // fast-tflite 1.6.1 exposes no dispose(). Its HostObject destructor owns
      // TfLiteInterpreterDelete; release our cached reference and let native GC
      // reclaim it after any in-flight worker has finished using the model.
    };
  }, [attempt]);
  return { ...state, retry };
}
