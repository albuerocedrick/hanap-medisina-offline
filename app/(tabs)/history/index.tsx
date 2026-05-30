import { useLocalSearchParams } from "expo-router";
import { useColorScheme } from "nativewind";
import React, { useEffect, useState } from "react";
import { Alert, FlatList, StatusBar, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PageTransition } from "@/src/components/ui/PageTransition";
import { HistoryEmptyState } from "@/src/components/history/history-empty-state";
import { HistoryHeader } from "@/src/components/history/history-header";
import { HistoryCard } from "@/src/components/history/history-card";
import { HistoryGridCard } from "@/src/components/history/history-grid-card";
import { ScanDetailSheet } from "@/src/components/history/scan-detail-sheet";
import { useHistoryStore } from "@/src/store/useHistoryStore";
import { LocalScanRecord } from "@/src/types";

export default function HistoryScreen() {
  const params = useLocalSearchParams();
  const incomingScanId = params?.scanId as string | undefined;
  const incomingOpenAt = params?.openAt as string | undefined;
  const insets = useSafeAreaInsets();
  
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  // Navigation / Sheet state
  const [selectedScanId, setSelectedScanId] = useState<string | null>(null);

  // Store state
  const scans = useHistoryStore((s) => s.scans);
  const sortBy = useHistoryStore((s) => s.sortBy);
  const viewMode = useHistoryStore((s) => s.viewMode);
  const activeTab = useHistoryStore((s) => s.activeTab);

  const setSortBy = useHistoryStore((s) => s.setSortBy);
  const setViewMode = useHistoryStore((s) => s.setViewMode);
  const setActiveTab = useHistoryStore((s) => s.setActiveTab);
  const toggleFavorite = useHistoryStore((s) => s.toggleFavorite);
  const deleteScan = useHistoryStore((s) => s.deleteScan);
  const deleteMultipleScans = useHistoryStore((s) => s.deleteMultipleScans);

  // Multi-select state
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (incomingScanId) {
      setSelectedScanId(incomingScanId);
    }
  }, [incomingScanId, incomingOpenAt]);

  // Derived filtered & sorted data
  const filteredScans = activeTab === "favorites" 
    ? scans.filter(s => s.isFavorite) 
    : scans;

  const sortedScans = [...filteredScans].sort((a, b) => {
    const timeA = new Date(a.scannedAt).getTime();
    const timeB = new Date(b.scannedAt).getTime();
    return sortBy === "newest" ? timeB - timeA : timeA - timeB;
  });

  const favoriteCount = scans.filter(s => s.isFavorite).length;
  const totalCount = scans.length;

  // Handlers
  const handleLongPress = (item: LocalScanRecord) => {
    if (!isSelecting) {
      setIsSelecting(true);
      setSelectedIds(new Set([item.id]));
    }
  };

  const handleToggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
      if (newSet.size === 0) setIsSelecting(false);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleDeleteScan = (id: string) => {
    Alert.alert("Delete Scan", "Are you sure you want to delete this scan?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteScan(id) }
    ]);
  };

  const handleDeleteSelected = () => {
    Alert.alert(
      "Delete Scans",
      `Are you sure you want to delete ${selectedIds.size} selected scans?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            await deleteMultipleScans(Array.from(selectedIds));
            setIsSelecting(false);
            setSelectedIds(new Set());
          } 
        }
      ]
    );
  };

  const cancelSelection = () => {
    setIsSelecting(false);
    setSelectedIds(new Set());
  };

  const handlePressScan = (id: string) => {
    // Defer state update so animations and gestures can finish cleanly
    requestAnimationFrame(() => {
      setSelectedScanId(id);
    });
  };

  // UI layout constants
  const pillHeight = 78;
  const bottomPadding = Math.max(insets.bottom, 24) + pillHeight + 100;

  return (
    <View style={{ flex: 1 }}>
      <PageTransition className="flex-1 bg-[#FAFEEF] dark:bg-[#0B120B]" style={{ paddingTop: insets.top }}>
        <StatusBar
          barStyle={isDark ? "light-content" : "dark-content"}
          backgroundColor="transparent"
          translucent
        />

        <View className="bg-[#FAFEEF] dark:bg-[#0B120B] z-10">
          <HistoryHeader
            totalCount={totalCount}
            favoriteCount={favoriteCount}
            activeTab={activeTab}
            sortBy={sortBy}
            viewMode={viewMode}
            isSelecting={isSelecting}
            selectedCount={selectedIds.size}
            onTabChange={setActiveTab}
            onSortChange={() => setSortBy(sortBy === "newest" ? "oldest" : "newest")}
            onViewModeChange={() => setViewMode(viewMode === "list" ? "grid" : "list")}
            onDeleteSelected={handleDeleteSelected}
            onCancelSelection={cancelSelection}
          />
        </View>

        <FlatList
          key={viewMode} // Force re-render on layout change
          data={sortedScans}
          keyExtractor={(item) => item.id}
          numColumns={viewMode === "grid" ? 2 : 1}
          columnWrapperStyle={viewMode === "grid" ? { paddingHorizontal: 16, justifyContent: "space-between" } : undefined}
          renderItem={({ item }) => {
            if (viewMode === "grid") {
              return (
                <HistoryGridCard
                  item={item}
                  onPress={() => handlePressScan(item.id)}
                  onLongPress={handleLongPress}
                  onToggleFavorite={toggleFavorite}
                  isSelecting={isSelecting}
                  isSelected={selectedIds.has(item.id)}
                  onToggleSelect={handleToggleSelect}
                />
              );
            }
            return (
              <HistoryCard
                item={item}
                onPress={() => handlePressScan(item.id)}
                onLongPress={handleLongPress}
                onToggleFavorite={toggleFavorite}
                onDelete={handleDeleteScan}
                isSelecting={isSelecting}
                isSelected={selectedIds.has(item.id)}
                onToggleSelect={handleToggleSelect}
              />
            );
          }}
          ListEmptyComponent={
            <HistoryEmptyState activeTab={activeTab} />
          }
          contentContainerStyle={[
            sortedScans.length === 0 && { flex: 1 },
            { paddingBottom: bottomPadding, paddingTop: 8 },
          ]}
          showsVerticalScrollIndicator={false}
        />
      </PageTransition>

      <ScanDetailSheet
        visible={!!selectedScanId}
        scanId={selectedScanId}
        onClose={() => {
          setSelectedScanId(null);
        }}
      />
    </View>
  );
}