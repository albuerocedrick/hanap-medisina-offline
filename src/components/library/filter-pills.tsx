import { useTheme } from "@/src/theme/useTheme";
/**
 * components/library/FilterPills.tsx
 *
 * Horizontal scrollable category filter pills.
 * Wired to useLibraryStore — setting a category triggers a
 * re-fetch of plants, or client-side filtering on favorites offline.
 *
 * "All" is always the first pill and represents null (no filter).
 */

import React, { useEffect, useRef } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  selectActiveCategory,
  selectCategories,
  useLibraryStore,
} from "@/src/store/useLibraryStore";
import { useTranslation } from "@/src/i18n/useTranslation";
import { getPlantCategoryLabel } from "@/src/i18n/plantLabels";


const ALL_LABEL = "All";
const SKELETON_COUNT = 5;
const SKELETON_WIDTHS = [48, 64, 56, 72, 52];

interface FilterPillsProps {
  onCategoryChange?: (category: string | null) => void;
}

function SkeletonPill({ width }: { width: number }) {
  const theme = useTheme();



  return (
    <View
      style={{
        width, height: 36, borderRadius: 18,
        backgroundColor: theme.surfaceHighlight,
        marginRight: 8,
      }}
      accessibilityElementsHidden
    />
  );
}

interface PillProps {
  label: string;
  isActive: boolean;
  isDisabled: boolean;
  onPress: () => void;
}

function Pill({ label, isActive, isDisabled, onPress }: PillProps) {
  const theme = useTheme();
  const { t } = useTranslation();



  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive, disabled: isDisabled }}
      accessibilityLabel={t("a11y_filter").replace("{label}", label)}
      style={{ marginRight: 8, opacity: isDisabled ? 0.5 : 1 }}
    >
      <View
        style={{
          height: 36, paddingHorizontal: 16, borderRadius: 18,
          alignItems: "center", justifyContent: "center",
          backgroundColor: isActive
            ? (theme.selectionSurface)
            : (theme.surfaceHighlight),
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: isActive
            ? (theme.selectionBorder)
            : (theme.border),
        }}
      >
        <Text
          style={{
            fontFamily: "Quicksand_600SemiBold",
            fontSize: 13,
            color: isActive
              ? (theme.selectionText)
              : (theme.textPrimary)
          }}
          numberOfLines={1}
        >
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export function FilterPills({ onCategoryChange }: FilterPillsProps) {
  const categories = useLibraryStore(selectCategories);
  const activeCategory = useLibraryStore(selectActiveCategory);
  const setActiveCategory = useLibraryStore((s) => s.setActiveCategory);
  const fetchCategories = useLibraryStore((s) => s.fetchCategories);
  const isLoadingCategories = useLibraryStore((s) => s.isLoadingCategories);
  const categoriesError = useLibraryStore((s) => s.categoriesError);
  const { t, language } = useTranslation();

  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (categories.length === 0) {
      fetchCategories();
    }
  }, []);

  const handleSelect = (category: string | null) => {
    try {
      setActiveCategory(category);
      onCategoryChange?.(category);
      if (category === null) {
        scrollRef.current?.scrollTo({ x: 0, animated: true });
      }
    } catch (err) {
      if (__DEV__) console.error("[FilterPills] handleSelect failed:", err);
    }
  };

  if (isLoadingCategories) {
    return (
      <View className="py-2">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24 }}
          scrollEnabled={false}
        >
          <SkeletonPill width={48} />
          {SKELETON_WIDTHS.map((w, i) => (
            <SkeletonPill key={i} width={w} />
          ))}
        </ScrollView>
      </View>
    );
  }

  if (categoriesError && categories.length === 0) {
    return null;
  }



  return (
    <View className="py-2 mb-2">
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24 }}
        keyboardShouldPersistTaps="handled"
        accessibilityRole="menu"
      >
        <Pill
          label={t('lib_filter_all')}
          isActive={activeCategory === null}
          isDisabled={false}
          onPress={() => handleSelect(null)}
        />

        {categories.map((cat) => (
          <Pill
            key={cat}
            label={getPlantCategoryLabel(cat, language)}
            isActive={activeCategory === cat}
            isDisabled={false}
            onPress={() => handleSelect(cat)}
          />
        ))}
      </ScrollView>
    </View>
  );
}
