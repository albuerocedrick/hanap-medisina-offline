import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import React, { useCallback } from "react";
import {
  Pressable,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { SymptomItem } from "@/src/types/homeFeed";
import { selectSymptoms, useFeedStore } from "@/src/store/useFeedStore";
import { useLibraryStore } from "@/src/store/useLibraryStore";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function SymptomCard({ symptom, index, onPress }: {
  symptom: SymptomItem;
  index: number;
  onPress: (symptom: SymptomItem) => void;
}) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      entering={FadeIn.delay(index * 40)}
      onPressIn={() => { scale.value = withSpring(0.95, { damping: 15, stiffness: 300 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 300 }); }}
      onPress={() => onPress(symptom)}
      style={[{ flex: 1, margin: 6 }, animatedStyle]}
    >
      <View
        style={{
          borderRadius: 20,
          padding: 16,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#FFFFFF",
          borderWidth: 1,
          borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(162,207,163,0.4)",
          shadowColor: "#22451C",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 4,
          elevation: 2,
          minHeight: 100,
        }}
      >
        <Ionicons
          name={symptom.icon as any}
          size={32}
          color={isDark ? "rgba(162,207,163,0.9)" : "#4D8035"}
        />
        <Text
          numberOfLines={2}
          style={{
            fontFamily: "Quicksand_600SemiBold",
            fontSize: 13,
            color: isDark ? "#F8FAFC" : "#22451C",
            textAlign: "center",
            marginTop: 10,
            lineHeight: 18,
          }}
        >
          {symptom.label}
        </Text>
        <View
          style={{
            marginTop: 6,
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 10,
            backgroundColor: isDark ? "rgba(162,207,163,0.15)" : "rgba(162,207,163,0.25)",
          }}
        >
          <Text
            style={{
              fontFamily: "Quicksand_600SemiBold",
              fontSize: 10,
              color: isDark ? "rgba(162,207,163,0.9)" : "#4D8035",
            }}
          >
            {symptom.plantCount} {symptom.plantCount === 1 ? "plant" : "plants"}
          </Text>
        </View>
      </View>
    </AnimatedPressable>
  );
}

export default function AllSymptomsScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const symptoms = useFeedStore(selectSymptoms);
  const setActiveSymptom = useLibraryStore((s) => s.setActiveSymptom);

  const handleSymptomPress = useCallback((symptom: SymptomItem) => {
    setActiveSymptom(symptom.label);
    router.push("/(tabs)/library");
  }, [setActiveSymptom, router]);

  const renderItem = useCallback(({ item, index }: { item: SymptomItem; index: number }) => (
    <SymptomCard symptom={item} index={index} onPress={handleSymptomPress} />
  ), [handleSymptomPress]);

  const renderHeader = () => (
    <View style={{ paddingBottom: 8 }}>
      <Text
        style={{
          fontFamily: "Quicksand_500Medium",
          fontSize: 14,
          color: isDark ? "rgba(248,250,252,0.5)" : "rgba(34,69,28,0.6)",
          marginBottom: 4,
        }}
      >
        Tap a symptom to find matching plants
      </Text>
      <Text
        style={{
          fontFamily: "Quicksand_700Bold",
          fontSize: 13,
          color: isDark ? "rgba(162,207,163,0.7)" : "#4D8035",
        }}
      >
        {symptoms.length} symptoms found
      </Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? "#0B120B" : "#FAFEEF" }}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent
      />
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 20,
            paddingVertical: 16,
            gap: 12,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(162,207,163,0.2)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color={isDark ? "#F8FAFC" : "#22451C"}
            />
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Ionicons
                name="leaf-outline"
                size={18}
                color={isDark ? "rgba(162,207,163,0.8)" : "#4D8035"}
              />
              <Text
                style={{
                  fontSize: 24,
                  fontFamily: "serif",
                  fontStyle: "italic",
                  fontWeight: "500",
                  color: isDark ? "#F8FAFC" : "#22451C",
                  letterSpacing: 0.3,
                }}
              >
                All Symptoms
              </Text>
            </View>
          </View>
        </View>

        {/* Grid */}
        <FlatList
          data={symptoms}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          numColumns={3}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={{
            paddingHorizontal: 12,
            paddingBottom: 120,
          }}
          columnWrapperStyle={{ marginBottom: 0 }}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </View>
  );
}
