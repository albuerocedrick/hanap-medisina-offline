import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useColorScheme } from "nativewind";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// 🌟 IMPORT PAGE TRANSITION
import { PageTransition } from "@/src/components/ui/PageTransition";

// Components
import { ScanDetailSheet } from "@/src/components/history/scan-detail-sheet";
import { FilterPills } from "@/src/components/library/filter-pills";
import { PlantCard } from "@/src/components/library/plant-card";
import { PlantGridCard } from "@/src/components/library/plant-grid-card";
import { SearchBar } from "@/src/components/library/search-bar";

// Stores
import { useLibraryStore } from "@/src/store/useLibraryStore";


export default function LibraryFeed() {
  const params = useLocalSearchParams();
  const scanIdFromParams = params?.scanId as string | undefined;
  const [selectedScanId, setSelectedScanId] = useState<string | null>(null);

  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  useEffect(() => {
    if (scanIdFromParams) {
      setSelectedScanId(scanIdFromParams);
    }
  }, [scanIdFromParams]);


  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const plants = useLibraryStore((s) => s.plants);
  const favorites = useLibraryStore((s) => s.favorites);
  const searchQuery = useLibraryStore((s) => s.searchQuery);
  const activeCategory = useLibraryStore((s) => s.activeCategory);
  const activeSymptom = useLibraryStore((s) => s.activeSymptom);
  const activePreparationMethod = useLibraryStore((s) => s.activePreparationMethod);
  const setActiveSymptom = useLibraryStore((s) => s.setActiveSymptom);
  const setActivePreparationMethod = useLibraryStore((s) => s.setActivePreparationMethod);
  const viewMode = useLibraryStore((s) => s.viewMode);
  const setViewMode = useLibraryStore((s) => s.setViewMode);

  const isLoadingPlants = useLibraryStore((s) => s.isLoadingPlants);
  const plantsError = useLibraryStore((s) => s.plantsError);

  const fetchPlants = useLibraryStore((s) => s.fetchPlants);
  const fetchPlantsByActiveCategory = useLibraryStore(
    (s) => s.fetchPlantsByActiveCategory,
  );
  const clearErrors = useLibraryStore((s) => s.clearErrors);
  const getDisplayedPlants = useLibraryStore((s) => s.getDisplayedPlants);

  const displayedPlants = getDisplayedPlants();

  useEffect(() => {
    // Only fetch all plants if no filter is active
    if (!activeCategory && !activeSymptom && !activePreparationMethod) {
      if (plants.length === 0) fetchPlants();
    }
  }, [activeCategory, activeSymptom, activePreparationMethod, plants.length, fetchPlants]);

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
          <ActivityIndicator size="large" color={isDark ? "#A2CFA3" : "#22451C"} />
          <Text 
            style={{ color: isDark ? "rgba(248,250,252,0.5)" : "rgba(34,69,28,0.6)", fontFamily: "Quicksand_500Medium" }}
            className="mt-4 text-center"
          >
            Loading plant library...
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
              backgroundColor: isDark ? "rgba(239,68,68,0.1)" : "rgba(239,68,68,0.05)",
              borderWidth: StyleSheet.hairlineWidth, borderColor: isDark ? "rgba(239,68,68,0.3)" : "rgba(239,68,68,0.2)",
              alignItems: "center", justifyContent: "center", marginBottom: 16 
            }}
          >
            <Ionicons name="alert-circle-outline" size={28} color="#ef4444" />
          </View>
          <Text style={{ fontFamily: "serif", fontStyle: "italic", fontSize: 22, color: isDark ? "#F8FAFC" : "#22451C", textAlign: "center" }}>
            Failed to Load Library
          </Text>
          <Text style={{ fontFamily: "Quicksand_500Medium", color: isDark ? "rgba(248,250,252,0.6)" : "rgba(34,69,28,0.6)", textAlign: "center", marginTop: 8, marginBottom: 24 }}>
            {plantsError.message}
          </Text>
          <TouchableOpacity
            onPress={handleRetry}
            style={{
              backgroundColor: isDark ? "#22451C" : "#A2CFA3",
              paddingHorizontal: 24, paddingVertical: 12, borderRadius: 16
            }}
          >
            <Text style={{ fontFamily: "Quicksand_700Bold", color: isDark ? "#F8FAFC" : "#22451C" }}>Try Again</Text>
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
              backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(162,207,163,0.15)",
              borderWidth: StyleSheet.hairlineWidth, borderColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(162,207,163,0.5)",
              alignItems: "center", justifyContent: "center", marginBottom: 16 
            }}
          >
            <Ionicons name="search-outline" size={28} color={isDark ? "rgba(248,250,252,0.5)" : "rgba(34,69,28,0.5)"} />
          </View>
          <Text style={{ fontFamily: "serif", fontStyle: "italic", fontSize: 22, color: isDark ? "#F8FAFC" : "#22451C", textAlign: "center" }}>
            No matching plants
          </Text>
          <Text style={{ fontFamily: "Quicksand_500Medium", color: isDark ? "rgba(248,250,252,0.6)" : "rgba(34,69,28,0.6)", textAlign: "center", marginTop: 8, lineHeight: 20 }}>
            We couldn't find anything matching "{searchQuery}". Try adjusting your search or category filter.
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
              backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(162,207,163,0.15)",
              borderWidth: StyleSheet.hairlineWidth, borderColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(162,207,163,0.5)",
              alignItems: "center", justifyContent: "center", marginBottom: 16 
            }}
          >
            <Ionicons name="leaf-outline" size={28} color={isDark ? "rgba(248,250,252,0.5)" : "rgba(34,69,28,0.5)"} />
          </View>
          <Text style={{ fontFamily: "serif", fontStyle: "italic", fontSize: 22, color: isDark ? "#F8FAFC" : "#22451C", textAlign: "center" }}>
            Category is empty
          </Text>
          <Text style={{ fontFamily: "Quicksand_500Medium", color: isDark ? "rgba(248,250,252,0.6)" : "rgba(34,69,28,0.6)", textAlign: "center", marginTop: 8, lineHeight: 20 }}>
            There are currently no plants available under the "{activeCategory}" category.
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
              backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(162,207,163,0.15)",
              borderWidth: StyleSheet.hairlineWidth, borderColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(162,207,163,0.5)",
              alignItems: "center", justifyContent: "center", marginBottom: 16 
            }}
          >
            <Ionicons name="medkit-outline" size={28} color={isDark ? "rgba(248,250,252,0.5)" : "rgba(34,69,28,0.5)"} />
          </View>
          <Text style={{ fontFamily: "serif", fontStyle: "italic", fontSize: 22, color: isDark ? "#F8FAFC" : "#22451C", textAlign: "center" }}>
            No plants found
          </Text>
          <Text style={{ fontFamily: "Quicksand_500Medium", color: isDark ? "rgba(248,250,252,0.6)" : "rgba(34,69,28,0.6)", textAlign: "center", marginTop: 8, lineHeight: 20 }}>
            No plants found for this symptom.
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
              backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(162,207,163,0.15)",
              borderWidth: StyleSheet.hairlineWidth, borderColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(162,207,163,0.5)",
              alignItems: "center", justifyContent: "center", marginBottom: 16 
            }}
          >
            <Ionicons name="flask-outline" size={28} color={isDark ? "rgba(248,250,252,0.5)" : "rgba(34,69,28,0.5)"} />
          </View>
          <Text style={{ fontFamily: "serif", fontStyle: "italic", fontSize: 22, color: isDark ? "#F8FAFC" : "#22451C", textAlign: "center" }}>
            No plants found
          </Text>
          <Text style={{ fontFamily: "Quicksand_500Medium", color: isDark ? "rgba(248,250,252,0.6)" : "rgba(34,69,28,0.6)", textAlign: "center", marginTop: 8, lineHeight: 20 }}>
            No plants with this preparation method.
          </Text>
        </View>
      );
    }

    return null;
  };

  const renderHeader = () => (
    <View className="pb-2">
      {activeSymptom && (
        <View className="mx-6 mt-4 flex-row items-center justify-between rounded-xl px-4 py-3" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(162,207,163,0.2)" }}>
          <Text style={{ fontFamily: "Quicksand_600SemiBold", color: isDark ? "#F8FAFC" : "#22451C", flex: 1 }}>
            Showing plants for: "{activeSymptom}"
          </Text>
          <TouchableOpacity onPress={() => setActiveSymptom(null)} style={{ padding: 4 }}>
            <Text style={{ fontFamily: "Quicksand_700Bold", color: isDark ? "#ef4444" : "#dc2626", fontSize: 14 }}>✕ Clear</Text>
          </TouchableOpacity>
        </View>
      )}

      {activePreparationMethod && (
        <View className="mx-6 mt-4 flex-row items-center justify-between rounded-xl px-4 py-3" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(162,207,163,0.2)" }}>
          <Text style={{ fontFamily: "Quicksand_600SemiBold", color: isDark ? "#F8FAFC" : "#22451C", flex: 1 }}>
            Preparation: "{activePreparationMethod}"
          </Text>
          <TouchableOpacity onPress={() => setActivePreparationMethod(null)} style={{ padding: 4 }}>
            <Text style={{ fontFamily: "Quicksand_700Bold", color: isDark ? "#ef4444" : "#dc2626", fontSize: 14 }}>✕ Clear</Text>
          </TouchableOpacity>
        </View>
      )}

      {displayedPlants.length > 0 && (
        <View className="mx-6 mt-4 mb-2 flex-row items-center justify-between">
          <Text style={{ fontFamily: "Quicksand_700Bold", color: isDark ? "rgba(248,250,252,0.4)" : "rgba(34,69,28,0.5)", fontSize: 12, letterSpacing: 0.5, textTransform: "uppercase" }}>
            {displayedPlants.length} {displayedPlants.length === 1 ? "Plant" : "Plants"} Found
          </Text>
          <TouchableOpacity 
            onPress={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
            style={{ padding: 4 }}
          >
            <Ionicons name={viewMode === 'list' ? 'grid-outline' : 'list-outline'} size={20} color={isDark ? "rgba(248,250,252,0.7)" : "rgba(34,69,28,0.7)"} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <PageTransition className="flex-1 bg-[#FAFEEF] dark:bg-[#0B120B]">
      <SafeAreaView edges={["top"]} className="flex-1">
        <View className="px-6 py-5 flex-row items-center justify-between">
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
            Library
          </Text>
        </View>

        <SearchBar onFocusChange={setIsSearchFocused} />
        <FilterPills />

        <View className="flex-1 relative">
          <FlatList
            key={viewMode}
            numColumns={viewMode === 'grid' ? 2 : 1}
            keyboardShouldPersistTaps="handled"
            onScrollBeginDrag={() => Keyboard.dismiss()}
            data={displayedPlants}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => viewMode === 'grid' ? <PlantGridCard plant={item} /> : <PlantCard plant={item} />}
            ListHeaderComponent={renderHeader}
            ListEmptyComponent={renderEmptyState}
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 140 }}
            columnWrapperStyle={viewMode === 'grid' ? { paddingHorizontal: 18 } : undefined}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isLoadingPlants && displayedPlants.length > 0}
                onRefresh={handleRefresh}
                colors={["#A2CFA3"]}
                tintColor={isDark ? "#A2CFA3" : "#22451C"}
              />
            }
          />
          
          {isSearchFocused && (
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => Keyboard.dismiss()}
            />
          )}
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