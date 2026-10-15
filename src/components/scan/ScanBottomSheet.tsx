import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, Image, Modal, ScrollView, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ScanResult, SheetState } from "@/src/hooks/useScanController";
import { useTranslation } from "@/src/i18n/useTranslation";
import { useTheme } from "@/src/theme/useTheme";
import { scanStyles as styles } from "@/src/components/scan/scan.styles";

type Props = {
  sheetState: SheetState; photoUri: string | null; result: ScanResult | null;
  saveStatus: string | null; busy: boolean; failed: boolean;
  onDismiss: () => void; onClosed: () => void; onViewDetails: () => void;
};

export function ScanBottomSheet({ sheetState, photoUri, result, saveStatus, busy, failed, onDismiss, onClosed, onViewDetails }: Props) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const sheetHeight = Math.min(Math.round(height * 0.68), 660);
  const translateY = useRef(new Animated.Value(sheetHeight)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const [rendered, setRendered] = useState(sheetState !== "hidden");
  const visible = sheetState !== "hidden";
  useEffect(() => {
    if (!visible && !rendered) return;
    if (visible) setRendered(true);
    const animation = Animated.parallel([
      Animated.spring(translateY, { toValue: visible ? 0 : sheetHeight, useNativeDriver: true, damping: 30, stiffness: 300 }),
      Animated.timing(backdropOpacity, { toValue: visible ? 1 : 0, duration: visible ? 260 : 200, useNativeDriver: true }),
    ]);
    animation.start(({ finished }) => {
      if (finished && !visible) { setRendered(false); onClosed(); }
    });
    return () => animation.stop();
  }, [backdropOpacity, onClosed, sheetHeight, translateY, visible]);
  if (!rendered) return null;
  return (
    <Modal transparent visible animationType="none" onRequestClose={busy ? undefined : onDismiss} statusBarTranslucent>
      <Animated.View style={[styles.backdrop, { backgroundColor: theme.scrim, opacity: backdropOpacity }]}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={t("scan_dismiss")} disabled={busy || !visible}
          onPress={onDismiss} style={{ flex: 1 }} />
      </Animated.View>
      <Animated.View accessibilityViewIsModal style={[styles.sheet, { height: sheetHeight, backgroundColor: theme.bg,
        borderTopColor: theme.border, shadowColor: theme.shadow, transform: [{ translateY }] }]}>
        <View style={styles.handleRow}><View style={[styles.handle, { backgroundColor: theme.border }]} /></View>
        <ScrollView contentContainerStyle={[styles.sheetContent, { paddingBottom: Math.max(insets.bottom, 24) }]}>
          {photoUri && <View style={[styles.imageWrap, { height: Math.min(160, sheetHeight * 0.3), backgroundColor: theme.surfaceTint }]}>
            <Image source={{ uri: photoUri }} style={styles.previewImage} resizeMode="cover" accessible={false} />
          </View>}
          {sheetState === "loading" && <View style={styles.resultContainer} accessibilityLiveRegion="polite">
            <ActivityIndicator color={theme.accent} size="small" />
            <Text style={[styles.hint, { color: theme.textSecondary }]}>{t("scan_analyzing")}</Text>
          </View>}
          {sheetState === "success" && result && <View style={styles.resultContainer} accessibilityLiveRegion="polite">
            <Text style={[styles.overline, { color: theme.textSecondary }]}>{t("scan_identified")}</Text>
            <Text style={[styles.plantName, { color: theme.textPrimary }]}>{result.label}</Text>
            <View style={[styles.confidencePill, { borderColor: theme.border }]}>
              <View style={[styles.dot, { backgroundColor: theme.accent }]} />
              <Text style={[styles.confidenceText, { color: theme.accent }]}>{(result.confidence * 100).toFixed(2)}{t("scan_match")}</Text>
            </View>
            <View style={[styles.progressTrack, { backgroundColor: theme.accentSubtle }]}>
              <View style={[styles.progressFill, { backgroundColor: theme.accent, width: `${Math.max(0, Math.min(100, result.confidence * 100))}%` }]} />
            </View>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel={t("scan_view_details")} disabled={busy}
              accessibilityState={{ disabled: busy }} onPress={onViewDetails} activeOpacity={0.85}
              style={[styles.actionButton, { backgroundColor: theme.accent, opacity: busy ? 0.55 : 1 }]}>
              <Text style={[styles.buttonText, { color: theme.textOnAccent }]}>{t("scan_view_details")}</Text>
              <Ionicons name="arrow-forward" size={16} color={theme.textOnAccent} />
            </TouchableOpacity>
            {saveStatus && <Text accessibilityLiveRegion="polite" style={[styles.hint, { color: theme.textSecondary }]}>{saveStatus}</Text>}
          </View>}
          {sheetState === "error" && <View style={styles.resultContainer} accessibilityLiveRegion="polite">
            <Text style={[styles.errorTitle, { color: theme.textPrimary }]}>{failed ? t("error") : t("scan_not_recognized")}</Text>
            <Text style={[styles.body, { color: theme.textSecondary, marginBottom: 24 }]}>{t(failed ? "scan_failed_body" : "scan_error_body")}</Text>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel={t("scan_try_again")} onPress={onDismiss} disabled={busy}
              style={[styles.actionButton, { borderWidth: 1, borderColor: theme.border }]}>
              <Ionicons name="camera-outline" size={16} color={theme.accent} />
              <Text style={[styles.buttonText, { color: theme.accent }]}>{t("scan_try_again")}</Text>
            </TouchableOpacity>
          </View>}
          {sheetState !== "loading" && <TouchableOpacity accessibilityRole="button" accessibilityLabel={t("scan_dismiss")}
            disabled={busy} onPress={onDismiss} style={styles.closeButton}>
            <Ionicons name="close" size={22} color={theme.textSecondary} />
          </TouchableOpacity>}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}
