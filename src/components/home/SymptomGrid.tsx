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
import { useTranslation } from "@/src/i18n/useTranslation";
import { useTheme } from "@/src/theme/useTheme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Every chip is locked to this height. Previously the icon circle, the label and
 * the optional count badge each contributed their own height, so a chip whose
 * label wrapped ended up taller than its neighbours and the rows read ragged.
 */
const CHIP_HEIGHT = 96;
const ICON_CIRCLE = 44;

function SymptomChip({ symptom, index, onPress }: { symptom: SymptomItem, index: number, onPress: (symptom: SymptomItem) => void }) {
  const theme = useTheme();
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
          justifyContent: "center",
          paddingHorizontal: 8,
          paddingVertical: 12,
          height: CHIP_HEIGHT,
          // In light mode this was #FAFEEF — the exact page background — so the
          // chips read as flat cut-outs rather than raised surfaces.
          backgroundColor: theme.surface,
          borderWidth: 1,
          borderColor: theme.borderSubtle,
        }}
      >
        <View
          style={{
            width: ICON_CIRCLE,
            height: ICON_CIRCLE,
            borderRadius: ICON_CIRCLE / 2,
            alignItems: "center",
            justifyContent: "center",
            // Dark mode used "transparent" here while light mode had a tinted
            // disc, so the icon lost its container after dark and the recessed
            // card behind it showed through as a dark box.
            backgroundColor: theme.accentSubtle,
          }}
        >
          <Ionicons name={symptom.icon as any} size={24} color={theme.accent} />
        </View>
        <Text
          numberOfLines={1}
          style={{
            marginTop: 8,
            fontSize: 11,
            textAlign: "center",
            lineHeight: 15,
            fontFamily: "Quicksand_600SemiBold",
            color: theme.textPrimary,
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
              backgroundColor: theme.accentSubtle,
            }}
          >
            <Text style={{ fontSize: 9, fontWeight: "bold", color: theme.accent }}>
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
  const { t } = useTranslation();

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
          {t('home_symptoms_title')}
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
          {t('home_symptoms_title')}
        </Text>
        {hasMore && (
          <TouchableOpacity onPress={() => router.push("/symptoms" as any)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={{ fontFamily: "Quicksand_600SemiBold", fontSize: 13, color: isDark ? "rgba(162,207,163,0.9)" : "#4D8035" }}>
              {t('home_see_all')} →
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
