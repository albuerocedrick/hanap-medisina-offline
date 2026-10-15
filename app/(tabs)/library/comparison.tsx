import { useTheme } from "@/src/theme/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";

import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Components
import { PhysicalChecklistTable } from "@/src/components/comparison/physical-checklist";
import { PlantCard } from "@/src/components/library/plant-card";
import { SearchBar } from "@/src/components/library/search-bar";

// Services & Store
import { MedicinalPlant as Plant } from "@/src/types";
import { getPlantsByIds } from "@/src/services/localLibrary";
import { useLibraryStore } from "@/src/store/useLibraryStore";
import { ScreenHeader } from "@/src/components/ui/ScreenHeader";
import { useTranslation } from "@/src/i18n/useTranslation";



const PLACEHOLDER_IMAGE = require("../../../assets/images/plant-placeholder.jpg");

export default function PlantComparisonScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();


  const { t, language } = useTranslation();

  // Params from router (CompareTab passes these)
  const {
    plantAId,
    plantBId: initialPlantBId,
    pickMode,
  } = useLocalSearchParams<{
    plantAId: string;
    plantBId?: string;
    pickMode?: string;
  }>();

  // ─── Global State ────────────────────────────────────────────────────────

  const favorites = useLibraryStore((s) => s.favorites);
  const getDisplayedPlants = useLibraryStore((s) => s.getDisplayedPlants);

  // ─── Local State ─────────────────────────────────────────────────────────
  const [plantA, setPlantA] = useState<Plant | null>(null);
  const [plantB, setPlantB] = useState<Plant | null>(null);
  const [selectedPlantBId, setSelectedPlantBId] = useState<string | undefined>(
    initialPlantBId,
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state for picking Plant B
  const [isPickerOpen, setIsPickerOpen] = useState<boolean>(
    pickMode === "true" || !initialPlantBId,
  );

  // ─── Data Fetching ───────────────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;

    async function loadComparisonData() {
      if (!plantAId) {
        if (isMounted) setError(t('compare_primary_missing'));
        return;
      }

      setIsLoading(true);
      setError(null);

      const idsToFetch = [plantAId];
      if (selectedPlantBId) idsToFetch.push(selectedPlantBId);

      try {
        const plants = getPlantsByIds(idsToFetch);
        if (isMounted) {
          const a = plants.find((p) => p.id === plantAId) || null;
          const b = plants.find((p) => p.id === selectedPlantBId) || null;
          setPlantA(a);
          setPlantB(b);

          if (!a) {
            setError(t('compare_primary_not_found'));
          } else if (selectedPlantBId && !b) {
            setError(t('compare_selected_not_found'));
          }
        }
      } catch (err) {
        if (isMounted) setError(t('compare_load_failed'));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadComparisonData();

    return () => {
      isMounted = false;
    };
  }, [plantAId, selectedPlantBId, favorites, language]);

  // ─── Render Helpers ──────────────────────────────────────────────────────

  // Plant B Picker Modal Content
  const renderPickerModal = () => {
    // Exclude Plant A from the choices so you don't compare a plant to itself
    const pickerData = getDisplayedPlants().filter((p) => p.id !== plantAId);

    return (
      <Modal
        visible={isPickerOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsPickerOpen(false)}
      >
        <View
          style={{ flex: 1, backgroundColor: theme.bg, paddingTop: Platform.OS === "ios" ? 0 : insets.top }}
        >
          {/* Header */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border }}>
            <Text style={{ fontFamily: "serif", fontStyle: "italic", fontSize: 20, color: theme.textPrimary }}>
              {t('compare_select_title')}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setIsPickerOpen(false);
                if (!plantB) router.back(); // Auto-go back if they abort initial pick
              }}
            >
              <Ionicons name="close" size={24} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <SearchBar placeholder={t('compare_search')} showSuggestions={false} />

          <FlatList
            data={pickerData}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingVertical: 16 }}
            renderItem={({ item }) => (
              <PlantCard
                plant={item}
                hideFavoriteIndicator
                hideCategoryChips
                onPress={(selected) => {
                  setSelectedPlantBId(selected.id);
                  setIsPickerOpen(false);
                }}
              />
            )}
            ListEmptyComponent={
              <View style={{ paddingTop: 40, alignItems: "center" }}>
                <Text style={{ fontFamily: "Quicksand_500Medium", color: theme.textSecondary }}>
                  {t('compare_no_plants')}
                </Text>
              </View>
            }
          />
        </View>
      </Modal>
    );
  };

  // Each of these three states now renders the same in-content ScreenHeader.
  // Previously the back affordance came from the stack's native header, so the
  // loading and error states inherited a bare title with no themed control —
  // and on Android the solid green bar clashed with the screen beneath it.
  if (isLoading && !isPickerOpen) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg, paddingTop: insets.top }}>
        <ScreenHeader title={t('details_compare')} fallbackHref="/(tabs)/library" />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      </View>
    );
  }

  if (error || !plantA) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg, paddingTop: insets.top }}>
        <ScreenHeader title={t('details_compare')} fallbackHref="/(tabs)/library" />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }}>
          <Ionicons name="alert-circle-outline" size={48} color={theme.danger} />
          <Text style={{ fontFamily: "Quicksand_500Medium", color: theme.textSecondary, marginTop: 16, textAlign: "center", marginBottom: 24 }}>
            {error || t('compare_unavailable')}
          </Text>
          <TouchableOpacity
            onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)/library"))}
            accessibilityRole="button"
            style={{ backgroundColor: theme.surfaceHighlight, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border }}
          >
            <Text style={{ fontFamily: "Quicksand_700Bold", color: theme.textPrimary }}>{t('details_go_back')}</Text>
          </TouchableOpacity>
        </View>
        {renderPickerModal()}
      </View>
    );
  }


  // ─── Main Comparison Render ──────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: theme.bg, paddingTop: insets.top }}>
      <ScreenHeader
        title={t('details_compare')}
        subtitle={plantB ? `${plantA.name} vs ${plantB.name}` : plantA.name}
        fallbackHref="/(tabs)/library"
        bordered
      />

      <ScrollView

        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
      >
        {/* ─── Top: Side-by-Side Images ─────────────────────────────────────── */}
        <View style={{ flexDirection: "row", height: 256, width: "100%", backgroundColor: theme.surfaceHighlight, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border }}>
          {/* Plant A (Left) */}
          <View style={{ flex: 1, position: "relative", borderRightWidth: StyleSheet.hairlineWidth, borderColor: theme.border }}>
            <Image
              source={
                plantA.imageUrl ? { uri: plantA.imageUrl } : PLACEHOLDER_IMAGE
              }
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
            <LinearGradient
              colors={theme.imageGradient}
              locations={[0, 0.5, 1]}
              style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingTop: 60, paddingBottom: 12, paddingHorizontal: 12 }}
            >
              <Text style={{ color: theme.onImage, fontFamily: "serif", fontStyle: "italic", fontSize: 16, fontWeight: "600", textShadowColor: theme.scrim, textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }} numberOfLines={2}>
                {plantA.name}
              </Text>
            </LinearGradient>
          </View>

          {/* Plant B (Right) */}
          <View style={{ flex: 1, position: "relative" }}>
            {plantB ? (
              <>
                <Image
                  source={
                    plantB.imageUrl
                      ? { uri: plantB.imageUrl }
                      : PLACEHOLDER_IMAGE
                  }
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="cover"
                />
                  <LinearGradient
                    colors={theme.imageGradient}
                    locations={[0, 0.5, 1]}
                    style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingTop: 60, paddingBottom: 12, paddingHorizontal: 12 }}
                  >
                    <Text style={{ color: theme.onImage, fontFamily: "serif", fontStyle: "italic", fontSize: 16, fontWeight: "600", textShadowColor: theme.scrim, textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }} numberOfLines={2}>
                      {plantB.name}
                    </Text>
                  </LinearGradient>
                  {/* Change Plant Button */}
                  <TouchableOpacity
                    onPress={() => setIsPickerOpen(true)}
                    style={{ position: "absolute", top: 12, right: 12, backgroundColor: theme.scrim, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, flexDirection: "row", alignItems: "center", borderWidth: StyleSheet.hairlineWidth, borderColor: theme.imageBorder }}
                  >
                    <Ionicons name="swap-horizontal" size={12} color={theme.onImage} />
                    <Text style={{ color: theme.onImage, fontSize: 10, fontFamily: "Quicksand_700Bold", marginLeft: 4, textTransform: "uppercase" }}>
                      {t('compare_change')}
                    </Text>
                  </TouchableOpacity>
              </>
            ) : (
              // Empty Slot State
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setIsPickerOpen(true)}
                style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.surfaceHighlight }}
              >
                <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: theme.surfaceHighlight, borderWidth: 1, borderStyle: "dashed", borderColor: theme.border, alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="add" size={28} color={theme.textSecondary} />
                </View>
                <Text style={{ fontFamily: "Quicksand_600SemiBold", color: theme.textSecondary, fontSize: 13, marginTop: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {t('compare_select')}
                </Text>
              </TouchableOpacity>
            )}
          </View>

        </View>

        {/* ─── Bottom: Physical Checklist ─────────────────────────────────── */}
        <View style={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 8 }}>
          <Text style={{ fontFamily: "serif", fontStyle: "italic", fontSize: 20, color: theme.textPrimary, marginBottom: 4 }}>
            {t('compare_checklist')}
          </Text>
          <Text style={{ fontFamily: "Quicksand_500Medium", color: theme.textSecondary, fontSize: 14, lineHeight: 20, marginBottom: 20 }}>
            {t('compare_checklist_hint')}
          </Text>

          {plantB ? (
            <PhysicalChecklistTable
              traitsA={plantA.comparisonTraits}
              traitsB={plantB.comparisonTraits}
              plantNameA={plantA.name}
              plantNameB={plantB.name}
            />
          ) : (
            <View style={{ backgroundColor: theme.surfaceHighlight, borderRadius: 16, padding: 32, alignItems: "center", borderWidth: StyleSheet.hairlineWidth, borderColor: theme.borderSubtle }}>
              <Ionicons name="git-compare-outline" size={36} color={theme.textSecondary} />
              <Text style={{ fontFamily: "Quicksand_500Medium", color: theme.textSecondary, marginTop: 12, textAlign: "center" }}>
                {t('compare_second_plant')}
              </Text>
              <TouchableOpacity
                onPress={() => setIsPickerOpen(true)}
                style={{ marginTop: 16, backgroundColor: theme.accentSubtle, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.accentSoftBorder }}
              >
                <Text style={{ fontFamily: "Quicksand_700Bold", color: theme.accent }}>{t('compare_choose')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Render the internal picker modal */}
      {renderPickerModal()}
    </View>
  );
}
