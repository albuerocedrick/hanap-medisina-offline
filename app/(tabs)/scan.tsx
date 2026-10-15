import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, AppState, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View, useWindowDimensions, type GestureResponderEvent } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Camera, useCameraDevice, useCameraPermission } from "react-native-vision-camera";
import { CaptureGuide } from "@/src/components/onboarding/CaptureGuide";
import { PermissionGate } from "@/src/components/scan/PermissionGate";
import { ScanBottomSheet } from "@/src/components/scan/ScanBottomSheet";
import { ScanReticle } from "@/src/components/scan/ScanReticle";
import { scanStyles as styles } from "@/src/components/scan/scan.styles";
import { useScanController } from "@/src/hooks/useScanController";
import { useTranslation } from "@/src/i18n/useTranslation";
import { useOnboardingStore } from "@/src/store/useOnboardingStore";
import { useTheme } from "@/src/theme/useTheme";

export default function ScanScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { width, height } = useWindowDimensions();
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice("back");
  const camera = useRef<Camera>(null);
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const guideSeen = useOnboardingStore(s => s.cameraGuideSeen);
  const [showGuide, setShowGuide] = useState(false);
  const guideOpen = isFocused && (!guideSeen || showGuide);
  const [foreground, setForeground] = useState(AppState.currentState === "active");
  const [flash, setFlash] = useState<"on" | "off" | "auto">("off");
  const [cameraError, setCameraError] = useState(false);
  const [cameraGeneration, setCameraGeneration] = useState(0);
  const active = isFocused && foreground && !guideOpen && hasPermission && !!device && !cameraError;
  const scan = useScanController(camera, active, flash);
  const [focusPoint, setFocusPoint] = useState<{ x: number; y: number } | null>(null);
  const focusTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const subscription = AppState.addEventListener("change", status => setForeground(status === "active"));
    return () => {
      subscription.remove();
      if (focusTimeout.current) clearTimeout(focusTimeout.current);
    };
  }, []);
  useEffect(() => {
    if (!isFocused) {
      if (focusTimeout.current) clearTimeout(focusTimeout.current);
      setFocusPoint(null);
    }
  }, [isFocused]);

  const handleFocus = useCallback(async (event: GestureResponderEvent) => {
    if (!active || scan.sheetState !== "hidden" || !camera.current || !device?.supportsFocus) return;
    const { locationX: x, locationY: y } = event.nativeEvent;
    setFocusPoint({ x, y });
    if (focusTimeout.current) clearTimeout(focusTimeout.current);
    focusTimeout.current = setTimeout(() => setFocusPoint(null), 2000);
    try { await camera.current.focus({ x, y }); }
    catch (error) { if (__DEV__) console.warn("Camera focus failed:", error); }
  }, [active, device?.supportsFocus, scan.sheetState]);

  const closeGuide = () => {
    useOnboardingStore.getState().markCameraGuideSeen();
    setShowGuide(false);
  };
  const guide = <CaptureGuide visible={guideOpen} onClose={closeGuide} />;
  const retryCamera = () => {
    setCameraGeneration(value => value + 1);
    setCameraError(false);
    setFocusPoint(null);
  };

  const viewportWidth = Math.min(width, height * 3 / 4);
  const viewportHeight = viewportWidth * 4 / 3;
  const reticleWidth = Math.round(viewportWidth * 0.82);
  const disabled = !scan.modelReady || scan.isProcessing || scan.isDismissing || !active;
  const flashLabel = t(flash === "on" ? "scan_flash_on" : flash === "auto" ? "scan_flash_auto" : "scan_flash_off");
  return (
    <View style={[styles.screen, { backgroundColor: theme.scrimStrong }]}>
      {!hasPermission ? <PermissionGate onRequest={() => { void requestPermission(); }} /> : !device || cameraError ?
        <View style={[styles.centered, { backgroundColor: theme.bg, alignSelf: "stretch" }]}>
          <Ionicons name="camera-outline" size={34} color={theme.accent} />
          <Text accessibilityRole="alert" style={[styles.body, { color: theme.textPrimary, marginTop: 16 }]}>{t("scan_camera_unavailable")}</Text>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel={t("scan_try_again")}
            onPress={retryCamera} style={[styles.permissionButton, { backgroundColor: theme.accent }]}>
            <Text style={[styles.buttonText, { color: theme.textOnAccent }]}>{t("scan_try_again")}</Text>
          </TouchableOpacity>
        </View> : <>
      <TouchableWithoutFeedback onPress={handleFocus} accessible={false}>
        <View style={{ width: viewportWidth, height: viewportHeight, overflow: "hidden" }}>
          <Camera key={cameraGeneration} ref={camera} style={StyleSheet.absoluteFill} device={device} photo enableZoomGesture
            isActive={active && scan.sheetState === "hidden" && !scan.isDismissing}
            onError={error => { if (__DEV__) console.error("Camera failed:", error); setCameraError(true); }} />
          {focusPoint && <View pointerEvents="none" style={{ position: "absolute", left: focusPoint.x - 30,
            top: focusPoint.y - 30, width: 60, height: 60, borderWidth: 1.5, borderRadius: 8, borderColor: theme.warning }} />}
          <ScanReticle width={reticleWidth} height={Math.min(reticleWidth * 1.35, viewportHeight * 0.9)} />
        </View>
      </TouchableWithoutFeedback>
      {device.hasFlash && <TouchableOpacity accessibilityRole="button" accessibilityLabel={flashLabel}
        disabled={scan.isProcessing} onPress={() => setFlash(value => value === "off" ? "on" : value === "on" ? "auto" : "off")}
        style={[styles.flashButton, { top: insets.top + 12, backgroundColor: theme.scrimStrong }]}>
        <Ionicons name={flash === "off" ? "flash-off" : "flash"} size={16} color={flash === "on" ? theme.warning : theme.onImage} />
        <Text style={[styles.helpText, { color: theme.onImage }]}>{flashLabel}</Text>
      </TouchableOpacity>}
      {scan.sheetState === "hidden" && !scan.isDismissing && <>
        <View pointerEvents="box-none" style={{ position: "absolute", bottom: Math.max(insets.bottom, 12) + 76, left: 20, right: 20, alignItems: "center" }}>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel={t("capture_photo")}
            accessibilityState={{ disabled, busy: scan.isProcessing || scan.loading }} disabled={disabled} onPress={scan.capture}
            activeOpacity={0.8} style={[styles.captureButton, { backgroundColor: theme.accent,
              borderColor: theme.border, opacity: disabled ? 0.55 : 1 }]}>
            {scan.isProcessing || scan.loading ? <ActivityIndicator size="small" color={theme.textOnAccent} />
              : <Ionicons name="camera-outline" size={24} color={theme.textOnAccent} />}
            <Text style={[styles.captureText, { color: theme.textOnAccent }]}>{t("capture_photo")}</Text>
          </TouchableOpacity>
          {scan.modelError && (
            <View style={{ alignItems: "center", marginTop: 8 }}>
              <Text accessibilityRole="alert" style={[styles.hint, { color: theme.onImage, backgroundColor: theme.scrimStrong, padding: 8, borderRadius: 8 }]}>
                {t("scan_model_error")}
              </Text>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={t("scan_retry_model")}
                onPress={scan.retryModel}
                style={{ marginTop: 6, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, backgroundColor: theme.accent, flexDirection: "row", alignItems: "center" }}
              >
                <Ionicons name="refresh-outline" size={15} color={theme.textOnAccent} style={{ marginRight: 6 }} />
                <Text style={{ color: theme.textOnAccent, fontWeight: "600", fontSize: 13 }}>
                  {t("scan_retry_model")}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={t("capture_help")} onPress={() => setShowGuide(true)}
          style={[styles.overlayButton, { position: "absolute", right: 20, top: insets.top + 12, backgroundColor: theme.scrimStrong }]}>
          <Ionicons name="help-circle-outline" size={20} color={theme.onImage} />
          <Text style={[styles.helpText, { color: theme.onImage }]}>{t("capture_help")}</Text>
        </TouchableOpacity>
        <View pointerEvents="none" style={[styles.reminder, { bottom: Math.max(insets.bottom, 12) + 140, backgroundColor: theme.scrimStrong }]}>
          <Text style={[styles.captureText, { color: theme.onImage, fontSize: 12, textAlign: "center" }]}>{t("capture_reminder")}</Text>
          <Text style={[styles.body, { color: theme.onImage, fontSize: 12, lineHeight: 18, marginTop: 5 }]}>{t("capture_hold")}</Text>
        </View>
      </>}
      </>}
      {guide}
      {/* Keep the sheet mounted across camera/permission failures so its exit
          callback always releases the session's dismissal lock. */}
      <ScanBottomSheet sheetState={scan.sheetState} photoUri={scan.photoUri} result={scan.result} saveStatus={scan.saveStatus}
        failed={scan.failed} busy={scan.isProcessing} onDismiss={scan.dismiss} onClosed={scan.onClosed} onViewDetails={scan.viewDetails} />
    </View>
  );
}
