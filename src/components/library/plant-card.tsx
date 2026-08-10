/**
 * components/library/PlantCard.tsx
 *
 * List item card for the Library feed.
 *
 * - Navigates to library/[id] on press.
 * - Shows a heart badge if the MedicinalPlant is in favorites.
 * - Falls back to a placeholder when the image fails to load.
 */

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { memo, useState } from "react";
import {
  Image,
  ImageErrorEventData,
  NativeSyntheticEvent,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  useReducedMotion,
  withSpring,
} from "react-native-reanimated";
import { MedicinalPlant } from "@/src/services/localLibrary";
import { useLibraryStore } from "@/src/store/useLibraryStore";
import { useTheme } from "@/src/theme/useTheme";
import { elevation, MIN_TOUCH_TARGET, radius, spacing } from "@/src/theme/tokens";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const PLACEHOLDER_IMAGE = require("../../../assets/images/plant-placeholder.jpg");
const MAX_VISIBLE_CATEGORIES = 2;
const THUMB_SIZE = 88;

interface PlantCardProps {
  plant: MedicinalPlant;
  shortDescription?: string;
  onPress?: (plant: MedicinalPlant) => void;
  hideFavoriteIndicator?: boolean;
}

const CategoryChip = memo(function CategoryChip({ label }: { label: string }) {
  const t = useTheme();

  if (!label?.trim()) return null;
  return (
    <View
      style={{
        backgroundColor: t.accentSubtle,
        borderColor: t.borderSubtle,
        borderWidth: 1,
        borderRadius: radius.chip,
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        marginRight: spacing.xs + 2,
        marginTop: spacing.xs,
      }}
    >
      <Text
        style={{ fontFamily: "Quicksand_600SemiBold", fontSize: 10, color: t.textSecondary }}
        numberOfLines={1}
        maxFontSizeMultiplier={1.4}
      >
        {label}
      </Text>
    </View>
  );
});

