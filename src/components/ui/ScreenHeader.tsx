import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/src/theme/useTheme";
import { BackButton, BackButtonSpacer } from "./BackButton";

/**
 * src/components/ui/ScreenHeader.tsx
 *
 * One header for every pushed screen.
 *
 * Before this existed, each screen hand-rolled its own header row. They drifted:
 * symptoms.tsx padded to 20, the library stack used a `#15803d` bar that appears
 * nowhere else in the palette, comparison.tsx built a third variant inline, and
 * the [id] loading/error states rendered no header at all — which is how a user
 * could land on a screen with no way back.
 *
 * Centralising it means "does this screen have a back button?" stops being a
 * per-screen decision that can be forgotten.
 */
export function ScreenHeader({
  title,
  subtitle,
  showBack = true,
  onBack,
  fallbackHref,
  right,
  /** Draws a hairline under the header. Use when content scrolls beneath it. */
  bordered = false,
}: {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  fallbackHref?: string;
  right?: React.ReactNode;
  bordered?: boolean;
}) {
  const theme = useTheme();

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 12,
        gap: 12,
        borderBottomWidth: bordered ? StyleSheet.hairlineWidth : 0,
        borderBottomColor: theme.borderSubtle,
      }}
    >
      {/* The spacer keeps the title in the same spot whether or not a back
          button is present, so headers don't jump between screens. */}
      {showBack ? (
        <BackButton onPress={onBack} fallbackHref={fallbackHref} />
      ) : (
        <BackButtonSpacer />
      )}

      <View style={{ flex: 1 }}>
        {title ? (
          <Text
            numberOfLines={1}
            style={{
              fontSize: 24,
              fontFamily: "serif",
              fontStyle: "italic",
              fontWeight: "500",
              letterSpacing: 0.3,
              color: theme.textPrimary,
            }}
          >
            {title}
          </Text>
        ) : null}

        {subtitle ? (
          <Text
            numberOfLines={1}
            style={{
              fontFamily: "Quicksand_500Medium",
              fontSize: 13,
              color: theme.textSecondary,
              marginTop: 2,
            }}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      {right}
    </View>
  );
}

export default ScreenHeader;
