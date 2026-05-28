/**
 * src/components/history/history-header.tsx
 * Unified Scan History Header — HanapMedisina (Local Offline Edition)
 */

import { Feather, Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export interface HistoryHeaderProps {
  totalCount: number;
  favoriteCount: number;
  activeTab: "all" | "favorites";
  sortBy: "newest" | "oldest";
  viewMode: "list" | "grid";
  isSelecting: boolean;
  selectedCount: number;
  onTabChange: (tab: "all" | "favorites") => void;
  onSortChange: () => void;
  onViewModeChange: () => void;
  onDeleteSelected: () => void;
  onCancelSelection: () => void;
}

export const HistoryHeader: React.FC<HistoryHeaderProps> = ({
  totalCount,
  favoriteCount,
  activeTab,
  sortBy,
  viewMode,
  isSelecting,
  selectedCount,
  onTabChange,
  onSortChange,
  onViewModeChange,
  onDeleteSelected,
  onCancelSelection,
}) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  // ── Reusable Pill Component ───────────────────────────────────────────────
  const FilterPill = ({
    label,
    tab,
    badge,
    icon,
  }: {
    label: string;
    tab: "all" | "favorites";
    badge?: number;
    icon?: keyof typeof Ionicons.glyphMap;
  }) => {
    const isActive = activeTab === tab;
    const scale = useSharedValue(1);

    const animStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    return (
      <AnimatedTouchable
        onPressIn={() => {
          scale.value = withSpring(0.92, { damping: 14, stiffness: 300 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 14, stiffness: 300 });
        }}
        onPress={() => onTabChange(tab)}
        activeOpacity={0.8}
        style={[
          {
            height: 36,
            paddingHorizontal: 16,
            borderRadius: 18,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: isActive
              ? isDark
                ? "rgba(162,207,163,0.15)"
                : "#22451C"
              : isDark
              ? "rgba(255,255,255,0.04)"
              : "transparent",
            borderColor: isActive
              ? isDark
                ? "rgba(162,207,163,0.8)"
                : "#22451C"
              : isDark
              ? "rgba(255,255,255,0.12)"
              : "rgba(162,207,163,0.8)",
            borderWidth: StyleSheet.hairlineWidth,
          },
          animStyle,
        ]}
        className="flex-row items-center gap-2"
      >
        {icon && (
          <Ionicons
            name={icon}
            size={14}
            color={
              isActive
                ? isDark
                  ? "#A2CFA3"
                  : "#FAFEEF"
                : isDark
                ? "rgba(248,250,252,0.7)"
                : "#22451C"
            }
          />
        )}
        <Text
          style={{
            color: isActive
              ? isDark
                ? "#A2CFA3"
                : "#FAFEEF"
              : isDark
              ? "rgba(248,250,252,0.7)"
              : "#22451C",
            fontFamily: "Quicksand_600SemiBold",
            fontSize: 13,
          }}
        >
          {label}
        </Text>

        {badge !== undefined && badge > 0 && (
          <View
            style={{
              backgroundColor: isActive
                ? isDark
                  ? "rgba(162,207,163,0.2)"
                  : "#FAFEEF"
                : isDark
                ? "rgba(255,255,255,0.1)"
                : "rgba(34,69,28,0.1)",
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: 10,
            }}
          >
            <Text
              style={{
                color: isActive
                  ? isDark
                    ? "#A2CFA3"
                    : "#22451C"
                  : isDark
                  ? "rgba(248,250,252,0.8)"
                  : "#22451C",
                fontFamily: "Quicksand_700Bold",
                fontSize: 10,
              }}
            >
              {badge}
            </Text>
          </View>
        )}
      </AnimatedTouchable>
    );
  };

  // ── Multi-select Header ──────────────────────────────────────────────────
  if (isSelecting) {
    return (
      <View
        style={{ backgroundColor: isDark ? "#0B120B" : "#FAFEEF" }}
        className="px-5 pt-5 pb-3"
      >
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={onCancelSelection} activeOpacity={0.7}>
              <Feather
                name="x"
                size={24}
                color={isDark ? "rgba(248,250,252,0.9)" : "#22451C"}
              />
            </TouchableOpacity>
            <Text
              style={{
                fontSize: 20,
                fontFamily: "Quicksand_700Bold",
                color: isDark ? "#F8FAFC" : "#22451C",
              }}
            >
              {selectedCount} Selected
            </Text>
          </View>

          <TouchableOpacity
            onPress={onDeleteSelected}
            disabled={selectedCount === 0}
            activeOpacity={0.7}
            style={{
              opacity: selectedCount === 0 ? 0.5 : 1,
              backgroundColor: isDark ? "rgba(239, 68, 68, 0.15)" : "#fee2e2",
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 12,
            }}
            className="flex-row items-center gap-2"
          >
            <Feather
              name="trash-2"
              size={16}
              color={isDark ? "#fca5a5" : "#dc2626"}
            />
            <Text
              style={{
                color: isDark ? "#fca5a5" : "#dc2626",
                fontFamily: "Quicksand_700Bold",
                fontSize: 13,
              }}
            >
              Delete
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Standard Header ──────────────────────────────────────────────────────
  return (
    <View style={{ backgroundColor: isDark ? "#0B120B" : "#FAFEEF" }} className="px-5 pt-5 pb-3">
      {/* ── Top Row: Title & Controls ──────────────────────────────────────── */}
      <View className="flex-row items-center justify-between mb-1">
        <Text
          style={{
            fontSize: 28,
            fontFamily: "serif",
            fontStyle: "italic",
            fontWeight: "500",
            letterSpacing: 0.3,
            color: isDark ? "#F8FAFC" : "#22451C",
          }}
        >
          Scan History
        </Text>

        <View className="flex-row gap-2">
          {/* View Mode Toggle */}
          <TouchableOpacity
            onPress={onViewModeChange}
            activeOpacity={0.7}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "#FAFEEF",
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: isDark ? "rgba(255,255,255,0.14)" : "#A2CFA3",
            }}
          >
            <Feather
              name={viewMode === "list" ? "grid" : "list"}
              size={18}
              color={isDark ? "rgba(226,232,240,0.85)" : "#22451C"}
            />
          </TouchableOpacity>

          {/* Sort Toggle */}
          <TouchableOpacity
            onPress={onSortChange}
            activeOpacity={0.7}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "#FAFEEF",
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: isDark ? "rgba(255,255,255,0.14)" : "#A2CFA3",
            }}
          >
            <Feather
              name="calendar"
              size={16}
              color={isDark ? "rgba(226,232,240,0.85)" : "#22451C"}
            />
            <View
              style={{
                position: "absolute",
                bottom: 8,
                right: 8,
                backgroundColor: isDark ? "#0B120B" : "#FAFEEF",
                borderRadius: 10,
                padding: 1,
              }}
            >
              <Feather
                name={sortBy === "newest" ? "arrow-down" : "arrow-up"}
                size={10}
                color={isDark ? "rgba(248,250,252,0.9)" : "#4D8035"}
              />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Subtitle: Total Count ───────────────────────────────────────────── */}
      <Text
        style={{
          color: isDark ? "rgba(248,250,252,0.45)" : "rgba(34,69,28,0.6)",
          fontFamily: "Quicksand_500Medium",
        }}
        className="text-sm mb-5"
      >
        {totalCount} {totalCount === 1 ? "Scan" : "Scans"} Total
      </Text>

      {/* ── Bottom Row: Filter Pills ────────────────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingRight: 16 }}
      >
        <FilterPill label="All Scans" tab="all" />
        <FilterPill
          label="Favorites"
          tab="favorites"
          icon={activeTab === "favorites" ? "heart" : "heart-outline"}
          badge={favoriteCount}
        />
      </ScrollView>
    </View>
  );
};