import { useTheme } from "@/src/theme/useTheme";
/**
 * components/MedicinalPlant-details/CompareTab.tsx
 *
 * Renders the "Compare" sub-tab on the MedicinalPlant detail screen.
 *
 * Two responsibilities:
 *  1. Displays look-alike plants (pre-fetched by [id].tsx via getPlantsByIds)
 *     as tappable cards — tapping one navigates directly to comparison.tsx
 *     with that pair pre-loaded.
 *  2. "Select from Library" CTA — opens comparison.tsx in pick mode so the
 *     user can choose any MedicinalPlant for a 1v1 comparison.
 *
 * This component is purely presentational — all fetching happens in [id].tsx.
 */

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Image,
  ImageErrorEventData,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MedicinalPlant } from "@/src/services/localLibrary";

import { StyleSheet } from "react-native";
import { useTranslation } from "@/src/i18n/useTranslation";

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────

const PLACEHOLDER_IMAGE = require("../../../assets/images/plant-placeholder.jpg");

// ─────────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────────

interface CompareTabProps {
  /** The current MedicinalPlant being viewed — always the "left" side of any comparison. */
  currentPlantId: string;
  currentPlantName: string;
  /**
   * Look-alike plants pre-fetched by the parent screen.
   * Empty array is a valid state — shows the "no look-alikes" empty state.
   */
  lookAlikePlants: MedicinalPlant[];
  /** True while the parent is fetching look-alikes. Shows a skeleton. */
  isLoadingLookAlikes?: boolean;
}

// ─────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────

