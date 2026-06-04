import React, { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

function usePulseStyle() {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1.0, { duration: 800 }),
        withTiming(0.4, { duration: 800 })
      ),
      -1, 
      true 
    );
  },[]);

  return useAnimatedStyle(() => ({ opacity: opacity.value }));
}

export function SkeletonChip() {
  const animatedStyle = usePulseStyle();
  return <Animated.View style={animatedStyle} className="h-[44px] w-[100px] rounded-full bg-[#A2CFA3]/60 dark:bg-white/10 mr-3" />;
}



export function SkeletonTriviaCard() {
  const animatedStyle = usePulseStyle();
  return (
    <Animated.View style={animatedStyle} className="w-full rounded-[32px] bg-[#FAFEEF] dark:bg-[#162916] border border-[#A2CFA3]/30 dark:border-white/10 p-6">
      <View className="flex-row items-center gap-4">
        <View className="w-12 h-12 rounded-full bg-[#A2CFA3]/60 dark:bg-white/10" />
        <View className="flex-1 gap-2">
          <View className="h-[12px] w-1/3 rounded-full bg-[#A2CFA3]/60 dark:bg-white/10" />
          <View className="h-[10px] w-full rounded-full bg-[#A2CFA3]/60 dark:bg-white/10" />
          <View className="h-[10px] w-4/5 rounded-full bg-[#A2CFA3]/60 dark:bg-white/10" />
        </View>
      </View>
    </Animated.View>
  );
}