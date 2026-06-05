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
        style={{
          borderRadius: 16,
          alignItems: "center",
          paddingHorizontal: 8,
          paddingVertical: 12,
          height: 95,
          backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#FAFEEF",
          borderWidth: 1,
          borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(162,207,163,0.5)",
        }}
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: isDark ? "transparent" : "rgba(162,207,163,0.25)",
          }}
        >
          <Ionicons name={symptom.icon as any} size={24} color={isDark ? "rgba(162,207,163,0.9)" : "#4D8035"} />
        </View>
        <Text
          numberOfLines={1}
          style={{
            marginTop: 8,
            fontSize: 11,
            textAlign: "center",
            lineHeight: 15,
            fontFamily: "Quicksand_600SemiBold",
            color: isDark ? "#F8FAFC" : "#22451C",
          }}
        >
          {symptom.label}
        </Text>
        {symptom.plantCount > 1 && (
          <View 
            style={{
              position: "absolute",
              top: 6,
              right: 6,
              borderRadius: 10,
              paddingHorizontal: 5,
              paddingVertical: 1,
              backgroundColor: isDark ? "rgba(162,207,163,0.15)" : "rgba(162,207,163,0.3)",
            }}
          >
            <Text style={{ fontSize: 9, fontWeight: "bold", color: isDark ? "rgba(162,207,163,0.9)" : "#4D8035" }}>
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
        <Text
          className="text-[#22451C] dark:text-[#EAF3D5] mb-4"
          style={{ fontSize: 22, fontFamily: "serif", fontStyle: "italic", fontWeight: "500", letterSpacing: 0.4 }}
        >
          What's bothering you?
        </Text>
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
        <Text
          className="text-[#22451C] dark:text-[#EAF3D5]"
          style={{ fontSize: 22, fontFamily: "serif", fontStyle: "italic", fontWeight: "500", letterSpacing: 0.4 }}
        >
          What's bothering you?
        </Text>
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
