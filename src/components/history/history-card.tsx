import { useTheme } from "@/src/theme/useTheme";
import { Feather, Ionicons } from "@expo/vector-icons";
import React, { useRef } from "react";
import { Image, Text, TouchableOpacity, View, StyleSheet } from "react-native";
import { useTranslation } from "@/src/i18n/useTranslation";
import Swipeable, { SwipeableMethods } from "react-native-gesture-handler/ReanimatedSwipeable";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  SharedValue,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { LocalScanRecord } from "@/src/types";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

function DeleteAction({ progress, onPress, label, plantName, isDark }: { progress: SharedValue<number>; onPress: () => void; label: string; plantName: string; isDark: boolean }) {
  const theme = useTheme();
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1], Extrapolation.CLAMP),
    transform: [{ translateX: interpolate(progress.value, [0, 1], [18, 0], Extrapolation.CLAMP) }],
  }));
  const color = theme.danger;
  return <Animated.View style={[{ width: 92, paddingLeft: 10, justifyContent: "center" }, style]}>
    <TouchableOpacity activeOpacity={0.8} accessibilityRole="button" accessibilityLabel={`${label}: ${plantName}`} onPress={onPress}
      style={{ minHeight: 76, paddingVertical: 14, borderRadius: 16, borderWidth: 1, borderColor: theme.dangerBorder, backgroundColor: theme.dangerSubtle, justifyContent: "center", alignItems: "center", gap: 7 }}>
      <Feather name="trash-2" size={20} color={color} /><Text style={{ fontFamily: "Quicksand_700Bold", fontSize: 11, color }}>{label}</Text>
    </TouchableOpacity>
  </Animated.View>;
}

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

export const HistoryCard = React.memo(function HistoryCard({
  item,
  onPress,
  onLongPress,
  onToggleFavorite,
  onDelete,
  isSelecting,
  isSelected,
  onToggleSelect,
}: Props) {
  const theme = useTheme();

  const isDark = theme.isDark;
  const { t } = useTranslation();
  const swipeRef = useRef<SwipeableMethods>(null);

  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Confidence is stored as decimal 0.0 - 1.0
  const displayConf = Number((item.confidence * 100).toFixed(2));
  const barWidth = Math.min(Math.max(displayConf, 0), 100);

  // Dynamic colors for confidence
  const getConfHex = (val: number) => {
    if (val >= 70) return theme.success; // green-600
    if (val >= 35) return theme.warning; // amber-500
    return theme.danger; // red-500
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

  const renderRightActions = (progress: SharedValue<number>) => <DeleteAction progress={progress} label={t("history_delete")} plantName={item.plantName} isDark={isDark} onPress={() => { swipeRef.current?.close(); onDelete(item.id); }} />;

  return (
    <Swipeable ref={swipeRef} renderRightActions={renderRightActions} enabled={!isSelecting} overshootRight={false} rightThreshold={40} friction={2} containerStyle={{ marginHorizontal: 24, marginBottom: 12, overflow: "hidden", borderRadius: 24 }}>
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
          { width: "100%" }
        ]}
      >
        <View
          style={{
            flexDirection: "row",
            backgroundColor: theme.surfaceHighlight,
            borderRadius: 24,
            overflow: "hidden",
            borderWidth: isSelected ? 2 : StyleSheet.hairlineWidth,
            borderColor: isSelected
              ? (theme.accentSoftBorder)
              : (theme.border),
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
                backgroundColor: isSelected ? (theme.accentSubtle) : (theme.surfaceTint),
                borderRadius: 12,
                width: 24,
                height: 24,
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 2,
                borderColor: theme.bg,
              }}
            >
              {isSelected && <Feather name="check" size={14} color={theme.textOnAccent} />}
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
                    color: theme.textPrimary,
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
                    color: theme.textSecondary,
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
                  color={item.isFavorite ? theme.danger : theme.border}
                />
              </TouchableOpacity>
            </View>

            <View style={{ marginTop: 8 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                <Text
                  style={{
                    color: theme.textSecondary,
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
                style={{ backgroundColor: theme.surfaceTint, height: 4, borderRadius: 2, overflow: "hidden" }}
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
});
