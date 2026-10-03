import React from "react";
import { Linking, Text, TouchableOpacity, View } from "react-native";
import credits from "@/assets/images/plants/photo-credits.json";
import { AppSheet } from "@/src/components/ui/AppSheet";
import { useTranslation } from "@/src/i18n/useTranslation";
import { useTheme } from "@/src/theme/useTheme";

export function PhotoCreditsSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const theme = useTheme();
  const { t } = useTranslation();
  return <AppSheet visible={visible} title={t("photo_credits")} onClose={onClose}>
    <Text style={{ fontFamily: "Quicksand_500Medium", fontSize: 13, lineHeight: 20, color: theme.textSecondary, marginBottom: 20 }}>{t("photo_credits_note")}</Text>
    {credits.map(credit => <View key={credit.target} style={{ marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1, borderColor: theme.borderSubtle }}>
      <Text style={{ fontFamily: "Quicksand_700Bold", fontSize: 16, color: theme.textPrimary }}>{credit.name}</Text>
      <Text style={{ fontFamily: "Quicksand_500Medium", fontSize: 12, lineHeight: 20, color: theme.textSecondary }}>{credit.species}{"\n"}© {credit.artist}</Text>
      <TouchableOpacity accessibilityRole="link" onPress={() => { void Linking.openURL(credit.source).catch(error => console.warn("Photo source could not open", error)); }} style={{ minHeight: 44, justifyContent: "center" }}>
        <Text style={{ fontFamily: "Quicksand_600SemiBold", color: theme.accent }}>{t("photo_source")}</Text>
      </TouchableOpacity>
      <TouchableOpacity accessibilityRole="link" onPress={() => { void Linking.openURL(credit.licenseUrl).catch(error => console.warn("Photo license could not open", error)); }} style={{ minHeight: 44, justifyContent: "center" }}>
        <Text style={{ fontFamily: "Quicksand_600SemiBold", color: theme.accent }}>{credit.license}</Text>
      </TouchableOpacity>
    </View>)}
  </AppSheet>;
}
