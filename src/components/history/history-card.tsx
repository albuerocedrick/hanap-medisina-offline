import { Feather, Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import React from "react";
import { Image, Text, TouchableOpacity, View, StyleSheet } from "react-native";
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
        activeOpacity={1}
        onPressIn={() => {
          scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
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
          animStyle,
          { marginHorizontal: 24, marginBottom: 12 }
        ]}
      >
        <View
          style={{
            flexDirection: "row",
            backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "transparent",
            borderRadius: 24,
            overflow: "hidden",
            borderWidth: isSelected ? 2 : StyleSheet.hairlineWidth,
            borderColor: isSelected
              ? (isDark ? "rgba(162,207,163,0.8)" : "#4D8035")
              : (isDark ? "rgba(255,255,255,0.08)" : "rgba(162,207,163,0.6)"),
            minHeight: 100,
            opacity: isSelecting && !isSelected ? 0.75 : 1,
          }}
        >
          {/* Selection Overlay */}
          {isSelecting && (
            <View
              style={{
                position: "absolute",
                top: 8,
                left: 8,
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
            style={{ width: 100, backgroundColor: "transparent" }}
          >
            <Image
              source={{ uri: item.imageUri }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
          </View>

          {/* Content */}
          <View style={{ flex: 1, paddingHorizontal: 16, paddingVertical: 12, justifyContent: "center" }}>
            <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text
                  style={{
                    color: isDark ? "#F8FAFC" : "#22451C",
                    fontFamily: "Quicksand_700Bold",
                    fontSize: 16,
                  }}
                  numberOfLines={1}
                >
                  {item.plantName}
                </Text>
                
                <Text
                  style={{
                    fontFamily: "Quicksand_500Medium",
                    fontSize: 12,
                    color: isDark ? "rgba(248,250,252,0.6)" : "rgba(34,69,28,0.6)",
                    marginTop: 4,
                  }}
                >
                  {relativeTime(item.scannedAt)}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => onToggleFavorite(item.id)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={{ marginTop: 2 }}
              >
                <Ionicons
                  name={item.isFavorite ? "heart" : "heart-outline"}
                  size={16}
                  color={item.isFavorite ? "#ef4444" : isDark ? "rgba(255,255,255,0.2)" : "rgba(34,69,28,0.2)"}
                />
              </TouchableOpacity>
            </View>

            <View style={{ marginTop: 8 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                <Text
                  style={{
                    color: isDark ? "rgba(248,250,252,0.5)" : "rgba(34,69,28,0.55)",
                    fontFamily: "Quicksand_600SemiBold",
                    fontSize: 10,
                  }}
                >
                  Confidence
                </Text>
                <Text
                  style={{
                    color: getConfHex(displayConf),
                    fontFamily: "Quicksand_700Bold",
                    fontSize: 10,
                  }}
                >
                  {displayConf}%
                </Text>
              </View>
              <View
                style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(162,207,163,0.3)", height: 4, borderRadius: 2, overflow: "hidden" }}
              >
                <View
                  style={{ width: `${barWidth}%`, backgroundColor: getConfHex(displayConf), height: "100%", borderRadius: 2 }}
                />
              </View>
            </View>
          </View>
        </View>
      </AnimatedTouchable>
    </Swipeable>
  );
};