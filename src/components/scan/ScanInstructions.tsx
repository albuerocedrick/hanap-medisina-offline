import { Ionicons } from "@expo/vector-icons";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useTranslation } from "@/src/i18n/useTranslation";
import { useTheme } from "@/src/theme/useTheme";
import { scanStyles as styles } from "./scan.styles";

export function ScanInstructions({ onStart }: { onStart: () => void }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const tips = [
    [t("scan_intro_frame"), t("scan_intro_frame_body")],
    [t("scan_intro_light"), t("scan_intro_light_body")],
    [t("scan_intro_focus"), t("scan_intro_focus_body")],
  ];
  return <View style={[styles.instructionsCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
    <ScrollView style={{ flexShrink: 1 }} contentContainerStyle={styles.instructionsContent} showsVerticalScrollIndicator>
      <View style={[styles.instructionsIcon, { backgroundColor: theme.accentSubtle }]}>
        <Ionicons name="leaf-outline" size={28} color={theme.accent} />
      </View>
      <Text accessibilityRole="header" style={[styles.instructionsTitle, { color: theme.textPrimary }]}>{t("capture_guide")}</Text>
      <Text style={[styles.body, { color: theme.textSecondary }]}>{t("scan_intro_body")}</Text>
      <View style={styles.instructionsTips}>
        {tips.map(([title, body], index) => <View key={title} style={styles.instructionsRow}>
          <View style={[styles.instructionsNumber, { backgroundColor: theme.accentSubtle }]}>
            <Text style={[styles.captureText, { color: theme.accent }]}>{index + 1}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.captureText, { color: theme.textPrimary }]}>{title}</Text>
            <Text style={[styles.instructionsBody, { color: theme.textSecondary }]}>{body}</Text>
          </View>
        </View>)}
      </View>
    </ScrollView>
    <View style={[styles.instructionsFooter, { borderColor: theme.borderSubtle }]}>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={t("scan_intro_start")}
        activeOpacity={0.8} onPress={onStart} style={[styles.captureButton, { backgroundColor: theme.accent, borderColor: theme.accentSoftBorder }]}>
        <Ionicons name="scan-outline" size={22} color={theme.textOnAccent} />
        <Text style={[styles.captureText, { color: theme.textOnAccent }]}>{t("scan_intro_start")}</Text>
      </TouchableOpacity>
    </View>
  </View>;
}
