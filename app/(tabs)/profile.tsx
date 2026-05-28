/**
 * app/(tabs)/profile.tsx
 * User Profile Screen — HanapMedisina (Modern Theme Edition)
 */

import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import React, { useCallback, useState } from "react";
import { Alert, ScrollView, StatusBar, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// 🌟 IMPORT PAGE TRANSITION
import { PageTransition } from "@/src/components/ui/PageTransition";

import { ProfileAvatar } from "@/src/components/profile/profile-avatar";
import { EditProfileModal } from "@/src/components/profile/edit-profile-modal";
import { ExportImportSection } from "@/src/components/profile/export-import-section";
import { ProfileMenuItem } from "@/src/components/profile/profile-menu-item";
import { ProfileStats } from "@/src/components/profile/profile-stats";
import { useProfileStore } from "@/src/store/useProfileStore";
import { useHistoryStore } from "@/src/store/useHistoryStore";

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const { name, nickname, avatarUri, setAvatar, setName, setNickname, resetProfile } = useProfileStore();

  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const [editProfileVisible, setEditProfileVisible] = useState(false);

  const totalScans = useHistoryStore((s) => s.scans.length); 
  const statsLoading = false;

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

  const handleResetProfile = useCallback(() => {
    Alert.alert("Reset Profile", "Are you sure? This will reset your name and avatar.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset",
        style: "destructive",
        onPress: () => {
          resetProfile();
        },
      },
    ]);
  }, [resetProfile]);

  return (
    <PageTransition className="flex-1 bg-[#FAFEEF] dark:bg-[#0B120B]" style={{ paddingTop: insets.top }}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent
      />

      <View className="px-6 py-5">
        <Text
          style={{
            fontSize: 28,
            fontFamily: "serif",
            fontStyle: "italic",
            fontWeight: "500",
            letterSpacing: 0.3,
            color: isDark ? "#F8FAFC" : "#22451C",
          }}
        >
          Profile
        </Text>
        <Text
          style={{
            color: isDark ? "rgba(248,250,252,0.5)" : "rgba(34,69,28,0.6)",
            fontFamily: "Quicksand_500Medium"
          }}
          className="text-sm mt-1"
        >
          Your profile & preferences
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24) + 80 }}>

        <View className="items-center mb-4">
          <ProfileAvatar
            avatarUri={avatarUri}
            displayName={name}
            onEditPress={handlePickImage}
          />
          <Text
            style={{ color: isDark ? "#F8FAFC" : "#22451C", fontFamily: "Quicksand_700Bold" }}
            className="text-xl"
          >
            {name}
          </Text>
          {nickname ? (
            <Text
              style={{ color: isDark ? "rgba(248,250,252,0.5)" : "rgba(34,69,28,0.6)", fontFamily: "Quicksand_600SemiBold" }}
              className="text-sm mt-0.5"
            >
              {nickname}
            </Text>
          ) : null}
        </View>

        <ProfileStats
          totalScans={totalScans}
          loading={statsLoading}
        />

        <View className="mx-6 mb-6 mt-4">
          <Text
            style={{ color: isDark ? "rgba(248,250,252,0.4)" : "rgba(34,69,28,0.5)", fontFamily: "Quicksand_700Bold" }}
            className="text-xs uppercase tracking-wider mb-3 ml-2"
          >
            Account
          </Text>

          <ProfileMenuItem
            icon="edit-2"
            label="Edit Profile"
            onPress={() => setEditProfileVisible(true)}
          />
          <ExportImportSection />
        </View>

        <View className="mx-6 mt-2">
          <Text
            style={{ color: isDark ? "rgba(248,250,252,0.4)" : "rgba(34,69,28,0.5)", fontFamily: "Quicksand_700Bold" }}
            className="text-xs uppercase tracking-wider mb-3 ml-2"
          >
            Session
          </Text>

          <ProfileMenuItem
            icon="log-out"
            label="Reset Profile"
            onPress={handleResetProfile}
            destructive
          />
        </View>

      </ScrollView>

      <EditProfileModal
        visible={editProfileVisible}
        currentName={name}
        currentNickname={nickname}
        onSave={(newName, newNickname) => {
          setName(newName);
          setNickname(newNickname);
        }}
        onClose={() => setEditProfileVisible(false)}
      />
    </PageTransition>
  );
}