import { useTheme } from "@/src/theme/useTheme";
import { useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, FlatList, StatusBar, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
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
import { useTranslation } from "@/src/i18n/useTranslation";

export default function HistoryScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const incomingScanId = params?.scanId as string | undefined;
  const incomingOpenAt = params?.openAt as string | undefined;
  const insets = useSafeAreaInsets();


  const isDark = theme.isDark;

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
    try {
      if (deleteTarget.type === "single") {
        await deleteScan(deleteTarget.id);
      } else {
        await deleteMultipleScans(Array.from(selectedIds));
      }
      setIsSelecting(false);
      setSelectedIds(new Set());
    } catch {
      // Successful deletes have already left the store; keep failed selections
      // available so the user can retry without selecting everything again.
      const remainingIds = new Set(useHistoryStore.getState().scans.map(scan => scan.id));
      setSelectedIds(previous => new Set([...previous].filter(id => remainingIds.has(id))));
      Alert.alert(t("history_delete"), t("history_delete_failed"));
    } finally {
      setDeleteTarget(null);
    }
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
      <PageTransition className="flex-1" style={[{ backgroundColor: theme.bg }, { paddingTop: insets.top }]}>
        <StatusBar
          barStyle={isDark ? "light-content" : "dark-content"}
          backgroundColor="transparent"
          translucent
        />

        <View className="z-10" style={{ backgroundColor: theme.bg }}>
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
        {totalCount >= 450 && (
          <View style={{ marginHorizontal: 16, marginTop: 8, marginBottom: 4, padding: 12, borderRadius: 12, backgroundColor: theme.warningSubtle, borderColor: theme.warning, borderWidth: 1, flexDirection: "row", alignItems: "center" }}>
            <Ionicons name="warning-outline" size={18} color={theme.warning} style={{ marginRight: 8 }} />
            <Text style={{ flex: 1, color: theme.textPrimary, fontSize: 13, lineHeight: 18 }}>
              {t("history_storage_warning").replace("{count}", String(totalCount)).replace("{max}", "500")}
            </Text>
          </View>
        )}

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
