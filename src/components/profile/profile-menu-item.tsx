import { useTheme } from "@/src/theme/useTheme";
/**
 * src/components/profile/profile-menu-item.tsx
 * Reusable row item for profile settings actions.
 */
import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface Props {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  onPress: () => void;
  destructive?: boolean;
}

export function ProfileMenuItem({ icon, label, onPress, destructive = false }: Props) {
  const theme = useTheme();



  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Clean, minimalist colors avoiding "slop" tinted backgrounds
  const iconRingBg = destructive
    ? (theme.dangerSubtle)
    : (theme.border);

  const iconRingBorder = destructive
    ? (theme.dangerBorder)
    : (theme.border);

  const iconColor = destructive
    ? (theme.danger)
    : (theme.textPrimary);

  const textColor = destructive
    ? (theme.danger)
    : (theme.textPrimary);

  return (
    <AnimatedTouchable
      onPressIn={() => {
        scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 300 });
      }}
      onPress={onPress}
      activeOpacity={1}
      style={[
        animStyle,
        {
          backgroundColor: theme.surface,
        }
      ]}
      className="flex-row items-center px-4 py-3.5 rounded-2xl mb-2"
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: iconRingBg,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: iconRingBorder,
          marginRight: 12
        }}
      >
        <Feather name={icon} size={14} color={iconColor} />
      </View>
      <Text
        style={{ color: textColor, fontFamily: "Quicksand_600SemiBold", letterSpacing: 0.2 }}
        className="flex-1 text-sm"
      >
        {label}
      </Text>
      {!destructive && <Feather name="chevron-right" size={16} color={theme.textSecondary} />}
    </AnimatedTouchable>
  );
}
