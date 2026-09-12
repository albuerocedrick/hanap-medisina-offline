import React from "react";
import { TouchableOpacity, TouchableOpacityProps } from "react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/src/theme/useTheme";
import { MIN_TOUCH_TARGET } from "@/src/theme/tokens";

interface IconButtonProps extends TouchableOpacityProps {
  icon: any;
  size?: number;
  variant?: "filled" | "ghost";
  /** Required: an icon alone gives screen readers nothing to announce. */
  accessibilityLabel: string;
}

export function IconButton({
  icon: Icon,
  size = 22,
  variant = "ghost",
  onPress,
  accessibilityLabel,
  style,
  ...props
}: IconButtonProps) {
  const t = useTheme();
  const isFilled = variant === "filled";

  const handlePress = (e: any) => {
    Haptics.selectionAsync();
    onPress?.(e);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      // 48dp satisfies both Android (48dp) and iOS (44pt). Was 44x44.
      style={[
        {
          width: MIN_TOUCH_TARGET,
          height: MIN_TOUCH_TARGET,
          borderRadius: MIN_TOUCH_TARGET / 2,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: isFilled ? t.accent : t.accentSubtle,
        },
        style,
      ]}
      {...props}
    >
      <Icon
        size={size}
        color={isFilled ? t.textOnAccent : t.accent}
        strokeWidth={1.8}
      />
    </TouchableOpacity>
  );
}
