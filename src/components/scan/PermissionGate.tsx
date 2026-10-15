import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";
import { useTranslation } from "@/src/i18n/useTranslation";
import { useTheme } from "@/src/theme/useTheme";
import { scanStyles as styles } from "@/src/components/scan/scan.styles";

export function PermissionGate({ onRequest }: { onRequest: () => void }) {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <View style={[styles.centered, { backgroundColor: theme.bg }]}>
      <View style={[styles.permissionIcon, { backgroundColor: theme.accentSubtle }]}>
        <Ionicons name="camera-outline" size={34} color={theme.accent} />
      </View>
      <Text style={[styles.permissionTitle, { color: theme.textPrimary }]}>{t("scan_perm_title")}</Text>
      <Text style={[styles.body, { color: theme.textSecondary }]}>{t("scan_perm_body")}</Text>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={t("scan_perm_btn")} onPress={onRequest}
        activeOpacity={0.8} style={[styles.permissionButton, { backgroundColor: theme.accent }]}>
        <Ionicons name="camera" size={16} color={theme.textOnAccent} />
        <Text style={[styles.buttonText, { color: theme.textOnAccent }]}>{t("scan_perm_btn")}</Text>
      </TouchableOpacity>
      <Text style={[styles.hint, { color: theme.textMuted }]}>{t("scan_perm_hint")}</Text>
    </View>
  );
}
