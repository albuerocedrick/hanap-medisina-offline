import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/src/theme/useTheme";

// Components
import { CompareTab } from "@/src/components/plant-details/compare-tab";
import { DetailsTab } from "@/src/components/plant-details/details-tab";
import { ResearchTab } from "@/src/components/plant-details/research-tab";
import { CultivationTab } from "@/src/components/plant-details/cultivation-tab";

// Services & Store
import { MedicinalPlant as Plant } from "@/src/types";
import {
  getPlantById,
  getPlantsByIds,
} from "@/src/services/localLibrary";
type PlantSummary = Plant;
import { useLibraryStore } from "@/src/store/useLibraryStore";
import { useTranslation } from "@/src/i18n/useTranslation";
import { getPlantCategoryLabel } from "@/src/i18n/plantLabels";
import { BackButton } from "@/src/components/ui/BackButton";
import { ScreenHeader } from "@/src/components/ui/ScreenHeader";



// ─────────────────────────────────────────────
// TYPES & CONSTANTS
// ─────────────────────────────────────────────

type TabKey = "details" | "research" | "cultivation" | "compare";

const PLACEHOLDER_IMAGE = require("../../../assets/images/plant-placeholder.jpg");

export default function PlantDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { t, language } = useTranslation();

  // ─── Global State ────────────────────────────────────────────────────────

  const isFavorite = useLibraryStore((s) => s.isFavorite(id as string));
  const toggleFavorite = useLibraryStore((s) => s.toggleFavorite);

  // ─── Local State ─────────────────────────────────────────────────────────
  const [plant, setPlant] = useState<Plant | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("details");
  const [imageError, setImageError] = useState<boolean>(false);
  // Phase 6: True when showing partial data from the cached summary list
  // (offline + not in favorites). Research and Compare tabs are hidden.
  const [isPartialOffline, setIsPartialOffline] = useState<boolean>(false);

  // Look-alikes State
  const [lookAlikes, setLookAlikes] = useState<PlantSummary[]>([]);
  const [isLoadingLookAlikes, setIsLoadingLookAlikes] = useState<boolean>(true);

  // ─── Data Fetching ───────────────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;

    async function loadPlantData() {
      if (!id) return;
      setIsLoading(true);
      setError(null);
      let fetchedPlant: Plant | null = null;

      try {
        fetchedPlant = getPlantById(id as string) || null;
        if (fetchedPlant) {
          setIsPartialOffline(false);
        } else if (isMounted) {
          setError(t('details_error_not_found'));
        }
        
        if (isMounted && fetchedPlant) setPlant(fetchedPlant);
      } catch (err) {
        if (isMounted) {
          setError(t('details_error_load_failed'));
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }

      // --- Fetch Look-alikes based on the new lookAlikeIds array ---
      if (fetchedPlant && isMounted) {
        setIsLoadingLookAlikes(true);
        try {
          const lookAlikeIds = fetchedPlant.lookAlikeIds || [];

          if (lookAlikeIds.length > 0) {
            const related = getPlantsByIds(lookAlikeIds);
            if (isMounted) setLookAlikes(related);
          } else {
            if (isMounted) setLookAlikes([]);
          }
        } catch (err) {
          if (__DEV__) console.warn("[PlantDetailsScreen] Failed to load look-alikes:", err);
          if (isMounted) setLookAlikes([]);
        } finally {
          if (isMounted) setIsLoadingLookAlikes(false);
        }
      }
    }

    loadPlantData();
    return () => {
      isMounted = false;
    };
  }, [id, language]);

  // ─── Handlers ────────────────────────────────────────────────────────────

  const handleToggleFavorite = async () => {
    if (!plant) return;
    try {
      await toggleFavorite(plant);
    } catch (err) {
      if (__DEV__) console.error("[PlantDetailsScreen] toggleFavorite failed:", err);
    }
  };

  // ─── Rendering Helpers ───────────────────────────────────────────────────

  // Both of these states previously rendered on a hardcoded `bg-white` with no
  // back control at all. On a slow load or a bad id, that stranded the user on a
  // blank screen — and the white ignored dark mode. The header is now rendered
  // first in both cases so an exit always exists before content resolves.
  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg }}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={{ paddingTop: Math.max(insets.top, 20) }}>
          <ScreenHeader fallbackHref="/(tabs)/library" />
        </View>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text
            style={{
              marginTop: 16,
              fontFamily: "Quicksand_500Medium",
              color: theme.textSecondary,
            }}
          >
            {t('details_loading')}
          </Text>
        </View>
      </View>
    );
  }

  if (error || !plant) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg }}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={{ paddingTop: Math.max(insets.top, 20) }}>
          <ScreenHeader fallbackHref="/(tabs)/library" />
        </View>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }}>
          <View
            style={{
              width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center",
              marginBottom: 16,
              backgroundColor: theme.dangerSubtle,
            }}
          >
            <Ionicons name="alert-circle-outline" size={32} color={theme.danger} />
          </View>
          <Text
            style={{
              fontFamily: "serif", fontStyle: "italic", fontSize: 22, textAlign: "center",
              color: theme.textPrimary,
            }}
          >
            {t('details_error_title')}
          </Text>
          <Text
            style={{
              marginTop: 8, marginBottom: 24, textAlign: "center", lineHeight: 20,
              fontFamily: "Quicksand_500Medium",
              color: theme.textSecondary,
            }}
          >
            {error}
          </Text>
          <TouchableOpacity
            onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)/library"))}
            accessibilityRole="button"
            style={{
              paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16,
              backgroundColor: theme.accent,
            }}
          >
            <Text style={{ fontFamily: "Quicksand_700Bold", color: theme.textOnAccent }}>
              {t('details_go_back')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }


  // ─── Main Render ─────────────────────────────────────────────────────────

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* ─── Fixed Header Nav (Floating over image) ───────────────────────── */}
      <View
        style={{
          position: "absolute", top: Math.max(insets.top, 20) + 10, left: 16, right: 16,
          zIndex: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center"
        }}
      >
        <BackButton variant="onImage" fallbackHref="/(tabs)/library" />

        <TouchableOpacity
          onPress={handleToggleFavorite}
          style={{
            width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center",
            // Matches BackButton: a 0.3 scrim vanished against pale plant photos.
            backgroundColor: theme.scrimStrong, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.imageBorder
          }}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          accessibilityRole="button"
          accessibilityState={{ selected: isFavorite }}
          accessibilityLabel={
            t(isFavorite ? "a11y_remove_favorite" : "a11y_add_favorite")
          }
        >

          <Ionicons
            name={isFavorite ? "heart" : "heart-outline"}
            size={20}
            color={isFavorite ? theme.success : theme.onImage}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
      >
        {/* ─── Image Hero Section ─────────────────────────────────────────── */}
        <View style={{ width: "100%", height: 320, backgroundColor: theme.surfacePressed }}>
          <Image
            source={
              !imageError && plant.imageUrl
                ? { uri: plant.imageUrl }
                : PLACEHOLDER_IMAGE
            }
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        </View>

        {/* ─── Plant Header Info ───────────────────────────────────────── */}
        <View style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16, backgroundColor: theme.bg }}>
          <Text 
            style={{
              fontSize: 32, fontFamily: "serif", fontStyle: "italic", fontWeight: "600",
              color: theme.textPrimary, lineHeight: 38
            }}
          >
            {plant.name}
          </Text>
          <Text 
            style={{
              fontSize: 15, fontFamily: "serif", fontStyle: "italic",
              color: theme.textSecondary, marginTop: 4
            }}
          >
            {plant.scientificName}
          </Text>

          {plant.shortDescription ? (
            <Text 
              style={{
                fontSize: 14, fontFamily: "Quicksand_500Medium",
                color: theme.textSecondary, marginTop: 8
              }}
            >
              {plant.shortDescription}
            </Text>
          ) : null}

          {/* Phase 6: Partial offline banner */}
          {isPartialOffline && (
            <View style={{
              marginTop: 16, backgroundColor: theme.warningSubtle,
              borderWidth: StyleSheet.hairlineWidth, borderColor: theme.warningBorder,
              borderRadius: 12, flexDirection: "row", alignItems: "center", padding: 12
            }}>
              <Ionicons name="archive-outline" size={16} color={theme.warning} />
              <Text style={{ fontFamily: "Quicksand_600SemiBold", fontSize: 12, color: theme.warning, marginLeft: 8, flex: 1 }}>
                {t('details_offline_banner')}
              </Text>
            </View>
          )}

          {/* Categories */}
          {plant.categories?.length > 0 && (
            <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 16, gap: 8 }}>
              {plant.categories.map((cat) => (
                <View
                  key={cat}
                  style={{
                    backgroundColor: "transparent",
                    borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border,
                    borderRadius: 16, paddingHorizontal: 12, paddingVertical: 4
                  }}
                >
                  <Text style={{ fontFamily: "Quicksand_600SemiBold", fontSize: 12, color: theme.textPrimary }}>
                    {getPlantCategoryLabel(cat, language)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ─── Sub-Tabs Navigation ────────────────────────────────────────── */}
        <View style={{ flexDirection: "row", paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.borderSubtle }}>
          {(isPartialOffline
            ? (["details"] as TabKey[])
            : (["details", "research", "cultivation", "compare"] as TabKey[])
          ).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={{
                  flex: 1, paddingVertical: 14, alignItems: "center",
                  borderBottomWidth: isActive ? 2 : 0, borderBottomColor: isActive ? (theme.accent) : "transparent"
                }}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
              >
                <Text
                  style={{
                    fontFamily: "Quicksand_700Bold", fontSize: 12, textAlign: "center",
                    color: isActive ? (theme.accent) : (theme.textMuted)
                  }}
                  numberOfLines={1}
                >
                  {t(`details_tab_${tab}` as any)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ─── Tab Content ────────────────────────────────────────────────── */}
        <View style={{ flex: 1, minHeight: 400 }}>
          {activeTab === "details" && (
            <DetailsTab
              localName={plant.details?.localName ?? ""}
              details={plant.details}
            />
          )}

          {activeTab === "research" && (
            <ResearchTab research={plant.research ?? []} />
          )}

          {activeTab === "cultivation" && (
            <CultivationTab cultivationGuide={plant.cultivationGuide} />
          )}

          {activeTab === "compare" && (
            <CompareTab
              currentPlantId={plant.id}
              currentPlantName={plant.name}
              lookAlikePlants={lookAlikes}
              isLoadingLookAlikes={isLoadingLookAlikes}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}
