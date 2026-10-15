import { useTheme } from "@/src/theme/useTheme";
import React, { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

/**
 * An infinite pulse is appropriate here — unlike the mascot, skeletons unmount as
 * soon as data arrives, so the loop is naturally bounded. It still needs to respect
 * "reduce motion", and to be cancelled on unmount rather than left running.
 */
function usePulseStyle() {
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(reduceMotion ? 0.7 : 0.4);

  useEffect(() => {
    if (reduceMotion) {
      // A single steady value still reads as "loading" without any motion.
      opacity.value = 0.7;
      return;
    }

    opacity.value = withRepeat(
      withSequence(
        withTiming(1.0, { duration: 800 }),
        withTiming(0.4, { duration: 800 })
      ),
      -1,
      true
    );

    return () => cancelAnimation(opacity);
  }, [opacity, reduceMotion]);

  return useAnimatedStyle(() => ({ opacity: opacity.value }));
}

export function SkeletonChip() {
  const theme = useTheme();
  const animatedStyle = usePulseStyle();
  return <Animated.View style={[{ backgroundColor: theme.accentSubtle }, animatedStyle]} className="h-[44px] w-[100px] rounded-full mr-3" />;
}



export function SkeletonTriviaCard() {
  const theme = useTheme();
  const animatedStyle = usePulseStyle();
  return (
    <Animated.View style={[{ backgroundColor: theme.surface, borderColor: theme.borderSubtle }, animatedStyle]} className="w-full rounded-[32px] border p-6">
      <View className="flex-row items-center gap-4">
        <View className="w-12 h-12 rounded-full" style={{ backgroundColor: theme.accentSubtle }} />
        <View className="flex-1 gap-2">
          <View className="h-[12px] w-1/3 rounded-full" style={{ backgroundColor: theme.accentSubtle }} />
          <View className="h-[10px] w-full rounded-full" style={{ backgroundColor: theme.accentSubtle }} />
          <View className="h-[10px] w-4/5 rounded-full" style={{ backgroundColor: theme.accentSubtle }} />
        </View>
      </View>
    </Animated.View>
  );
}