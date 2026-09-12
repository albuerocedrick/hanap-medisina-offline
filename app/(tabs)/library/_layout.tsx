/**
 * app/(tabs)/library/_layout.tsx
 *
 * Stack navigator for the Library tab group.
 *
 * ── Architecture note on sub-tabs ────────────────────────────────────────────
 * The "Details / Research / Compare" sub-tabs inside the plant detail screen
 * are NOT a nested navigator here. They are rendered as a custom tab bar
 * component INSIDE [id].tsx, positioned below the plant hero image and name.
 *
 * Why not a nested Tab.Navigator?
 *  - A nested Tab.Navigator would replace or conflict with the bottom tab bar.
 *  - We want the sub-tabs to scroll INTO the screen (below the plant header),
 *    not sit fixed at the top of the device as a second nav bar.
 *  - A custom tab strip inside [id].tsx gives us full control over placement,
 *    animation, and the ability to put it below the plant image.
 *
 * Stack screens managed here:
 *  - index       → Main Library feed (search + filter + plant list)
 *  - [id]        → Plant detail with custom Details/Research/Compare sub-tabs
 *  - comparison  → 1v1 Plant Comparison engine
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Stack } from "expo-router";
import React from "react";
import { Platform } from "react-native";

import { useTheme } from "@/src/theme/useTheme";

/**
 * app/(tabs)/library/_layout.tsx
 *
 * ── Why the native header is gone ────────────────────────────────────────────
 * This stack used to paint a solid `#15803d` bar. That green exists nowhere else
 * in the design tokens, so pushing from the Library into a plant made the app
 * appear to change identity mid-navigation. It also duplicated the shared
 * BackButton with a second, differently-styled implementation.
 *
 * Every screen in this stack now renders its own in-content header built from
 * `ScreenHeader` / `BackButton`, which is themed and consistent with the rest of
 * the app. `headerShown: false` is therefore the correct default here rather
 * than a per-screen override.
 */
export default function LibraryLayout() {
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        // Keeps the push transition from flashing white in dark mode.
        contentStyle: { backgroundColor: theme.bg },
        animation: Platform.OS === "ios" ? "default" : "slide_from_right",
        // Android has no edge-swipe by default; enabling it means the back
        // gesture works even before the user finds the button.
        gestureEnabled: true,
      }}
    >

      {/* ── Library Index ─────────────────────────────────────────────────── */}
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />

      {/* ── Plant Detail ([id]) ────────────────────────────────────────────── */}
      {/*
       * The screen draws its own floating back/favourite controls over the hero
       * image, so there is deliberately no native header to fight with it.
       */}
      <Stack.Screen name="[id]" />

      {/* ── 1v1 Comparison ────────────────────────────────────────────────── */}
      {/*
       * Previously presented as a `modal` on iOS. A modal implies "dismiss to
       * return to what you were doing", but the comparison is a normal forward
       * step in the browse flow and it pushes further screens of its own — so a
       * card push matches what the navigation actually does on both platforms.
       */}
      <Stack.Screen name="comparison" options={{ presentation: "card" }} />

    </Stack>
  );
}
