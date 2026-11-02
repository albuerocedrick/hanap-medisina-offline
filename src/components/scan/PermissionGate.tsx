import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Linking, Text, TouchableOpacity, View } from "react-native";
import { useTranslation } from "@/src/i18n/useTranslation";
import { useTheme } from "@/src/theme/useTheme";
import { scanStyles as styles } from "@/src/components/scan/scan.styles";

export function PermissionGate({ onRequest }: { onRequest: () => Promise<boolean> }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [denied, setDenied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const pending = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const requestAccess = async () => {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setFailed(false);
    try {
      if (denied) await Linking.openSettings();
      else {
        const granted = await onRequest();
        if (mounted.current && granted === false) setDenied(true);
      }
    } catch {
      if (mounted.current) setFailed(true);
    } finally {
      pending.current = false;
      if (mounted.current) setBusy(false);
    }
  };
  const buttonLabel = t(denied ? "scan_perm_settings_btn" : "scan_perm_btn");
  return (
    <View style={[styles.centered, { backgroundColor: theme.bg }]}>
      <View style={[styles.permissionIcon, { backgroundColor: theme.accentSubtle }]}>
        <Ionicons name="camera-outline" size={34} color={theme.accent} />
      </View>
      <Text style={[styles.permissionTitle, { color: theme.textPrimary }]}>{t("scan_perm_title")}</Text>
      <Text style={[styles.body, { color: theme.textSecondary }]}>{t(denied ? "scan_perm_settings_body" : "scan_perm_body")}</Text>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={buttonLabel} onPress={requestAccess}
        accessibilityState={{ disabled: busy, busy }} disabled={busy}
        activeOpacity={0.8} style={[styles.permissionButton, { backgroundColor: theme.accent, opacity: busy ? 0.6 : 1 }]}>
        {busy ? <ActivityIndicator size="small" color={theme.textOnAccent} />
          : <Ionicons name={denied ? "settings-outline" : "camera"} size={16} color={theme.textOnAccent} />}
        <Text style={[styles.buttonText, { color: theme.textOnAccent }]}>{buttonLabel}</Text>
      </TouchableOpacity>
      {failed && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={[styles.hint, { color: theme.danger }]}>{t("scan_perm_error")}</Text>}
      <Text style={[styles.hint, { color: theme.textMuted }]}>{t("scan_perm_hint")}</Text>
    </View>
  );
}
