import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import React from "react";
import { Text, TouchableOpacity, View, Pressable } from "react-native";
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { SymptomItem } from "../../types/homeFeed";
import { selectSymptoms, useFeedStore } from "../../store/useFeedStore";
import { useLibraryStore } from "../../store/useLibraryStore";
import { SkeletonChip } from "./HomeSkeletons";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function SymptomChip({ symptom, index, onPress }: { symptom: SymptomItem, index: number, onPress: (symptom: SymptomItem) => void }) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.94, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  return (
    <AnimatedPressable
      entering={FadeIn.delay(index * 60)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={() => onPress(symptom)}
      style={[{ width: "31%", marginBottom: 12 }, animatedStyle]}
    >
      <View 
        className="rounded-2xl items-center justify-center p-3"
        style={{
          backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#FAFEEF",
          borderWidth: 1,
          borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(162,207,163,0.5)",
          shadowColor: "#22451C",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.04,
          shadowRadius: 3,
          elevation: 1,
        }}
      >
        <Ionicons name={symptom.icon as any} size={28} color={isDark ? "rgba(248,250,252,0.8)" : "rgba(34,69,28,0.7)"} />
        <Text 
          numberOfLines={1} 
          className="mt-2 text-center font-semibold"
          style={{
            fontSize: 12,
            color: isDark ? "#F8FAFC" : "#22451C",
          }}
        >
          {symptom.label}
        </Text>
        {symptom.plantCount > 1 && (
          <View 
            className="absolute top-1 right-1 rounded-full px-1.5 py-0.5 items-center justify-center"
            style={{ backgroundColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(162,207,163,0.3)" }}
          >
            <Text style={{ fontSize: 9, fontWeight: "bold", color: isDark ? "rgba(248,250,252,0.7)" : "rgba(34,69,28,0.7)" }}>
              {symptom.plantCount}
            </Text>
          </View>
        )}
      </View>
    </AnimatedPressable>
  );
}

export function SymptomGrid() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const symptoms = useFeedStore(selectSymptoms);
  const isLoadingFeed = useFeedStore((s) => s.isLoadingFeed);
  const setActiveSymptom = useLibraryStore((s) => s.setActiveSymptom);

  const handleSymptomPress = (symptom: SymptomItem) => {
    setActiveSymptom(symptom.label);
    router.push("/(tabs)/library");
  };

  if (isLoadingFeed && symptoms.length === 0) {
    return (
      <View className="mb-6 px-6">
        <View className="flex-row items-center gap-2 mb-4">
          <Ionicons name="leaf-outline" size={20} color={isDark ? "rgba(248,250,252,0.5)" : "rgba(34,69,28,0.5)"} />
          <Text style={{ fontFamily: "Quicksand_700Bold", fontSize: 16, color: isDark ? "rgba(248,250,252,0.7)" : "rgba(34,69,28,0.7)" }}>
            What's bothering you?
          </Text>
        </View>
        <View className="flex-row flex-wrap justify-between">
          {Array.from({ length: 6 }).map((_, i) => (
            <View key={i} style={{ width: "31%", marginBottom: 12 }}>
              <SkeletonChip />
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (symptoms.length === 0) return null;

  // Only show top 6 on the home screen to avoid flooding the layout
  const topSymptoms = symptoms.slice(0, 6);
  const hasMore = symptoms.length > 6;

  return (
    <View className="mb-6 px-6">
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center gap-2">
          <Ionicons name="leaf-outline" size={20} color={isDark ? "rgba(248,250,252,0.5)" : "rgba(34,69,28,0.5)"} />
          <Text style={{ fontFamily: "Quicksand_700Bold", fontSize: 16, color: isDark ? "rgba(248,250,252,0.7)" : "rgba(34,69,28,0.7)" }}>
            What's bothering you?
          </Text>
        </View>
        {hasMore && (
          <TouchableOpacity onPress={() => router.push("/symptoms" as any)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={{ fontFamily: "Quicksand_600SemiBold", fontSize: 13, color: isDark ? "rgba(162,207,163,0.9)" : "#4D8035" }}>
              See All →
            </Text>
          </TouchableOpacity>
        )}
      </View>
      
      <View className="flex-row flex-wrap justify-between">
        {topSymptoms.map((symptom, index) => (
          <SymptomChip 
            key={symptom.id}
            symptom={symptom}
            index={index}
            onPress={handleSymptomPress}
          />
        ))}
      </View>
    </View>
  );
}
