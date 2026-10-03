import { useLocalSearchParams } from "expo-router";
import { useColorScheme } from "nativewind";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, StatusBar, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PageTransition } from "@/src/components/ui/PageTransition";
import { HistoryEmptyState } from "@/src/components/history/history-empty-state";
import { HistoryHeader } from "@/src/components/history/history-header";
import { HistoryCard } from "@/src/components/history/history-card";
import { HistoryGridCard } from "@/src/components/history/history-grid-card";
import { ScanDetailSheet } from "@/src/components/history/scan-detail-sheet";
import { DeleteConfirmationModal } from "@/src/components/ui/DeleteConfirmationModal";
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
  const [deleteTarget, setDeleteTarget] = useState<
    { type: "single"; id: string; plantName?: string } | { type: "batch"; count: number } | null
  >(null);

  useEffect(() => {
    if (incomingScanId) {
      setSelectedScanId(incomingScanId);
    }
  }, [incomingScanId, incomingOpenAt]);

  // Derived filtered & sorted data
  const filteredScans = useMemo(() => activeTab === "favorites"
    ? scans.filter(s => s.isFavorite) 
    : scans, [activeTab, scans]);

  const sortedScans = useMemo(() => [...filteredScans].sort((a, b) => {
    const timeA = new Date(a.scannedAt).getTime();
    const timeB = new Date(b.scannedAt).getTime();
    return sortBy === "newest" ? timeB - timeA : timeA - timeB;
  }), [filteredScans, sortBy]);

  const favoriteCount = useMemo(() => scans.filter(s => s.isFavorite).length, [scans]);
  const totalCount = scans.length;

  // Handlers
  const handleLongPress = useCallback((item: LocalScanRecord) => {
    if (!isSelecting) {
      setIsSelecting(true);
      setSelectedIds(new Set([item.id]));
    }
  }, [isSelecting]);

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds(previous => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  useEffect(() => {
    if (selectedIds.size === 0) setIsSelecting(false);
  }, [selectedIds.size]);

  const handleDeleteScan = useCallback((id: string) => {
    const scanItem = scans.find((s) => s.id === id);
    setDeleteTarget({ type: "single", id, plantName: scanItem?.plantName });
  }, [scans]);

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    setDeleteTarget({ type: "batch", count: selectedIds.size });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "single") {
      await deleteScan(deleteTarget.id);
    } else if (deleteTarget.type === "batch") {
      await deleteMultipleScans(Array.from(selectedIds));
      setIsSelecting(false);
      setSelectedIds(new Set());
    }
    setDeleteTarget(null);
  };

  const cancelSelection = () => {
    setIsSelecting(false);
    setSelectedIds(new Set());
  };

  const handlePressScan = useCallback((item: LocalScanRecord) => {
    // Defer state update so animations and gestures can finish cleanly
    requestAnimationFrame(() => {
      setSelectedScanId(item.id);
    });
  }, []);

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
          extraData={selectedIds}
          columnWrapperStyle={viewMode === "grid" ? { paddingHorizontal: 16, justifyContent: "space-between" } : undefined}
          renderItem={({ item }) => {
            if (viewMode === "grid") {
              return (
                <HistoryGridCard
                  item={item}
                  onPress={handlePressScan}
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
                onPress={handlePressScan}
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
        onDeleteRequest={handleDeleteScan}
      />

      <DeleteConfirmationModal
        visible={!!deleteTarget}
        itemName={deleteTarget?.type === "single" ? deleteTarget.plantName : undefined}
        itemCount={deleteTarget?.type === "batch" ? deleteTarget.count : undefined}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </View>
  );
}