function LookAlikeCard({
  plant,
  onPress,
}: {
  plant: MedicinalPlant;
  onPress: () => void;
}) {
  const theme = useTheme();
  const [imgError, setImgError] = React.useState(false);


  const { t } = useTranslation();

  if (!plant?.id) return null;

  const handleImageError = (_: NativeSyntheticEvent<ImageErrorEventData>) => {
    setImgError(true);
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={t('compare_with').replace('{name}', plant.name)}
      style={{ marginRight: 12 }}
    >
      <View
        style={{
          width: 144,
          backgroundColor: "transparent",
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.border,
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        {/* Image */}
        <Image
          source={
            !imgError && plant.imageUrl
              ? { uri: plant.imageUrl }
              : PLACEHOLDER_IMAGE
          }
          style={{ width: "100%", height: 112 }}
          resizeMode="cover"
          onError={handleImageError}
          accessibilityLabel={t('plant_image').replace('{name}', plant.name)}
        />

        {/* Info */}
        <View style={{ paddingHorizontal: 10, paddingVertical: 8, backgroundColor: theme.surface }}>
          <Text
            style={{ fontFamily: "Quicksand_700Bold", color: theme.textPrimary, fontSize: 13 }}
            numberOfLines={1}
          >
            {plant.name}
          </Text>
          <Text
            style={{ fontFamily: "Quicksand_500Medium", color: theme.textSecondary, fontSize: 11, fontStyle: "italic", marginTop: 2 }}
            numberOfLines={1}
          >
            {plant.scientificName}
          </Text>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 6, backgroundColor: theme.accentSubtle, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.borderSubtle }}>
          <Ionicons name="git-compare-outline" size={11} color={theme.accent} />
          <Text style={{ fontFamily: "Quicksand_700Bold", color: theme.accent, fontSize: 11, marginLeft: 4 }}>
            {t('details_compare')}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function LookAlikeSkeletonCard() {
  const theme = useTheme();



  return (
    <View
      style={{
        width: 144, height: 176, marginRight: 12, borderRadius: 16,
        backgroundColor: theme.surfaceHighlight,
      }}
      accessibilityElementsHidden
    />
  );
}

// ─────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────

export function CompareTab({
  currentPlantId,
  currentPlantName,
  lookAlikePlants,
  isLoadingLookAlikes = false,
}: CompareTabProps) {
  const theme = useTheme();
  const router = useRouter();


  const { t } = useTranslation();

  // ── Guard ─────────────────────────────────────────────────────────────────
  if (!currentPlantId) {
    if (__DEV__) console.warn(
      "[CompareTab] currentPlantId is required but was not provided.",
    );
    return null;
  }

  const safeLookAlikes = Array.isArray(lookAlikePlants)
    ? lookAlikePlants.filter((p) => p?.id && p.id !== currentPlantId)
    : [];

  // ── Navigation helpers ────────────────────────────────────────────────────

  const handleCompareWith = (targetPlant: MedicinalPlant) => {
    try {
      router.push({
        pathname: "/(tabs)/library/comparison",
        params: {
          plantAId: currentPlantId,
          plantBId: targetPlant.id,
        },
      });
    } catch (err) {
      if (__DEV__) console.error(
        `[CompareTab] Navigation to comparison failed (${currentPlantId} vs ${targetPlant.id}):`,
        err,
      );
    }
  };

  const handleSelectFromLibrary = () => {
    try {
      router.push({
        pathname: "/library/comparison",
        params: {
          plantAId: currentPlantId,
          pickMode: "true", // comparison.tsx opens the library sheet for plantB
        },
      });
    } catch (err) {
      if (__DEV__) console.error("[CompareTab] Navigation to pick mode failed:", err);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Section: Look-alikes ───────────────────────────────────────────── */}
      <View style={{ marginBottom: 24 }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
          <View style={{ backgroundColor: theme.accentSubtle, borderRadius: 8, padding: 6, marginRight: 8 }}>
            <Ionicons name="copy-outline" size={16} color={theme.accent} />
          </View>
          <Text style={{ fontFamily: "Quicksand_700Bold", color: theme.textPrimary, fontSize: 13, textTransform: "uppercase", letterSpacing: 0.5 }}>
            {t('details_lookalike')}
          </Text>
        </View>

        {isLoadingLookAlikes ? (
          // Skeleton row
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[1, 2, 3].map((i) => (
              <LookAlikeSkeletonCard key={i} />
            ))}
          </ScrollView>
        ) : safeLookAlikes.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {safeLookAlikes.map((plant) => (
              <LookAlikeCard
                key={plant.id}
                plant={plant}
                onPress={() => handleCompareWith(plant)}
              />
            ))}
          </ScrollView>
        ) : (
          // Empty state
          <View style={{ backgroundColor: theme.surfaceHighlight, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 24, alignItems: "center" }}>
            <Ionicons name="leaf-outline" size={28} color={theme.border} />
            <Text style={{ fontFamily: "Quicksand_500Medium", color: theme.textSecondary, fontSize: 13, textAlign: "center", marginTop: 8 }}>
              {t('details_no_lookalike').replace('{name}', currentPlantName)}
            </Text>
          </View>
        )}
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 24 }}>
        <View style={{ flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: theme.surfaceTint }} />
        <Text style={{ fontFamily: "Quicksand_600SemiBold", color: theme.textSecondary, fontSize: 12, paddingHorizontal: 12 }}>{t('details_or')}</Text>
        <View style={{ flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: theme.surfaceTint }} />
      </View>

      <View style={{ backgroundColor: theme.accentSubtle, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.accentSoftBorder, borderRadius: 16, padding: 16 }}>
        <Text style={{ fontFamily: "Quicksand_700Bold", color: theme.accent, fontSize: 14, marginBottom: 4 }}>
          {t('details_compare_any_title')}
        </Text>
        <Text style={{ fontFamily: "Quicksand_500Medium", color: theme.textPrimary, fontSize: 12, lineHeight: 18, marginBottom: 16 }}>
          {t('details_compare_any_body').replace('{name}', currentPlantName)}
        </Text>

        <TouchableOpacity
          onPress={handleSelectFromLibrary}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={t('details_compare_btn')}
        >
          <View style={{ backgroundColor: theme.accentSubtle, borderRadius: 12, paddingVertical: 12, flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
            <Ionicons
              name="git-compare-outline"
              size={16}
              color={theme.selectionText}
              style={{ marginRight: 8 }}
            />
            <Text style={{ fontFamily: "Quicksand_700Bold", color: theme.selectionText, fontSize: 13 }}>
              {t('details_compare_btn')}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

