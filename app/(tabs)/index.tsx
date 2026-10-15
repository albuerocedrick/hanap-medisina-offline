import { useTheme } from "@/src/theme/useTheme";
/**
 * app/(tabs)/index.tsx  —  Home Tab
 */

import { useColorScheme } from "nativewind";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { RefreshControl, ScrollView, StatusBar, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// 🌟 Import your new transition wrapper
import { PageTransition } from "@/src/components/ui/PageTransition";

import { SymptomGrid } from "@/src/components/home/SymptomGrid";
import { DailyTrivia } from "@/src/components/home/DailyTrivia";
import { QuickRemedies } from "@/src/components/home/QuickRemedies";
import { HomeHeader } from "@/src/components/home/HomeHeader";
import { HomeSearchBar } from "@/src/components/home/HomeSearchBar";
import { MascotChatSlot } from "@/src/components/home/MascotChatSlot";
import MySavedPlants from "@/src/components/home/MySavedPlants";
import YourStats from "@/src/components/home/YourStats";
import { RecentScans, RecentScansHandle } from "@/src/components/home/RecentScans";
import { ScanNowBanner } from "@/src/components/home/ScanNowBanner";
import { useFeedStore } from "@/src/store/useFeedStore";
import { ScanDetailSheet } from "@/src/components/history/scan-detail-sheet";

export default function HomeScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [selectedScanId, setSelectedScanId] = useState<string | null>(null);

  const fetchHomeFeed = useFeedStore((s) => s.fetchHomeFeed);

  useEffect(() => {
    fetchHomeFeed();
  }, [fetchHomeFeed]);


  const isDark = theme.isDark;

  const recentScansRef = useRef<RecentScansHandle>(null);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await recentScansRef.current?.refresh();
    } finally {
      setRefreshing(false);
    }
  },[]);

  return (
    // 🌟 Wrap the whole screen in PageTransition
    <PageTransition className="flex-1" style={{ backgroundColor: theme.bg }}>
      <View style={{ paddingTop: insets.top, flex: 1, backgroundColor: theme.bg }}>

        <StatusBar
          barStyle={isDark ? "light-content" : "dark-content"}
          backgroundColor="transparent"
          translucent
        />

        <ScrollView
          removeClippedSubviews={false}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.accent}
              colors={[theme.accent]}
            />
          }
          contentContainerStyle={{
            paddingBottom: Math.max(insets.bottom, 24) + 120,
          }}
        >
          <HomeHeader />
          <HomeSearchBar onActiveChange={setIsSearchActive} />
          <View collapsable={false} pointerEvents={isSearchActive ? "none" : "auto"} importantForAccessibility={isSearchActive ? "no-hide-descendants" : "auto"} style={{ height: isSearchActive ? 0 : undefined, overflow: "hidden" }}>
              <MascotChatSlot visible={!isSearchActive} />
              <ScanNowBanner />
              <SymptomGrid />
              <QuickRemedies />
              <MySavedPlants />
              <RecentScans ref={recentScansRef} onScanPress={(scan) => setSelectedScanId(scan.id)} />
              <DailyTrivia />
              <YourStats />
          </View>
        </ScrollView>
        <ScanDetailSheet
          visible={!!selectedScanId}
          scanId={selectedScanId}
          onClose={() => setSelectedScanId(null)}
        />
      </View>
    </PageTransition>
  );
}
