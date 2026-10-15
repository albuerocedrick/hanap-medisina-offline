import { useTheme } from "@/src/theme/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { memo, useState } from "react";
import {
  Image,
  ImageErrorEventData,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { MedicinalPlant } from "@/src/services/localLibrary";
import { useLibraryStore } from "@/src/store/useLibraryStore";
import { useTranslation } from "@/src/i18n/useTranslation";


const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
const PLACEHOLDER_IMAGE = require("../../../assets/images/plant-placeholder.jpg");

interface PlantGridCardProps {
  plant: MedicinalPlant | any;
  onPress?: (plant: any) => void;
  hideFavoriteIndicator?: boolean;
}

export function PlantGridCardComponent({
  plant,
  onPress,
  hideFavoriteIndicator = false,
}: PlantGridCardProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();



  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isFavorite = useLibraryStore((s) => s.isFavorite(plant.id));
  const toggleFavorite = useLibraryStore((s) => s.toggleFavorite);

  const [imageError, setImageError] = useState<boolean>(false);
  const [imageLoading, setImageLoading] = useState<boolean>(true);

  const isOfflineAccessible = isFavorite;
  const isUnavailableOffline = false;

  if (!plant?.id) return null;

  const handlePress = () => {
    if (isUnavailableOffline) return;
    try {
      if (onPress) {
        onPress(plant);
      } else {
        router.push(`/(tabs)/library/${plant.id}`);
      }
    } catch (err) {
      if (__DEV__) console.error(`[PlantGridCard] Navigation failed for plant "${plant.id}":`, err);
    }
  };

  const handleImageError = (_: NativeSyntheticEvent<ImageErrorEventData>) => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  return (
    <AnimatedTouchable
      onPressIn={() => { scale.value = withSpring(0.95, { damping: 15, stiffness: 300 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 300 }); }}
      onPress={handlePress}
      activeOpacity={1}
      style={[
        animStyle,
        {
          flex: 1,
          opacity: isUnavailableOffline ? 0.4 : 1,
          margin: 6,
          backgroundColor: theme.surfaceHighlight,
          borderRadius: 20,
          overflow: "hidden",
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.border,
        },
      ]}
    >
      <View style={{ width: "100%", aspectRatio: 1, backgroundColor: theme.surfaceHighlight }}>
        {imageLoading && !imageError && (
          <View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center" }]}>
            <Ionicons name="leaf-outline" size={24} color={theme.border} />
          </View>
        )}
        {/* plant-placeholder.jpg is a dark photo (RGB 25,30,26) at 300x168. Used
            as the fallback in a 1:1 tile it read as a black square — which is
            exactly what it looked like in dark mode. A missing image now gets a
            themed surface with a leaf glyph instead of a stretched dark photo. */}
        {!imageError && plant.imageUrl ? (
          <Image
            source={{ uri: plant.imageUrl }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
            onError={handleImageError}
            onLoad={handleImageLoad}
          />
        ) : (
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: theme.surfaceTint,
              },
            ]}
          >
            <Ionicons
              name="leaf-outline"
              size={28}
              color={theme.accent}
            />
          </View>
        )}

        {isUnavailableOffline && (
          <View style={{ position: "absolute", top: 8, right: 8 }}>
            <Ionicons name="cloud-offline-outline" size={16} color={theme.onImage} />
          </View>
        )}
        {!hideFavoriteIndicator && (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={t(isFavorite ? "a11y_remove_favorite" : "a11y_add_favorite")}
            accessibilityState={{ selected: isFavorite }}
            onPress={() => toggleFavorite(plant)}
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: theme.scrim,
              justifyContent: "center",
              alignItems: "center",
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={isFavorite ? "heart" : "heart-outline"}
              size={16}
              color={isFavorite ? theme.danger : theme.onImage}
            />
          </TouchableOpacity>
        )}
      </View>

      <View style={{ padding: 12 }}>
        <Text style={{ fontFamily: "Quicksand_700Bold", fontSize: 14, color: theme.textPrimary, textAlign: "center" }} numberOfLines={1}>
          {plant.name ?? "Unknown plant"}
        </Text>
        <Text style={{ fontFamily: "serif", fontStyle: "italic", fontSize: 11, color: theme.textSecondary, textAlign: "center", marginTop: 2 }} numberOfLines={1}>
          {plant.scientificName ?? ""}
        </Text>
      </View>
    </AnimatedTouchable>
  );
}

export const PlantGridCard = memo(PlantGridCardComponent);

