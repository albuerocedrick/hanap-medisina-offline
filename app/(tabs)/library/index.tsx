import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";


// 🌟 IMPORT PAGE TRANSITION
import { PageTransition } from "@/src/components/ui/PageTransition";

// Components
import { ScanDetailSheet } from "@/src/components/history/scan-detail-sheet";
import { FilterPills } from "@/src/components/library/filter-pills";
import { PlantCard } from "@/src/components/library/plant-card";
import { PlantGridCard } from "@/src/components/library/plant-grid-card";
import { SearchBar } from "@/src/components/library/search-bar";

// Stores
import { selectDisplayedPlants, useLibraryStore } from "@/src/store/useLibraryStore";
import { useTranslation } from "@/src/i18n/useTranslation";
import { useTheme } from "@/src/theme/useTheme";


export default function LibraryFeed() {
  const params = useLocalSearchParams();
  const scanIdFromParams = params?.scanId as string | undefined;
  const [selectedScanId, setSelectedScanId] = useState<string | null>(null);

  const theme = useTheme();
  const { t } = useTranslation();

  useEffect(() => {
    if (scanIdFromParams) {
      setSelectedScanId(scanIdFromParams);
    }
  }, [scanIdFromParams]);


  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const searchQuery = useLibraryStore((s) => s.searchQuery);
  const activeCategory = useLibraryStore((s) => s.activeCategory);
  const activeSymptom = useLibraryStore((s) => s.activeSymptom);
  const activePreparationMethod = useLibraryStore((s) => s.activePreparationMethod);
  const setActiveSymptom = useLibraryStore((s) => s.setActiveSymptom);
  const setActivePreparationMethod = useLibraryStore((s) => s.setActivePreparationMethod);
  const viewMode = useLibraryStore((s) => s.viewMode);
  const setViewMode = useLibraryStore((s) => s.setViewMode);
  const showFavoritesOnly = useLibraryStore((s) => s.showFavoritesOnly);
  const setShowFavoritesOnly = useLibraryStore((s) => s.setShowFavoritesOnly);

  const isLoadingPlants = useLibraryStore((s) => s.isLoadingPlants);
  const plantsError = useLibraryStore((s) => s.plantsError);

  const fetchPlants = useLibraryStore((s) => s.fetchPlants);
  const fetchPlantsByActiveCategory = useLibraryStore(
    (s) => s.fetchPlantsByActiveCategory,
  );
  const clearErrors = useLibraryStore((s) => s.clearErrors);
  const displayedPlants = useLibraryStore(selectDisplayedPlants);
  // Keep a single list instance in both layouts. FlatList cannot change
  // numColumns at runtime without remounting, so each virtualized item is a row.
  const plantRows = useMemo(() => {
    const columns = viewMode === "grid" ? 2 : 1;
    return Array.from({ length: Math.ceil(displayedPlants.length / columns) }, (_, index) =>
      displayedPlants.slice(index * columns, (index + 1) * columns));
  }, [displayedPlants, viewMode]);

  useEffect(() => {
    // Refresh the complete bundled catalog even if an older cache was partial.
    // Category/symptom filters are applied independently in getDisplayedPlants.
    fetchPlants();
  }, [fetchPlants]);

  const handleRefresh = useCallback(() => {
    clearErrors();
    fetchPlantsByActiveCategory();
  }, [fetchPlantsByActiveCategory, clearErrors]);

  const handleRetry = () => {
    clearErrors();
    fetchPlantsByActiveCategory();
  };

  const renderEmptyState = () => {
    if (isLoadingPlants && displayedPlants.length === 0) {
      return (
        <View className="flex-1 items-center justify-center pt-20 px-6">
          <ActivityIndicator size="large" color={theme.accent} />
          <Text 
            style={{ color: theme.textSecondary, fontFamily: "Quicksand_500Medium" }}
            className="mt-4 text-center"
          >
            {t('lib_loading')}
          </Text>
        </View>
      );
    }

    if (plantsError) {
      return (
        <View className="flex-1 items-center justify-center pt-20 px-6">
          <View 
            style={{ 
              width: 56, height: 56, borderRadius: 28, 
              backgroundColor: theme.dangerSubtle,
              borderWidth: StyleSheet.hairlineWidth, borderColor: theme.dangerBorder,
              alignItems: "center", justifyContent: "center", marginBottom: 16 
            }}
          >
            <Ionicons name="alert-circle-outline" size={28} color={theme.danger} />
          </View>
          <Text style={{ fontFamily: "serif", fontStyle: "italic", fontSize: 22, color: theme.textPrimary, textAlign: "center" }}>
            {t('lib_error_title')}
          </Text>
          <Text style={{ fontFamily: "Quicksand_500Medium", color: theme.textSecondary, textAlign: "center", marginTop: 8, marginBottom: 24 }}>
            {plantsError.message}
          </Text>
          <TouchableOpacity
            onPress={handleRetry}
            style={{
              backgroundColor: theme.accent,
              paddingHorizontal: 24, paddingVertical: 12, borderRadius: 16
            }}
          >
            <Text style={{ fontFamily: "Quicksand_700Bold", color: theme.textOnAccent }}>{t('lib_try_again')}</Text>
          </TouchableOpacity>
        </View>
      );
    }



    if (searchQuery.length > 0) {
      return (
        <View className="flex-1 items-center justify-center pt-20 px-6">
          <View 
            style={{ 
              width: 56, height: 56, borderRadius: 28, 
              backgroundColor: theme.accentSubtle,
              borderWidth: StyleSheet.hairlineWidth, borderColor: theme.borderSubtle,
              alignItems: "center", justifyContent: "center", marginBottom: 16 
            }}
          >
            <Ionicons name="search-outline" size={28} color={theme.iconInactive} />
          </View>
          <Text style={{ fontFamily: "serif", fontStyle: "italic", fontSize: 22, color: theme.textPrimary, textAlign: "center" }}>
            {t('lib_no_match_title')}
          </Text>
          <Text style={{ fontFamily: "Quicksand_500Medium", color: theme.textSecondary, textAlign: "center", marginTop: 8, lineHeight: 20 }}>
            {t('lib_no_match_body').replace('{query}', searchQuery)}
          </Text>
        </View>
      );
    }

    if (activeCategory) {
      return (
        <View className="flex-1 items-center justify-center pt-20 px-6">
          <View 
            style={{ 
              width: 56, height: 56, borderRadius: 28, 
              backgroundColor: theme.accentSubtle,
              borderWidth: StyleSheet.hairlineWidth, borderColor: theme.borderSubtle,
              alignItems: "center", justifyContent: "center", marginBottom: 16 
            }}
          >
            <Ionicons name="leaf-outline" size={28} color={theme.iconInactive} />
          </View>
          <Text style={{ fontFamily: "serif", fontStyle: "italic", fontSize: 22, color: theme.textPrimary, textAlign: "center" }}>
            {t('lib_cat_empty_title')}
          </Text>
          <Text style={{ fontFamily: "Quicksand_500Medium", color: theme.textSecondary, textAlign: "center", marginTop: 8, lineHeight: 20 }}>
            {t('lib_cat_empty_body').replace('{category}', activeCategory)}
          </Text>
        </View>
      );
    }

    if (activeSymptom) {
      return (
        <View className="flex-1 items-center justify-center pt-20 px-6">
          <View 
            style={{ 
              width: 56, height: 56, borderRadius: 28, 
              backgroundColor: theme.accentSubtle,
              borderWidth: StyleSheet.hairlineWidth, borderColor: theme.borderSubtle,
              alignItems: "center", justifyContent: "center", marginBottom: 16 
            }}
          >
            <Ionicons name="medkit-outline" size={28} color={theme.iconInactive} />
          </View>
          <Text style={{ fontFamily: "serif", fontStyle: "italic", fontSize: 22, color: theme.textPrimary, textAlign: "center" }}>
            {t('lib_no_plants_title')}
          </Text>
          <Text style={{ fontFamily: "Quicksand_500Medium", color: theme.textSecondary, textAlign: "center", marginTop: 8, lineHeight: 20 }}>
            {t('lib_no_plants_symptom')}
          </Text>
        </View>
      );
    }

    if (activePreparationMethod) {
      return (
        <View className="flex-1 items-center justify-center pt-20 px-6">
          <View 
            style={{ 
              width: 56, height: 56, borderRadius: 28, 
              backgroundColor: theme.accentSubtle,
              borderWidth: StyleSheet.hairlineWidth, borderColor: theme.borderSubtle,
              alignItems: "center", justifyContent: "center", marginBottom: 16 
            }}
          >
            <Ionicons name="flask-outline" size={28} color={theme.iconInactive} />
          </View>
          <Text style={{ fontFamily: "serif", fontStyle: "italic", fontSize: 22, color: theme.textPrimary, textAlign: "center" }}>
            {t('lib_no_plants_title')}
          </Text>
          <Text style={{ fontFamily: "Quicksand_500Medium", color: theme.textSecondary, textAlign: "center", marginTop: 8, lineHeight: 20 }}>
            {t('lib_no_plants_prep')}
          </Text>
        </View>
      );
    }

    return null;
  };

  const renderHeader = () => (
    <View className="pb-2">
      {activeSymptom && (
        <View className="mx-6 mt-4 flex-row items-center justify-between rounded-xl px-4 py-3" style={{ backgroundColor: theme.accentSubtle }}>
          <Text style={{ fontFamily: "Quicksand_600SemiBold", color: theme.textPrimary, flex: 1 }}>
            {t('lib_showing_symptom').replace('{symptom}', activeSymptom)}
          </Text>
          <TouchableOpacity onPress={() => setActiveSymptom(null)} style={{ padding: 4 }}>
            <Text style={{ fontFamily: "Quicksand_700Bold", color: theme.danger, fontSize: 14 }}>{t('lib_clear')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {activePreparationMethod && (
        <View className="mx-6 mt-4 flex-row items-center justify-between rounded-xl px-4 py-3" style={{ backgroundColor: theme.accentSubtle }}>
          <Text style={{ fontFamily: "Quicksand_600SemiBold", color: theme.textPrimary, flex: 1 }}>
            {t('lib_showing_prep').replace('{prep}', activePreparationMethod)}
          </Text>
          <TouchableOpacity onPress={() => setActivePreparationMethod(null)} style={{ padding: 4 }}>
            <Text style={{ fontFamily: "Quicksand_700Bold", color: theme.danger, fontSize: 14 }}>{t('lib_clear')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {(displayedPlants.length > 0 || showFavoritesOnly) && (
        <View className="mx-6 mt-4 mb-2 flex-row items-center justify-between">
          <Text style={{ fontFamily: "Quicksand_700Bold", color: theme.textMuted, fontSize: 12, letterSpacing: 0.5, textTransform: "uppercase" }}>
            {t('lib_plants_found').replace('{count}', displayedPlants.length.toString())}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity 
              onPress={() => setShowFavoritesOnly(!showFavoritesOnly)}
              accessibilityRole="button"
              accessibilityState={{ selected: showFavoritesOnly }}
              accessibilityLabel={t(showFavoritesOnly ? "a11y_show_all_plants" : "a11y_show_favorites")}
              style={{ padding: 4 }}
            >
              <Ionicons name={showFavoritesOnly ? 'heart' : 'heart-outline'} size={20} color={showFavoritesOnly ? theme.danger : (theme.textSecondary)} />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
              accessibilityRole="button"
              accessibilityLabel={t(viewMode === "list" ? "a11y_grid_view" : "a11y_list_view")}
              style={{ padding: 4 }}
            >
              <Ionicons name={viewMode === 'list' ? 'grid-outline' : 'list-outline'} size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <PageTransition className="flex-1">
      <SafeAreaView edges={["top"]} className="flex-1">
        {/* Search focus mode.
            The title and the filter pills are ~120pt of chrome that is useless
            while typing — on a small phone the keyboard plus that chrome left
            almost no room for results. Both now collapse away on focus (as the
            dashboard search already did) and animate back on cancel, so the
            search owns the screen while it is active. */}
        {!isSearchFocused && (
          <Animated.View
            entering={FadeIn.duration(180)}
            exiting={FadeOut.duration(120)}
            className="px-6 py-5 flex-row items-center justify-between"
          >
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
              {t('lib_title')}
            </Text>
          </Animated.View>
        )}

        <SearchBar onFocusChange={setIsSearchFocused} showSuggestions={false} />

        {!isSearchFocused && (
          <Animated.View
            entering={FadeIn.duration(180)}
            exiting={FadeOut.duration(120)}
          >
            <FilterPills />
          </Animated.View>
        )}


        <View className="flex-1 relative">
          <FlatList
            keyboardShouldPersistTaps="handled"
            onScrollBeginDrag={() => Keyboard.dismiss()}
            data={plantRows}
            keyExtractor={(row) => row[0].id}
            renderItem={({ item: row }) => viewMode === 'grid' ? (
              <View style={{ flexDirection: "row", paddingHorizontal: 18 }}>
                {row.map(plant => <View key={plant.id} style={{ flex: 1 }}><PlantGridCard plant={plant} /></View>)}
                {row.length === 1 && <View style={{ flex: 1 }} />}
              </View>
            ) : <PlantCard plant={row[0]} />}
            ListHeaderComponent={renderHeader}
            ListEmptyComponent={renderEmptyState}
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 140 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isLoadingPlants && displayedPlants.length > 0}
                onRefresh={handleRefresh}
                colors={[theme.accent]}
                tintColor={theme.accent}
              />
            }
          />
        </View>

        <ScanDetailSheet
          visible={selectedScanId !== null}
          scanId={selectedScanId}
          onClose={() => setSelectedScanId(null)}
        />
      </SafeAreaView>
    </PageTransition>
  );
}
