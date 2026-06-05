import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import React from "react";
import { Text, View, Pressable, ScrollView } from "react-native";
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

import { PreparationGroup } from "../../types/homeFeed";
import { selectPreparationGroups, useFeedStore } from "../../store/useFeedStore";
import { useLibraryStore } from "../../store/useLibraryStore";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const CARD_WIDTH = 130;
const CARD_HEIGHT = 150;
const SPACING = 16;
const SNAP_INTERVAL = CARD_WIDTH + SPACING;

function RemedyCard({ group, index, onPress }: { group: PreparationGroup, index: number, onPress: (group: PreparationGroup) => void }) {
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
      onPress={() => onPress(group)}
      style={[animatedStyle, { marginRight: SPACING }]}
    >
      <View
        style={{
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
          borderRadius: 24,
          padding: 16,
          justifyContent: "space-between",
          backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "#FAFEEF",
          borderWidth: 1,
          borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(162,207,163,0.5)",
          shadowColor: "#22451C",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        <View 
          className="w-12 h-12 rounded-full items-center justify-center mb-2"
          style={{ backgroundColor: isDark ? "rgba(162,207,163,0.15)" : "rgba(162,207,163,0.3)" }}
        >
          <Ionicons name={group.icon as any} size={24} color={isDark ? "rgba(162,207,163,0.9)" : "#4D8035"} />
        </View>

        <View>
          <Text 
            className="font-bold text-[15px] mb-1"
            numberOfLines={2}
            style={{ color: isDark ? "#F8FAFC" : "#22451C" }}
          >
            {group.method}
          </Text>
          <Text 
            className="font-medium text-[12px]"
            style={{ color: isDark ? "rgba(162,207,163,0.8)" : "#4D8035" }}
          >
            {group.plantCount} {group.plantCount === 1 ? 'plant' : 'plants'}
          </Text>
        </View>
      </View>
    </AnimatedPressable>
  );
}

export function QuickRemedies() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const preparationGroups = useFeedStore(selectPreparationGroups);
  const isLoadingFeed = useFeedStore((s) => s.isLoadingFeed);
  const setActivePreparationMethod = useLibraryStore((s) => s.setActivePreparationMethod);

  const handleMethodPress = (group: PreparationGroup) => {
    setActivePreparationMethod(group.method);
    router.push("/(tabs)/library");
  };

  if (isLoadingFeed && preparationGroups.length === 0) {
    return (
      <View className="mb-8">
        <Text
          className="text-[#22451C] dark:text-[#EAF3D5] px-6 mb-4"
          style={{ fontSize: 22, fontFamily: "serif", fontStyle: "italic", fontWeight: "500", letterSpacing: 0.4 }}
        >
          Quick Remedies
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <View 
              key={i} 
              style={{ 
                width: CARD_WIDTH, 
                height: CARD_HEIGHT, 
                backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)", 
                borderRadius: 24,
                marginRight: SPACING 
              }} 
            />
          ))}
        </ScrollView>
      </View>
    );
  }

  if (preparationGroups.length === 0) return null;

  return (
    <View className="mb-8">
      <Text
        className="text-[#22451C] dark:text-[#EAF3D5] px-6 mb-4"
        style={{ fontSize: 22, fontFamily: "serif", fontStyle: "italic", fontWeight: "500", letterSpacing: 0.4 }}
      >
        Quick Remedies
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={SNAP_INTERVAL}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: 24 }}
      >
        {preparationGroups.map((group, index) => (
          <RemedyCard
            key={group.method}
            group={group}
            index={index}
            onPress={handleMethodPress}
          />
        ))}
      </ScrollView>
    </View>
  );
}
