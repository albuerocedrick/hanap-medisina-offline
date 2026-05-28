import { Feather, Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import Swipeable from "react-native-gesture-handler/Swipeable";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { LocalScanRecord } from "../../types";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface Props {
  item: LocalScanRecord;
  onPress: (item: LocalScanRecord) => void;
  onLongPress: (item: LocalScanRecord) => void;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
  isSelecting: boolean;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
}

export const HistoryCard: React.FC<Props> = ({
  item,
  onPress,
  onLongPress,
  onToggleFavorite,
  onDelete,
  isSelecting,
  isSelected,
  onToggleSelect,
}) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Confidence is stored as decimal 0.0 - 1.0
  const displayConf = Number((item.confidence * 100).toFixed(2));
  const barWidth = Math.min(Math.max(displayConf, 0), 100);

  // Dynamic colors for confidence
  const getConfHex = (val: number) => {
    if (val >= 70) return "#16a34a"; // green-600
    if (val >= 35) return "#f59e0b"; // amber-500
    return "#ef4444"; // red-500
  };

  // Accurate relative time handling
  const relativeTime = (isoString: string) => {
    if (!isoString) return "Unknown Date";
    const ms = new Date(isoString).getTime();
    const diff = Date.now() - ms;
    const minutes = Math.floor(diff / 60_000);
    const hours = Math.floor(diff / 3_600_000);
    const days = Math.floor(diff / 86_400_000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hr ago`;
    if (days < 7) return `${days} days ago`;

    return new Date(ms).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const renderRightActions = () => {
    return (
      <View style={{ justifyContent: "center", alignItems: "center", width: 80, paddingVertical: 8, paddingRight: 16 }}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onDelete(item.id)}
          style={{
            backgroundColor: "#ef4444",
            justifyContent: "center",
            alignItems: "center",
            width: 50,
            height: 50,
            borderRadius: 25,
          }}
        >
          <Feather name="trash-2" size={20} color="white" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Swipeable renderRightActions={renderRightActions} enabled={!isSelecting} containerStyle={{ overflow: "visible" }}>
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
            backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#FAFEEF",
            borderColor: isSelected
              ? (isDark ? "rgba(162,207,163,0.8)" : "#4D8035")
              : (isDark ? "rgba(255,255,255,0.1)" : "rgba(162,207,163,0.55)"),
            borderWidth: isSelected ? 2 : 1,
            opacity: isSelecting && !isSelected ? 0.75 : 1,
          },
          animStyle,
        ]}
        className="mx-4 my-2 p-3 flex-row gap-4 rounded-2xl shadow-sm"
      >
        {/* Selection Overlay */}
        {isSelecting && (
          <View
            style={{
              position: "absolute",
              top: -8,
              left: -8,
              zIndex: 10,
              backgroundColor: isSelected ? (isDark ? "#A2CFA3" : "#4D8035") : (isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)"),
              borderRadius: 12,
              width: 24,
              height: 24,
              justifyContent: "center",
              alignItems: "center",
              borderWidth: 2,
              borderColor: isDark ? "#0B120B" : "#FAFEEF",
            }}
          >
            {isSelected && <Feather name="check" size={14} color={isDark ? "#0B120B" : "white"} />}
          </View>
        )}

        {/* Thumbnail */}
        <View
          style={{
            borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(162,207,163,0.3)",
            borderWidth: 1,
          }}
          className="w-20 h-20 bg-slate-100 rounded-lg overflow-hidden relative"
        >
          <Image
            source={{ uri: item.imageUri }}
            className="w-full h-full"
            resizeMode="cover"
          />
        </View>

        {/* Content */}
        <View className="flex-1 justify-between py-1">
          <View className="flex-row items-start justify-between gap-2">
            <Text
              style={{
                color: isDark ? "rgba(248,250,252,0.9)" : "#22451C",
                fontFamily: "Quicksand_700Bold",
              }}
              className="flex-1 text-base"
              numberOfLines={1}
            >
              {item.plantName}
            </Text>

            <TouchableOpacity
              onPress={() => onToggleFavorite(item.id)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={item.isFavorite ? "heart" : "heart-outline"}
                size={20}
                color={item.isFavorite ? "#ef4444" : isDark ? "rgba(255,255,255,0.4)" : "rgba(34,69,28,0.4)"}
              />
            </TouchableOpacity>
          </View>

          <View className="mt-1">
            <View className="flex-row justify-between mb-1.5">
              <Text
                style={{
                  color: isDark ? "rgba(248,250,252,0.5)" : "rgba(34,69,28,0.55)",
                  fontFamily: "Quicksand_600SemiBold",
                }}
                className="text-xs"
              >
                Confidence
              </Text>
              <Text
                style={{
                  color: getConfHex(displayConf),
                  fontFamily: "Quicksand_700Bold",
                }}
                className="text-xs"
              >
                {displayConf}%
              </Text>
            </View>
            <View
              style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(162,207,163,0.3)" }}
              className="h-1.5 rounded-full overflow-hidden"
            >
              <View
                className="h-full rounded-full"
                style={{ width: `${barWidth}%`, backgroundColor: getConfHex(displayConf) }}
              />
            </View>
          </View>

          <Text
            style={{
              color: isDark ? "rgba(248,250,252,0.4)" : "rgba(34,69,28,0.45)",
              fontFamily: "Quicksand_500Medium",
            }}
            className="mt-2 text-[11px]"
          >
            {relativeTime(item.scannedAt)}
          </Text>
        </View>
      </AnimatedTouchable>
    </Swipeable>
  );
};