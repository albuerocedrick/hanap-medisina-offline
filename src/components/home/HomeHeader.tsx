import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import React, { useEffect } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useProfileStore } from "../../store/useProfileStore";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

// ─── Reusable spring icon button ──────────────────────────────────────────────
function IconButton({
  onPress,
  children,
  isDark,
  backgroundColor,
  borderColor,
}: {
  onPress: () => void;
  children: React.ReactNode;
  isDark: boolean;
  backgroundColor?: string;
  borderColor?: string;
}) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <AnimatedTouchable
      style={[
        animStyle,
        {
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: backgroundColor ?? (isDark ? "rgba(255,255,255,0.08)" : "#FAFEEF"),
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: borderColor ?? (isDark ? "rgba(255,255,255,0.14)" : "#A2CFA3"),
        },
      ]}
      onPressIn={() => {
        scale.value = withSpring(0.86, { damping: 14, stiffness: 320 });
        opacity.value = withTiming(0.75, { duration: 80 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 14, stiffness: 320 });
        opacity.value = withTiming(1, { duration: 120 });
      }}
      onPress={onPress}
      activeOpacity={1}
    >
      {children}
    </AnimatedTouchable>
  );
}

// ─── Main Header ──────────────────────────────────────────────────────────────
export function HomeHeader() {
  const { name, nickname } = useProfileStore();

  const { colorScheme, toggleColorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const themeAnim = useSharedValue(isDark ? 1 : 0);

  useEffect(() => {
    themeAnim.value = withTiming(isDark ? 1 : 0, { duration: 300 });
  }, [isDark, themeAnim]);

  const themeIconWrapStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${themeAnim.value * 180}deg` },
      { scale: 0.95 + themeAnim.value * 0.1 },
    ],
  }));

  const displayName = nickname || name;

  return (
    <Animated.View
      entering={FadeIn.duration(600)}
      style={{
        paddingHorizontal: 22,
        paddingTop: 12,
        paddingBottom: 10,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      {/* ── Left: Greeting ── */}
      <View style={{ flex: 1, justifyContent: "center" }}>
        <Text
          style={{ color: isDark ? "rgba(248,250,252,0.6)" : "rgba(34,69,28,0.7)", fontFamily: "Quicksand_600SemiBold" }}
          className="text-xs uppercase tracking-wider"
        >
          Welcome Back
        </Text>
        <Text
          style={{ color: isDark ? "#F8FAFC" : "#22451C", fontFamily: "Quicksand_700Bold" }}
          className="text-lg"
          numberOfLines={1}
        >
          {displayName} 🌿
        </Text>
      </View>

      {/* ── Center: Brand Logo ── */}
      <View style={{ alignItems: "center", flex: 1 }}>
        <Image
          source={require("../../../assets/images/logo-no-bg.png")}
          style={{ width: 40, height: 40, tintColor: isDark ? "#F8FAFC" : "#22451C" }}
          resizeMode="contain"
        />
      </View>

      {/* ── Right: Theme Toggle ── */}
      <View style={{ flex: 1, alignItems: "flex-end", justifyContent: "center" }}>
        <IconButton onPress={toggleColorScheme} isDark={isDark}>
          <Animated.View style={themeIconWrapStyle}>
            <Ionicons
              name={isDark ? "leaf-outline" : "leaf"}
              size={16}
              color={isDark ? "rgba(226,232,240,0.9)" : "#22451C"}
            />
          </Animated.View>
        </IconButton>
      </View>
    </Animated.View>
  );
}