import React, { useCallback } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/src/theme/useTheme";
import { MIN_TOUCH_TARGET } from "@/src/theme/tokens";

type Variant = "onImage" | "onSurface";

/** Visual diameter of the disc. The *tappable* area is always MIN_TOUCH_TARGET. */
const DISC = 44;

/**
 * A single back control for the whole app.
 *
 * Both previous implementations drew a white chevron on `rgba(0,0,0,0.3)`. Over a
 * dark hero photo that is fine, but the plant photos are frequently bright — a
 * 30%-black scrim over pale foliage leaves a white glyph on a light grey disc,
 * which is roughly 1.5:1 and effectively invisible. Because the control floats
 * over arbitrary photography, no single translucent value is safe, so the
 * `onImage` variant uses a near-opaque dark disc: it is legible over any photo
 * regardless of what is behind it.
 *
 * ── Why the fallback matters ────────────────────────────────────────────────
 * `router.back()` is a no-op when there is nothing on the stack — which happens
 * on a cold deep-link, after a `replace`, or when a screen is the first route in
 * its group. Previously that left the user tapping a button that did nothing and
 * looked broken. `canGoBack()` is now checked and we fall back to the tab root,
 * so this control is *never* a dead end.
 */
export function BackButton({
  variant = "onSurface",
  onPress,
  label,
  fallbackHref = "/(tabs)",
  style,
}: {
  variant?: Variant;
  onPress?: () => void;
  /** Optional text shown beside the chevron, e.g. "Library". */
  label?: string;
  /** Where to go when there is no history to pop. */
  fallbackHref?: string;
  style?: any;
}) {
  const theme = useTheme();
  const router = useRouter();
  const onImage = variant === "onImage";

  const handlePress = useCallback(() => {
    // Selection feedback confirms the tap even when the transition is slow.
    Haptics.selectionAsync().catch(() => {});

    if (onPress) {
      onPress();
      return;
    }

    try {
      if (router.canGoBack()) {
        router.back();
      } else {
        // Nothing to pop — send the user somewhere real instead of no-oping.
        router.replace(fallbackHref as any);
      }
    } catch (err) {
      console.warn("[BackButton] navigation failed:", err);
    }
  }, [onPress, router, fallbackHref]);

  const tint = onImage ? "#FFFFFF" : theme.textPrimary;

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={label ? `Go back to ${label}` : "Go back"}
      // The disc is 44 but the tappable region is padded out to the platform
      // minimum, so the target is comfortable without making the art heavier.
      hitSlop={(MIN_TOUCH_TARGET - DISC) / 2 + 4}
      style={({ pressed }) => [
        {
          height: DISC,
          minWidth: DISC,
          borderRadius: DISC / 2,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: label ? 14 : 0,
          gap: label ? 4 : 0,
          backgroundColor: onImage ? "rgba(11,18,11,0.72)" : theme.surfaceTint,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: onImage ? "rgba(255,255,255,0.35)" : theme.border,
          // Scale + fade reads as a real press; opacity alone felt unresponsive.
          opacity: pressed ? 0.7 : 1,
          transform: [{ scale: pressed ? 0.94 : 1 }],
        },
        style,
      ]}
    >
      <Ionicons
        // iOS users expect a chevron, Android an arrow.
        name={Platform.OS === "ios" ? "chevron-back" : "arrow-back"}
        size={22}
        color={tint}
      />
      {label ? (
        <Text
          numberOfLines={1}
          style={{
            fontFamily: "Quicksand_600SemiBold",
            fontSize: 14,
            color: tint,
          }}
        >
          {label}
        </Text>
      ) : null}
    </Pressable>
  );
}

/**
 * Occupies exactly the same footprint as `BackButton` without drawing anything.
 *
 * Used to balance a header row that has a trailing action but no back button, so
 * the title stays optically centred instead of drifting left.
 */
export function BackButtonSpacer() {
  return <View style={{ width: DISC, height: DISC }} />;
}

export default BackButton;
