import React from "react";
import { Pressable, Text, View } from "react-native";
import { AppSheet } from "@/src/components/ui/AppSheet";
import { useTheme } from "@/src/theme/useTheme";
import { useTranslation } from "@/src/i18n/useTranslation";

export function CaptureGuide({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const tips = [
    { title: t("capture_one"), body: t("capture_one_body") },
    { title: t("capture_background"), body: t("capture_background_body") },
    { title: t("capture_light"), body: t("capture_light_body") },
    { title: t("capture_frame"), body: t("capture_frame_body") },
  ];
  return <AppSheet visible={visible} title={t("capture_guide")} onClose={onClose}>
    {tips.map(({ title, body }, index) => <View key={title} style={{ flexDirection: "row", gap: 14, paddingVertical: 16, borderBottomWidth: index === tips.length - 1 ? 0 : 1, borderColor: theme.borderSubtle }}>
      <Text style={{ width: 26, fontFamily: "Quicksand_700Bold", fontSize: 13, color: theme.accent, marginTop: 2 }}>{`0${index + 1}`}</Text>
      <View style={{ flex: 1 }}><Text style={{ fontFamily: "Quicksand_700Bold", fontSize: 15, color: theme.textPrimary, marginBottom: 4 }}>{title}</Text><Text style={{ fontFamily: "Quicksand_500Medium", fontSize: 13, lineHeight: 20, color: theme.textSecondary }}>{body}</Text></View>
    </View>)}
    <Pressable onPress={onClose} accessibilityRole="button" style={{ minHeight: 54, marginTop: 16, borderRadius: 14, backgroundColor: theme.accent, alignItems: "center", justifyContent: "center" }}><Text style={{ fontFamily: "Quicksand_700Bold", color: theme.textOnAccent, fontSize: 15 }}>{t("capture_ready")}</Text></Pressable>
  </AppSheet>;
}
