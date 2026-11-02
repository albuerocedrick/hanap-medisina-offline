import { Feather } from "@expo/vector-icons";
import React from "react";
import { Image, Pressable, Text, View } from "react-native";
import { AppSheet } from "@/src/components/ui/AppSheet";
import { useTranslation } from "@/src/i18n/useTranslation";
import { useTheme } from "@/src/theme/useTheme";

interface ProfilePhotoSuccessSheetProps {
  visible: boolean;
  avatarUri: string | null;
  onClose: () => void;
}

export function ProfilePhotoSuccessSheet({ visible, avatarUri, onClose }: ProfilePhotoSuccessSheetProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  return <AppSheet visible={visible} title={t("profile_photo_updated_title")} onClose={onClose}>
    <View style={{ alignItems: "center", paddingTop: 8, paddingBottom: 24 }}>
      <View style={{ width: 96, height: 96, marginBottom: 20 }}>
        <View style={{ width: 96, height: 96, borderRadius: 48, borderWidth: 3, borderColor: theme.border, backgroundColor: theme.surfaceTint, overflow: "hidden", alignItems: "center", justifyContent: "center" }}>
          {avatarUri
            ? <Image source={{ uri: avatarUri }} accessibilityLabel={t("profile_photo_preview")} resizeMode="cover" style={{ width: "100%", height: "100%" }} />
            : <Feather name="user" size={38} color={theme.accent} />}
        </View>
        <View style={{ position: "absolute", right: -2, bottom: -2, width: 34, height: 34, borderRadius: 17, borderWidth: 3, borderColor: theme.surface, backgroundColor: theme.successSubtle, alignItems: "center", justifyContent: "center" }}>
          <Feather name="check" size={20} color={theme.success} />
        </View>
      </View>
      <Text accessibilityLiveRegion="polite" style={{ textAlign: "center", fontFamily: "Quicksand_500Medium", fontSize: 15, lineHeight: 23, color: theme.textSecondary }}>{t("profile_photo_updated_body")}</Text>
    </View>
    <Pressable accessibilityRole="button" onPress={onClose} style={({ pressed }) => ({ minHeight: 54, paddingHorizontal: 20, paddingVertical: 16, borderRadius: 16, backgroundColor: theme.accent, opacity: pressed ? 0.85 : 1, alignItems: "center", justifyContent: "center" })}>
      <Text style={{ fontFamily: "Quicksand_700Bold", color: theme.textOnAccent, fontSize: 15 }}>{t("profile_photo_done")}</Text>
    </Pressable>
  </AppSheet>;
}
