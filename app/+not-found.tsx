import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ScreenHeader } from "@/src/components/ui/ScreenHeader";
import { useTheme } from "@/src/theme/useTheme";

/**
 * app/+not-found.tsx
 *
 * This was the Expo starter template screen: an unthemed white page with a
 * `#2e78b7` link, and its only exit was the native "Oops!" header. If a bad
 * route was hit from a screen with no header, there was nothing to tap.
 *
 * It now uses the shared ScreenHeader (so back always exists) plus an explicit
 * "go home" action, since a 404 often means the previous route is also invalid.
 */
export default function NotFoundScreen() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <ScreenHeader fallbackHref="/(tabs)" />

        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 32,
            paddingBottom: 48,
          }}
        >
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: theme.accentSubtle,
            }}
          >
            <Ionicons name="compass-outline" size={32} color={theme.accent} />
          </View>

          <Text
            style={{
              marginTop: 20,
              fontSize: 24,
              fontFamily: "serif",
              fontStyle: "italic",
              fontWeight: "500",
              textAlign: "center",
              color: theme.textPrimary,
            }}
          >
            Page not found
          </Text>

          <Text
            style={{
              marginTop: 8,
              fontSize: 14,
              lineHeight: 20,
              textAlign: "center",
              fontFamily: "Quicksand_500Medium",
              color: theme.textSecondary,
            }}
          >
            That screen does not exist. It may have been moved or the link was
            mistyped.
          </Text>

          <TouchableOpacity
            onPress={() => router.replace("/(tabs)")}
            accessibilityRole="button"
            accessibilityLabel="Go to home screen"
            style={{
              marginTop: 24,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              paddingHorizontal: 22,
              paddingVertical: 14,
              borderRadius: 16,
              backgroundColor: theme.accentSubtle,
              borderWidth: 1,
              borderColor: theme.borderSubtle,
            }}
          >
            <Ionicons name="home-outline" size={18} color={theme.accent} />
            <Text style={{ fontFamily: "Quicksand_700Bold", color: theme.accent }}>
              Back to home
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}
