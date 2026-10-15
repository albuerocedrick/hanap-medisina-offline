import * as FileSystem from "expo-file-system";
import { randomUUID } from "expo-crypto";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { Alert } from "react-native";
import type { Camera } from "react-native-vision-camera";
import { useTranslation } from "@/src/i18n/useTranslation";
import { ScanSession } from "@/src/lib/scanSession";
import { getAllPlants } from "@/src/services/localLibrary";
import { getPlantIdForModelLabel } from "@/src/services/modelLabels";
import { useCameraStore } from "@/src/store/useCameraStore";
import { useHistoryStore } from "@/src/store/useHistoryStore";
import { useScanInference } from "@/src/hooks/useScanInference";
import { useTFLite } from "@/src/hooks/useTFLite";

export type SheetState = "hidden" | "loading" | "success" | "error";
export type ScanResult = { plantId: string; label: string; confidence: number };

export function useScanController(camera: RefObject<Camera>, active: boolean, flash: "on" | "off" | "auto") {
  const router = useRouter();
  const { t } = useTranslation();
  const { model, labels, loading, error: modelError, retry: retryModel } = useTFLite();
  const infer = useScanInference(model);
  const captureTrigger = useCameraStore(s => s.captureTrigger);
  const setIsProcessing = useCameraStore(s => s.setIsProcessing);
  const isProcessing = useCameraStore(s => s.isProcessing);
  const addScan = useHistoryStore(s => s.addScan);
  const session = useRef(new ScanSession()).current;
  const mounted = useRef(true);
  const activeRef = useRef(active);
  activeRef.current = active;
  const [sheetState, setSheetState] = useState<SheetState>("hidden");
  const [isDismissing, setIsDismissing] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const temporaryPhoto = useRef<string | null>(null);
  const pendingDetails = useRef<string | null>(null);

  const deletePreview = useCallback(() => {
    const uri = temporaryPhoto.current;
    temporaryPhoto.current = null;
    if (uri) void FileSystem.deleteAsync(uri, { idempotent: true }).catch(error => {
      if (__DEV__) console.warn("Could not delete scan preview:", error);
    });
  }, []);

  const onClosed = useCallback(() => {
    session.finishClosing();
    deletePreview();
    if (!mounted.current) return;
    setIsDismissing(false);
    setPhotoUri(null);
    setResult(null);
    setSaveStatus(null);
    const id = pendingDetails.current;
    pendingDetails.current = null;
    if (id && activeRef.current) router.push(`/(tabs)/library/${id}`);
  }, [deletePreview, router, session]);

  const dismiss = useCallback(() => {
    // Storage is part of the capture operation; keep its preview alive until done.
    if (useCameraStore.getState().isProcessing) return;
    if (session.closeSheet()) {
      setIsDismissing(true);
      setSheetState("hidden");
    }
  }, [session]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      session.invalidate();
      deletePreview();
      setIsProcessing(false);
    };
  }, [deletePreview, session, setIsProcessing]);

  useEffect(() => {
    if (!active) {
      session.invalidate();
      pendingDetails.current = null;
      if (session.closeSheet()) {
        setIsDismissing(true);
        setSheetState("hidden");
      }
    }
  }, [active, session]);

  const capture = useCallback(async () => {
    if (!activeRef.current || !camera.current || !model || labels.length === 0) return;
    const token = session.start();
    if (token === null) return;
    const current = () => mounted.current && activeRef.current && session.isCurrent(token);
    let localUri: string | null = null;
    let permanentUri: string | null = null;
    try {
      setIsProcessing(true);
      setFailed(false);
      setResult(null);
      setSaveStatus(null);
      // Do not race an uncancellable capture against a timer: a late completion
      // must keep the capture lock until native capture has actually settled.
      const photo = await camera.current.takePhoto({ flash });
      localUri = photo.path.startsWith("file://") ? photo.path : `file://${photo.path}`;
      if (!current()) return;
      temporaryPhoto.current = localUri;
      setPhotoUri(localUri);
      session.openSheet();
      setSheetState("loading");
      const { index, confidence } = await infer(localUri);
      if (!current()) return;
      const plantId = getPlantIdForModelLabel(labels[index] ?? "");
      const plant = plantId ? getAllPlants().find(p => p.id === plantId) : undefined;
      if (!plant || confidence < 0.35) {
        setSheetState("error");
        return;
      }
      setResult({ plantId: plant.id, label: plant.name, confidence });
      setSheetState("success");
      try {
        const docDir = FileSystem.documentDirectory;
        if (!docDir) throw new Error("Local document directory is unavailable");
        const directory = `${docDir}scans`;
        await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
        const uniqueName = randomUUID();
        permanentUri = `${directory}/capture_${uniqueName}.jpg`;
        await FileSystem.copyAsync({ from: localUri, to: permanentUri });
        if (!current()) return;
        addScan({ plantName: plant.name, plantId: plant.id, confidence, imageUri: permanentUri, scannedAt: new Date().toISOString() });
        permanentUri = null; // History now owns this file.
        setSaveStatus(t("scan_saved"));
      } catch (error) {
        if (__DEV__) console.error("Could not save scan:", error);
        if (current()) setSaveStatus(t("scan_save_failed"));
      }
    } catch (error) {
      if (__DEV__) console.error("Plant inference failed:", error);
      if (current()) {
        session.openSheet();
        setFailed(true);
        setSheetState("error");
      }
    } finally {
      if (permanentUri) await FileSystem.deleteAsync(permanentUri, { idempotent: true }).catch(() => {});
      if (localUri && (!current() || temporaryPhoto.current !== localUri)) {
        await FileSystem.deleteAsync(localUri, { idempotent: true }).catch(() => {});
      }
      // Cancelled work still owns the lock until all native/worker work ends.
      session.finish();
      if (mounted.current) setIsProcessing(false);
    }
  }, [addScan, camera, flash, infer, labels, model, session, setIsProcessing, t]);

  // A changed callback must never replay an old tab-bar trigger. Read the latest
  // callback through a ref and consume each monotonically increasing trigger once.
  const latestCapture = useRef(capture);
  latestCapture.current = capture;
  const lastTrigger = useRef(captureTrigger);
  useEffect(() => {
    if (captureTrigger === lastTrigger.current) return;
    lastTrigger.current = captureTrigger;
    void latestCapture.current();
  }, [captureTrigger]);

  const viewDetails = useCallback(() => {
    if (!result || isProcessing) return;
    // Library lookup is synchronous; no dead Promise.race or navigation timer.
    if (getAllPlants().some(plant => plant.id === result.plantId)) {
      pendingDetails.current = result.plantId;
      dismiss();
    } else Alert.alert(t("scan_not_found_title"), t("scan_not_found_body"));
  }, [dismiss, isProcessing, result, t]);

  return { capture, dismiss, onClosed, viewDetails, modelReady: !!model && labels.length > 0,
    loading, modelError, retryModel: retryModel ?? (() => {}), isProcessing, isDismissing, sheetState, photoUri, result, saveStatus, failed };
}
