import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import React from "react";
import { Text, View, Pressable, ScrollView, useWindowDimensions } from "react-native";

import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

import { PreparationGroup } from "../../types/homeFeed";
import { selectPreparationGroups, useFeedStore } from "../../store/useFeedStore";
import { useLibraryStore } from "../../store/useLibraryStore";
import { useTranslation } from "@/src/i18n/useTranslation";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const BASE_CARD_WIDTH = 130;
const BASE_CARD_HEIGHT = 150;
const SPACING = 16;

/**
 * The card was a hard-coded 130×150 box holding a 48pt icon disc, a two-line
 * title and a count line. That budget only works at the default font scale —
 * a user with larger text in their OS accessibility settings got the method
 * name clipped mid-word, which is the one string on the card that identifies
 * what it does. Growing the box with the scale keeps the text intact.
 *
 * The scale is capped at 1.6 so a very large setting can't produce a card
 * wider than the viewport, and the snap interval is derived from the same
 * numbers so the carousel keeps landing cards flush at any size.
 */
function useRemedyCardMetrics() {
  const { fontScale } = useWindowDimensions();
  const scale = Math.min(Math.max(fontScale, 1), 1.6);
  const width = Math.round(BASE_CARD_WIDTH * scale);
  return {
    width,
    height: Math.round(BASE_CARD_HEIGHT * scale),
    snapInterval: width + SPACING,
  };
}


function RemedyCard({ group, index, onPress }: { group: PreparationGroup, index: number, onPress: (group: PreparationGroup) => void }) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const { t } = useTranslation();
  const { width: cardWidth, height: cardHeight } = useRemedyCardMetrics();
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
          width: cardWidth,
          height: cardHeight,
          borderRadius: 24,

          padding: 16,
          justifyContent: "space-between",
          backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "#FAFEEF",
          borderWidth: 1,
          borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(162,207,163,0.5)",
        }}
      >
        <View 
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 8,
            backgroundColor: isDark ? "transparent" : "rgba(162,207,163,0.3)",
          }}
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
            {group.plantCount} {t(group.plantCount === 1 ? 'common_plant' : 'common_plants')}
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
  const { t } = useTranslation();

  const preparationGroups = useFeedStore(selectPreparationGroups);
  const isLoadingFeed = useFeedStore((s) => s.isLoadingFeed);
  const setActivePreparationMethod = useLibraryStore((s) => s.setActivePreparationMethod);
  const { width: cardWidth, height: cardHeight, snapInterval } = useRemedyCardMetrics();


  const handleMethodPress = (group: PreparationGroup) => {
    setActivePreparationMethod(group.method);
    router.push("/(tabs)/library");
  };

  const handleSeeAll = () => {
    router.push("/quick-remedies");
  };


  if (isLoadingFeed && preparationGroups.length === 0) {
    return (
      <View className="mb-8">
        <Text
          className="text-[#22451C] dark:text-[#EAF3D5] px-6 mb-4"
          style={{ fontSize: 22, fontFamily: "serif", fontStyle: "italic", fontWeight: "500", letterSpacing: 0.4 }}
        >
          {t('home_remedies_title')}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <View 
              key={i} 
              style={{ 
                width: cardWidth, 
                height: cardHeight, 
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
      {/* Title + "See all", matching the header row already used by Common
          Symptoms, My Saved Plants and Recent Scans. Quick Remedies was the only
          carousel without one. */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 24,
          marginBottom: 16,
        }}
      >
        <Text
          className="text-[#22451C] dark:text-[#EAF3D5]"
          style={{ flex: 1, fontSize: 22, fontFamily: "serif", fontStyle: "italic", fontWeight: "500", letterSpacing: 0.4 }}
        >
          {t('home_remedies_title')}
        </Text>
        <Pressable
          onPress={handleSeeAll}
          accessibilityRole="button"
          accessibilityLabel={t('home_see_all')}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={{ fontFamily: "Quicksand_600SemiBold", fontSize: 13, color: isDark ? "rgba(162,207,163,0.9)" : "#4D8035" }}>
            {t('home_see_all')} →
          </Text>
        </Pressable>
      </View>

      <ScrollView

        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={snapInterval}

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
