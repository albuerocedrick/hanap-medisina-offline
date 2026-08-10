import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import React, { useEffect } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useProfileStore } from "../../store/useProfileStore";
import { useTranslation } from "@/src/i18n/useTranslation";
import { useTheme } from "@/src/theme/useTheme";
import { MIN_TOUCH_TARGET, spacing } from "@/src/theme/tokens";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

// ─── Reusable spring icon button ──────────────────────────────────────────────
function IconButton({
  onPress,
  children,
  accessibilityLabel,
  backgroundColor,
  borderColor,
}: {
  onPress: () => void;
  children: React.ReactNode;
  accessibilityLabel: string;
  backgroundColor?: string;
  borderColor?: string;
}) {
  const t = useTheme();
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const press = (down: boolean) => {
    if (reduceMotion) return;
    scale.value = withSpring(down ? 0.86 : 1, { damping: 14, stiffness: 320 });
    opacity.value = withTiming(down ? 0.75 : 1, { duration: down ? 80 : 120 });
  };

  // The button is drawn at 40dp — visually correct against the header — but the
  // touch area is expanded to the 48dp minimum via hitSlop. Growing the *visual*
  // circle to 48 (which is what I did first) made the header look unbalanced;
  // hitSlop gets the accessibility win without the design cost.
  const VISUAL_SIZE = 40;
  const slop = (MIN_TOUCH_TARGET - VISUAL_SIZE) / 2;

  return (
    <AnimatedTouchable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={{ top: slop, bottom: slop, left: slop, right: slop }}
      style={[
        animStyle,
        {
          width: VISUAL_SIZE,
          height: VISUAL_SIZE,
          borderRadius: VISUAL_SIZE / 2,

          alignItems: "center",
          justifyContent: "center",
          backgroundColor: backgroundColor ?? t.surfaceTint,
          // A solid 1px line: hairlineWidth is sub-pixel on Android and can
          // disappear entirely at some densities.
          borderWidth: 1,
          borderColor: borderColor ?? t.borderSubtle,
        },
      ]}
      onPressIn={() => press(true)}
      onPressOut={() => press(false)}
      onPress={onPress}
      activeOpacity={1}
    >
      {children}
    </AnimatedTouchable>
  );
}

// ─── Main Header ──────────────────────────────────────────────────────────────
export function HomeHeader() {
  const { firstName } = useProfileStore();
  const { t } = useTranslation();

  const { colorScheme, toggleColorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = useTheme();
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

  return (
    <Animated.View
      entering={FadeIn.duration(600)}
      style={{
        // On the 4/8/12/16/24 spacing grid (was 22 / 12 / 10).
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.md,
        paddingBottom: spacing.md,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      {/* ── Left: Greeting ── */}
      <View style={{ flex: 1, justifyContent: "center" }}>
        <Text
          // Was rgba(34,69,28,0.7) — 4.49:1, a hair under the 4.5:1 AA floor.
          style={{ color: theme.textSecondary, fontFamily: "Quicksand_600SemiBold" }}
          className="text-xs uppercase tracking-wider"
          maxFontSizeMultiplier={1.6}
        >
          {t('home_welcome_back')}
        </Text>
        <Text
          style={{ color: theme.textPrimary, fontFamily: "Quicksand_700Bold" }}
          className="text-lg"
          numberOfLines={1}
          maxFontSizeMultiplier={1.6}
        >
          {firstName}
        </Text>
      </View>

      {/* ── Center: Brand Logo ── */}
      <View style={{ alignItems: "center", flex: 1 }}>
        <Image
          source={require("../../../assets/images/logo-no-bg.png")}
          style={{ width: 40, height: 40, tintColor: theme.textPrimary }}
          resizeMode="contain"
          accessible
          accessibilityRole="image"
          accessibilityLabel="Hanap Medisina"
        />
      </View>

      {/* ── Right: Theme Toggle ── */}
      <View style={{ flex: 1, alignItems: "flex-end", justifyContent: "center" }}>
        <IconButton
          onPress={toggleColorScheme}
          accessibilityLabel={isDark ? "Switch to light theme" : "Switch to dark theme"}
        >
          <Animated.View style={themeIconWrapStyle}>
            <Ionicons
              name={isDark ? "leaf-outline" : "leaf"}
              size={20}
              color={theme.textPrimary}
            />
          </Animated.View>
        </IconButton>
      </View>
    </Animated.View>
  );
}