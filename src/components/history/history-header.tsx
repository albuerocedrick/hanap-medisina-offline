import { useTheme } from "@/src/theme/useTheme";
/**
 * src/components/history/history-header.tsx
 * Unified Scan History Header — HanapMedisina (Local Offline Edition)
 */

import { Feather, Ionicons } from "@expo/vector-icons";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useTranslation } from "@/src/i18n/useTranslation";

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
  const theme = useTheme();


  const { t } = useTranslation();

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
  const theme = useTheme();
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
              ? theme.selectionSurface
              : theme.surfaceHighlight,
            borderColor: isActive
              ? theme.selectionBorder
              : theme.border,
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
                ? theme.selectionText
                : theme.textPrimary
            }
          />
        )}
        <Text
          style={{
            color: isActive
              ? theme.selectionText
              : theme.textPrimary,
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
                ? theme.selectionText
                : theme.surfaceTint,
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: 10,
            }}
          >
            <Text
              style={{
                color: isActive
                  ? theme.accent
                  : theme.textPrimary,
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
        style={{ backgroundColor: theme.bg }}
        className="px-5 pt-5 pb-3"
      >
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={onCancelSelection} activeOpacity={0.7}>
              <Feather
                name="x"
                size={24}
                color={theme.textPrimary}
              />
            </TouchableOpacity>
            <Text
              style={{
                fontSize: 20,
                fontFamily: "Quicksand_700Bold",
                color: theme.textPrimary,
              }}
            >
              {selectedCount} {t('history_selected')}
            </Text>
          </View>

          <TouchableOpacity
            onPress={onDeleteSelected}
            disabled={selectedCount === 0}
            activeOpacity={0.7}
            style={{
              opacity: selectedCount === 0 ? 0.5 : 1,
                backgroundColor: theme.dangerSubtle,
                borderWidth: 1, borderColor: theme.dangerBorder,
                paddingHorizontal: 14, minHeight: 46, borderRadius: 14,
                flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center",
            }}
              accessibilityRole="button"
              accessibilityLabel={t("history_delete")}
          >
            <Feather
              name="trash-2"
              size={16}
              color={theme.danger}
            />
            <Text
              style={{
                color: theme.danger,
                fontFamily: "Quicksand_700Bold",
                fontSize: 13,
              }}
            >
              {t('history_delete')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Standard Header ──────────────────────────────────────────────────────
  return (
    <View style={{ backgroundColor: theme.bg }} className="px-5 pt-5 pb-3">
      {/* ── Top Row: Title & Controls ──────────────────────────────────────── */}
      <View className="flex-row items-center justify-between mb-1">
          <Text
            style={{
              fontSize: 28,
              fontFamily: "serif",
              fontStyle: "italic",
              fontWeight: "500",
              letterSpacing: 0.3,
              color: theme.textPrimary,
            }}
          >
            {t('history_title')}
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
              backgroundColor: theme.surface,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: theme.border,
            }}
          >
            <Feather
              name={viewMode === "list" ? "grid" : "list"}
              size={18}
              color={theme.textPrimary}
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
              backgroundColor: theme.surface,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: theme.border,
            }}
          >
            <Feather
              name="calendar"
              size={16}
              color={theme.textPrimary}
            />
            <View
              style={{
                position: "absolute",
                bottom: 8,
                right: 8,
                backgroundColor: theme.bg,
                borderRadius: 10,
                padding: 1,
              }}
            >
              <Feather
                name={sortBy === "newest" ? "arrow-down" : "arrow-up"}
                size={10}
                color={theme.textSecondary}
              />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Subtitle: Total Count ───────────────────────────────────────────── */}
      <Text
        style={{
          color: theme.textSecondary,
          fontFamily: "Quicksand_500Medium",
        }}
        className="text-sm mb-5"
      >
        {totalCount} {t('history_total')}
      </Text>

      {/* ── Bottom Row: Filter Pills ────────────────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingRight: 16 }}
      >
        <FilterPill label={t('history_all_scans')} tab="all" />
        <FilterPill
          label={t('history_favorites')}
          tab="favorites"
          icon={activeTab === "favorites" ? "heart" : "heart-outline"}
          badge={favoriteCount}
        />
      </ScrollView>
    </View>
  );
};
