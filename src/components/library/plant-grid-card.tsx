import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
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
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

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
      console.error(`[PlantGridCard] Navigation failed for plant "${plant.id}":`, err);
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
          backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "transparent",
          borderRadius: 20,
          overflow: "hidden",
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(162,207,163,0.6)",
        },
      ]}
    >
      <View style={{ width: "100%", aspectRatio: 1, backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(162,207,163,0.15)" }}>
        {imageLoading && !imageError && (
          <View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center" }]}>
            <Ionicons name="leaf-outline" size={24} color={isDark ? "rgba(255,255,255,0.2)" : "rgba(34,69,28,0.2)"} />
          </View>
        )}
        <Image
          source={!imageError && plant.imageUrl ? { uri: plant.imageUrl } : PLACEHOLDER_IMAGE}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
          onError={handleImageError}
          onLoad={handleImageLoad}
        />
        {isUnavailableOffline && (
          <View style={{ position: "absolute", top: 8, right: 8 }}>
            <Ionicons name="cloud-offline-outline" size={16} color="rgba(255,255,255,0.8)" />
          </View>
        )}
        {!hideFavoriteIndicator && (
          <TouchableOpacity
            onPress={() => toggleFavorite(plant)}
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: "rgba(0,0,0,0.4)",
              justifyContent: "center",
              alignItems: "center",
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons 
              name={isFavorite ? "heart" : "heart-outline"} 
              size={16} 
              color={isFavorite ? "#ef4444" : "white"} 
            />
          </TouchableOpacity>
        )}
      </View>

      <View style={{ padding: 12 }}>
        <Text style={{ fontFamily: "Quicksand_700Bold", fontSize: 14, color: isDark ? "#F8FAFC" : "#22451C", textAlign: "center" }} numberOfLines={1}>
          {plant.name ?? "Unknown plant"}
        </Text>
        <Text style={{ fontFamily: "serif", fontStyle: "italic", fontSize: 11, color: isDark ? "rgba(248,250,252,0.5)" : "rgba(34,69,28,0.6)", textAlign: "center", marginTop: 2 }} numberOfLines={1}>
          {plant.scientificName ?? ""}
        </Text>
      </View>
    </AnimatedTouchable>
  );
}

export const PlantGridCard = memo(PlantGridCardComponent);

