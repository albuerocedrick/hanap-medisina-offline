import React from "react";
import { Pressable, Text, View } from "react-native";
import { Check } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { AppSheet } from "./AppSheet";
export { SheetProvider as LanguageDialogProvider } from "./AppSheet";
import { useTranslation } from "@/src/i18n/useTranslation";
import { useTheme } from "@/src/theme/useTheme";
import type { AppLanguage } from "@/src/store/useSettingsStore";

export function LanguageSheet({ visible, current, onSelect, onClose }: { visible: boolean; current: AppLanguage; onSelect: (language: AppLanguage) => void; onClose: () => void }) {
  const { t } = useTranslation();
  const theme = useTheme();
  return <AppSheet visible={visible} title={t("lang_sheet_title")} onClose={onClose}>
    <Text style={{ fontFamily: "Quicksand_500Medium", fontSize: 14, lineHeight: 21, color: theme.textSecondary, marginBottom: 20 }}>{t("lang_sheet_subtitle")}</Text>
    {(["en", "tl"] as const).map(language => <Pressable key={language} onPress={() => {
      if (language !== current) { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); onSelect(language); }
      onClose();
    }} accessibilityRole="radio" accessibilityState={{ checked: current === language }} style={{ minHeight: 62, borderRadius: 14, borderWidth: 1, borderColor: current === language ? theme.accent : theme.border, backgroundColor: current === language ? theme.accentSubtle : theme.surface, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
      <Text style={{ fontFamily: "Quicksand_700Bold", fontSize: 16, color: theme.textPrimary }}>{language === "en" ? "English" : "Tagalog"}</Text>
      {current === language && <Check size={21} color={theme.accent} />}
    </Pressable>)}
  </AppSheet>;
}
