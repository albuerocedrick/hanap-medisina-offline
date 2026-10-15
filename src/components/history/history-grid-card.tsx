import { useTheme } from "@/src/theme/useTheme";
import { Feather, Ionicons } from "@expo/vector-icons";
import React from "react";
import { Dimensions, Image, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { LocalScanRecord } from "@/src/types";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
const { width } = Dimensions.get("window");

// Calculate card width for a 2-column grid with padding
// screen width - (padding left/right 16*2) - (gap 12) / 2
const CARD_WIDTH = (width - 32 - 12) / 2;

interface Props {
  item: LocalScanRecord;
  onPress: (item: LocalScanRecord) => void;
  onLongPress: (item: LocalScanRecord) => void;
  onToggleFavorite: (id: string) => void;
  isSelecting: boolean;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
}

export const HistoryGridCard = React.memo(function HistoryGridCard({
  item,
  onPress,
  onLongPress,
  onToggleFavorite,
  isSelecting,
  isSelected,
  onToggleSelect,
}: Props) {
  const theme = useTheme();



  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Confidence formatting
  const displayConf = Number((item.confidence * 100).toFixed(0));

  const getConfColor = (val: number) => {
    if (val >= 70) return theme.success;
    if (val >= 35) return theme.warning;
    return theme.danger;
  };

  const relativeTime = (isoString: string) => {
    if (!isoString) return "";
    const ms = new Date(isoString).getTime();
    const diff = Date.now() - ms;
    const days = Math.floor(diff / 86_400_000);

    if (days < 1) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;

    return new Date(ms).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <AnimatedTouchable
      activeOpacity={0.85}
      onPressIn={() => {
        scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 300 });
      }}
      onPress={() => {
        if (isSelecting) {
          onToggleSelect(item.id);
        } else {
          onPress(item);
        }
      }}
      onLongPress={() => onLongPress(item)}
      style={[
        {
          width: CARD_WIDTH,
          backgroundColor: theme.surface,
          borderColor: isSelected
            ? theme.accentSoftBorder
            : theme.border,
          borderWidth: isSelected ? 2 : 1,
          opacity: isSelecting && !isSelected ? 0.75 : 1,
          borderRadius: 20,
          overflow: "hidden",
          marginBottom: 12,
        },
        animStyle,
      ]}
      className="shadow-sm"
    >
      {/* Thumbnail */}
      <View className="w-full aspect-square relative">
        <Image source={{ uri: item.imageUri }} className="w-full h-full" resizeMode="cover" />

        {/* Favorite Overlay */}
        <TouchableOpacity
          onPress={() => onToggleFavorite(item.id)}
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
            name={item.isFavorite ? "heart" : "heart-outline"}
            size={16}
            color={item.isFavorite ? theme.danger : "white"}
          />
        </TouchableOpacity>

        {/* Selection Overlay */}
        {isSelecting && (
          <View
            style={{
              position: "absolute",
              top: 8,
              left: 8,
              zIndex: 10,
              backgroundColor: isSelected
                ? theme.accentSubtle
                : theme.scrim,
              borderRadius: 12,
              width: 24,
              height: 24,
              justifyContent: "center",
              alignItems: "center",
              borderWidth: 2,
              borderColor: "white",
            }}
          >
            {isSelected && <Feather name="check" size={14} color={theme.textOnAccent} />}
          </View>
        )}
      </View>

      {/* Content area below image */}
      <View className="p-3">
        <Text
          style={{
            color: theme.textPrimary,
            fontFamily: "Quicksand_700Bold",
            fontSize: 15,
            marginBottom: 4,
          }}
          numberOfLines={1}
        >
          {item.plantName}
        </Text>

        <View className="flex-row items-center justify-between">
          <Text
            style={{
              color: getConfColor(displayConf),
              fontFamily: "Quicksand_600SemiBold",
              fontSize: 12,
            }}
          >
            {displayConf}% match
          </Text>
          <Text
            style={{
              color: theme.textSecondary,
              fontFamily: "Quicksand_500Medium",
              fontSize: 11,
            }}
          >
            {relativeTime(item.scannedAt)}
          </Text>
        </View>
      </View>
    </AnimatedTouchable>
  );
});
