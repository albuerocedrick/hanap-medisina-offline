import { useTheme } from "@/src/theme/useTheme";
/**
 * src/components/profile/profile-avatar.tsx
 * Renders the user avatar with an edit-button overlay.
 */
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface Props {
  avatarUri: string | null;
  displayName: string;
  onEditPress: () => void;
}

export function ProfileAvatar({ avatarUri, displayName, onEditPress }: Props) {
  const theme = useTheme();



  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <View className="items-center">
      <View className="relative">
        {/* Avatar */}
        <View
          style={{
            backgroundColor: theme.surfaceTint,
            borderColor: theme.border,
            borderWidth: StyleSheet.hairlineWidth,
          }}
          className="w-20 h-20 rounded-full overflow-hidden items-center justify-center"
        >
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} className="w-full h-full" resizeMode="cover" />
          ) : (
            <Text
              style={{ color: theme.textPrimary, fontFamily: "Quicksand_700Bold" }}
              className="text-3xl"
            >
              {initials}
            </Text>
          )}
        </View>

        {/* Edit button overlay */}
        <AnimatedTouchable
          onPressIn={() => {
            scale.value = withSpring(0.85, { damping: 14, stiffness: 320 });
          }}
          onPressOut={() => {
            scale.value = withSpring(1, { damping: 14, stiffness: 320 });
          }}
          onPress={onEditPress}
          activeOpacity={1}
          style={[
            {
              backgroundColor: theme.surfaceTint,
              borderColor: theme.border,
              borderWidth: StyleSheet.hairlineWidth,
            },
            animStyle
          ]}
          className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full items-center justify-center"
        >
          <Feather name="camera" size={14} color={theme.textPrimary} />
        </AnimatedTouchable>
      </View>
    </View>
  );
}