export function PlantCardComponent({
  plant,
  shortDescription,
  onPress,
  hideFavoriteIndicator = false,
}: PlantCardProps) {
  const router = useRouter();
  const t = useTheme();

  // Respect the OS "reduce motion" setting — skip the press-scale spring entirely.
  const reduceMotion = useReducedMotion();

  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isFavorite = useLibraryStore((s) => s.isFavorite(plant?.id));
  const toggleFavorite = useLibraryStore((s) => s.toggleFavorite);

  const [imageError, setImageError] = useState<boolean>(false);
  const [imageLoading, setImageLoading] = useState<boolean>(true);

  if (!plant?.id) {
    console.warn("[PlantCard] Received plant with no ID — skipping render.");
    return null;
  }

  const handlePress = () => {
    try {
      if (onPress) {
        onPress(plant);
      } else {
        router.push(`/(tabs)/library/${plant.id}`);
      }
    } catch (err) {
      console.error(`[PlantCard] Navigation failed for plant "${plant.id}":`, err);
    }
  };

  const handleImageError = (_: NativeSyntheticEvent<ImageErrorEventData>) => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const setScale = (to: number) => {
    if (reduceMotion) return;
    scale.value = withSpring(to, { damping: 15, stiffness: 300 });
  };

  const safeCategories = Array.isArray(plant.categories) ? plant.categories : [];
  const visibleCategories = safeCategories.slice(0, MAX_VISIBLE_CATEGORIES);
  const overflowCount = safeCategories.length - MAX_VISIBLE_CATEGORIES;

  const description = shortDescription || plant?.shortDescription;

  return (
    <AnimatedTouchable
      onPressIn={() => setScale(0.97)}
      onPressOut={() => setScale(1)}
      onPress={handlePress}
      activeOpacity={1}
      accessibilityRole="button"
      accessibilityLabel={plant.name ?? "Unknown plant"}
      accessibilityHint="Opens plant details"
      style={[animStyle, { marginHorizontal: spacing.xl, marginBottom: spacing.md }]}
    >
      {/* Outer surface carries background, border and shadow.
          `overflow: hidden` lives on the inner row so it cannot clip the shadow. */}
      <View
        style={{
          backgroundColor: t.surface,
          borderRadius: radius.card,
          borderWidth: 1,
          borderColor: t.borderSubtle,
          ...elevation.card,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            borderRadius: radius.card - 1,
            overflow: "hidden",
            padding: spacing.md,
            alignItems: "center",
          }}
        >
          {/* Inset thumbnail with its own radius, rather than a flush square edge */}
          <View
            style={{
              width: THUMB_SIZE,
              height: THUMB_SIZE,
              borderRadius: radius.input,
              overflow: "hidden",
              backgroundColor: t.surfaceTint,
            }}
          >
            <Image
              source={!imageError && plant.imageUrl ? { uri: plant.imageUrl } : PLACEHOLDER_IMAGE}
              style={{ width: "100%", height: "100%", opacity: !imageError && plant.imageUrl ? 1 : 0 }}
              resizeMode="cover"
              onError={handleImageError}

              onLoad={handleImageLoad}
              accessible={false}
            />
            {imageLoading && !imageError && (
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="leaf-outline" size={24} color={t.iconInactive} />
              </View>
            )}
          </View>

          <View style={{ flex: 1, paddingLeft: spacing.md, justifyContent: "center" }}>
            <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
              <View style={{ flex: 1, paddingRight: spacing.sm }}>
                <Text
                  style={{ fontFamily: "Quicksand_700Bold", fontSize: 16, color: t.textPrimary }}
                  numberOfLines={1}
                  maxFontSizeMultiplier={1.6}
                >
                  {plant.name ?? "Unknown plant"}
                </Text>

                {/* Italic alone signals binomial nomenclature. The previous
                    fontFamily: "serif" pulled a different platform default on
                    Android vs iOS and clashed with Quicksand. */}
                <Text
                  style={{
                    fontFamily: "Quicksand_500Medium",
                    fontStyle: "italic",
                    fontSize: 13,
                    color: t.textSecondary,
                    marginTop: 2,
                  }}
                  numberOfLines={1}
                  maxFontSizeMultiplier={1.6}
                >
                  {plant.scientificName ?? ""}
                </Text>

                {description ? (
                  <Text
                    style={{
                      fontFamily: "Quicksand_500Medium",
                      fontSize: 12,
                      color: t.textSecondary,
                      marginTop: spacing.xs,
                    }}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                  >
                    {description}
                  </Text>
                ) : null}
              </View>

              {!hideFavoriteIndicator && (
                <TouchableOpacity
                  // 48dp target (Android minimum; iOS asks 44pt). Negative margins
                  // keep the icon optically aligned without shrinking the target.
                  style={{
                    width: MIN_TOUCH_TARGET,
                    height: MIN_TOUCH_TARGET,
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: -spacing.md,
                    marginRight: -spacing.md,
                  }}
                  onPress={() => toggleFavorite(plant)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isFavorite }}
                  accessibilityLabel={
                    isFavorite
                      ? `Remove ${plant.name ?? "plant"} from favorites`
                      : `Add ${plant.name ?? "plant"} to favorites`
                  }
                >
                  <Ionicons
                    name={isFavorite ? "heart" : "heart-outline"}
                    size={20}
                    color={isFavorite ? t.danger : t.iconInactive}
                  />
                </TouchableOpacity>
              )}
            </View>

            {safeCategories.length > 0 && (
              <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: spacing.xs, alignItems: "center" }}>
                {visibleCategories.map((cat: string) => (
                  <CategoryChip key={cat} label={cat} />
                ))}
                {overflowCount > 0 && (
                  <Text
                    style={{
                      fontFamily: "Quicksand_500Medium",
                      fontSize: 10,
                      color: t.textSecondary,
                      marginTop: spacing.xs,
                    }}
                  >
                    +{overflowCount} more
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>
      </View>
    </AnimatedTouchable>
  );
}

export const PlantCard = memo(PlantCardComponent);
