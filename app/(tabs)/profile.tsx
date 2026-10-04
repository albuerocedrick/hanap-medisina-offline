/**
 * app/(tabs)/profile.tsx
 * User Profile Screen — HanapMedisina (Modern Theme Edition)
 */

import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { useColorScheme } from "nativewind";
import React, { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, StatusBar, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// 🌟 IMPORT PAGE TRANSITION
import { PageTransition } from "@/src/components/ui/PageTransition";

import { ProfileAvatar } from "@/src/components/profile/profile-avatar";
import { EditProfileModal } from "@/src/components/profile/edit-profile-modal";
import { ExportImportSection } from "@/src/components/profile/export-import-section";
import { ProfileMenuItem } from "@/src/components/profile/profile-menu-item";
import { useProfileStore } from "@/src/store/useProfileStore";
import { useHistoryStore } from "@/src/store/useHistoryStore";
import { useTranslation } from "@/src/i18n/useTranslation";
import { useSettingsStore } from "@/src/store/useSettingsStore";
import { useOnboardingStore } from "@/src/store/useOnboardingStore";
import { AppSheet } from "@/src/components/ui/AppSheet";
import { useTheme } from "@/src/theme/useTheme";
import { LanguageSheet } from "@/src/components/ui/LanguageSheet";


export default function ProfileScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  
  const { firstName, lastName, avatarUri, setAvatar, setFirstName, setLastName, resetProfile } = useProfileStore();
  const { language, setLanguage } = useSettingsStore();
  const { t } = useTranslation();

  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [languageSheetVisible, setLanguageSheetVisible] = useState(false);
  const [resetVisible, setResetVisible] = useState(false);


  const totalScans = useHistoryStore((s) => s.scans.length); 


  const handlePickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Please allow access to your photo library to update your avatar.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0]?.uri) return;

    const asset = result.assets[0];

    try {
      // Ensure the profile directory exists
      const profileDir = `${FileSystem.documentDirectory}profile/`;
      const dirInfo = await FileSystem.getInfoAsync(profileDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(profileDir, { intermediates: true });
      }

      // Copy image to local storage
      const fileName = asset.fileName ?? `avatar_${Date.now()}.jpg`;
      const newUri = `${profileDir}${fileName}`;
      await FileSystem.copyAsync({
        from: asset.uri,
        to: newUri
      });

      setAvatar(newUri);
      Alert.alert("Success", "Your profile photo has been updated!");
    } catch (err: any) {
      console.error("[ProfileScreen] Avatar save failed:", err);
      Alert.alert("Error", "Could not save your avatar. Please try again.");
    }
  }, [setAvatar]);

  return <>
    <PageTransition style={{ paddingTop: insets.top }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 24, paddingBottom: Math.max(insets.bottom, 24) + 88 }}>
        <Text style={{ fontFamily: "Quicksand_700Bold", fontSize: 28, color: theme.textPrimary }}>{t("profile_title")}</Text>
        <Text style={{ fontFamily: "Quicksand_500Medium", fontSize: 14, lineHeight: 21, color: theme.textSecondary, marginTop: 6, marginBottom: 24 }}>{t("profile_subtitle")}</Text>
        <View style={{ backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.borderSubtle, borderRadius: 24, padding: 20, marginBottom: 26 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 18 }}>
            <ProfileAvatar avatarUri={avatarUri} displayName={`${firstName} ${lastName}`} onEditPress={handlePickImage} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: "Quicksand_700Bold", fontSize: 20, color: theme.textPrimary }}>{`${firstName} ${lastName}`.trim()}</Text>
              <Pressable onPress={() => setEditProfileVisible(true)} accessibilityRole="button" style={{ paddingVertical: 12 }}>
                <Text style={{ fontFamily: "Quicksand_600SemiBold", color: theme.accent, fontSize: 13 }}>{t("profile_edit")}</Text>
              </Pressable>
            </View>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderColor: theme.borderSubtle }}>
            <Feather name="camera" size={18} color={theme.accent} />
            <Text style={{ flex: 1, fontFamily: "Quicksand_500Medium", color: theme.textSecondary, fontSize: 14 }}>{t("profile_total_scans")}</Text>
            <Text style={{ fontFamily: "Quicksand_700Bold", color: theme.textPrimary, fontSize: 22 }}>{totalScans}</Text>
          </View>
        </View>
        <Text style={{ fontFamily: "Quicksand_700Bold", fontSize: 12, color: theme.textSecondary, marginBottom: 12, letterSpacing: 1 }}>{t("profile_account").toUpperCase()}</Text>
        <View style={{ backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.borderSubtle, borderRadius: 20, padding: 6, marginBottom: 26 }}>
          <ProfileMenuItem icon="edit-2" label={t("profile_edit")} onPress={() => setEditProfileVisible(true)} />
          <ProfileMenuItem icon="globe" label={`${t("profile_language")}: ${language === "en" ? "English" : "Tagalog"}`} onPress={() => setLanguageSheetVisible(true)} />
          <ProfileMenuItem icon="help-circle" label={t("onboard_replay")} onPress={useOnboardingStore.getState().replay} />
          <ExportImportSection />
        </View>
        <Text style={{ fontFamily: "Quicksand_700Bold", fontSize: 12, color: theme.textSecondary, marginBottom: 12, letterSpacing: 1 }}>{t("profile_session").toUpperCase()}</Text>
        <View style={{ backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.borderSubtle, borderRadius: 20, padding: 6 }}>
          <ProfileMenuItem icon="refresh-cw" label={t("profile_reset")} onPress={() => setResetVisible(true)} destructive />
        </View>
      </ScrollView>
    </PageTransition>
    <EditProfileModal visible={editProfileVisible} currentFirstName={firstName} currentLastName={lastName} onSave={(first, last) => { setFirstName(first); setLastName(last); }} onClose={() => setEditProfileVisible(false)} />
    <LanguageSheet visible={languageSheetVisible} current={language} onSelect={setLanguage} onClose={() => setLanguageSheetVisible(false)} />
    <AppSheet visible={resetVisible} title={t("profile_reset")} onClose={() => setResetVisible(false)}>
      <View style={{ width: 48, height: 48, backgroundColor: "rgba(239,68,68,0.10)", borderRadius: 14, alignItems: "center", justifyContent: "center", marginBottom: 16 }}><Feather name="refresh-cw" size={23} color={theme.danger} /></View>
      <Text style={{ fontFamily: "Quicksand_500Medium", fontSize: 15, lineHeight: 23, color: theme.textSecondary, marginBottom: 24 }}>{t("profile_reset_description")}</Text>
      <Pressable accessibilityRole="button" onPress={() => { setResetVisible(false); resetProfile(); }} style={{ minHeight: 54, borderRadius: 14, backgroundColor: theme.danger, alignItems: "center", justifyContent: "center" }}><Text style={{ fontFamily: "Quicksand_700Bold", color: "#FFFFFF", fontSize: 15 }}>{t("profile_reset_confirm")}</Text></Pressable>
      <Pressable accessibilityRole="button" onPress={() => setResetVisible(false)} style={{ minHeight: 48, alignItems: "center", justifyContent: "center", marginTop: 8 }}><Text style={{ fontFamily: "Quicksand_600SemiBold", color: theme.textSecondary }}>{t("cancel")}</Text></Pressable>
    </AppSheet>
  </>;
}
