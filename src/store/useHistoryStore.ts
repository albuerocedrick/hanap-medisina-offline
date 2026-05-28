import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { LocalScanRecord } from "../types";

// Helper function to capitalize the first letter of each word
export const toTitleCase = (label: string) => {
  if (!label) return label;
  return label
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

interface HistoryState {
  scans: LocalScanRecord[];
  sortBy: "newest" | "oldest";
  viewMode: "list" | "grid";
  activeTab: "all" | "favorites";

  // Actions
  addScan: (scan: Omit<LocalScanRecord, "id" | "isFavorite">) => void;
  deleteScan: (id: string) => Promise<void>;
  deleteMultipleScans: (ids: string[]) => Promise<void>;
  clearAllScans: () => Promise<void>;
  toggleFavorite: (id: string) => void;
  getScanById: (id: string) => LocalScanRecord | undefined;
  getScansCount: () => number;
  getFavoriteScans: () => LocalScanRecord[];
  getSortedScans: () => LocalScanRecord[];
  setSortBy: (sort: "newest" | "oldest") => void;
  setViewMode: (mode: "list" | "grid") => void;
  setActiveTab: (tab: "all" | "favorites") => void;

  // Used by dataTransfer.ts
  exportScans: () => LocalScanRecord[];
  importScans: (scans: LocalScanRecord[], mode: "merge" | "replace") => void;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      scans: [],
      sortBy: "newest",
      viewMode: "list",
      activeTab: "all",

      addScan: (scanData) => {
        const id = `scan_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const newScan: LocalScanRecord = {
          ...scanData,
          id,
          plantName: toTitleCase(scanData.plantName),
          isFavorite: false,
        };
        set((state) => ({ scans: [newScan, ...state.scans] }));
      },

      deleteScan: async (id: string) => {
        const scan = get().scans.find((s) => s.id === id);
        if (scan) {
          try {
            await FileSystem.deleteAsync(scan.imageUri, { idempotent: true });
          } catch (err) {
            console.warn("[useHistoryStore] Failed to delete image:", err);
          }
        }
        set((state) => ({
          scans: state.scans.filter((s) => s.id !== id),
        }));
      },

      deleteMultipleScans: async (ids: string[]) => {
        const scansToDelete = get().scans.filter((s) => ids.includes(s.id));
        for (const scan of scansToDelete) {
          try {
            await FileSystem.deleteAsync(scan.imageUri, { idempotent: true });
          } catch (err) {
            console.warn(`[useHistoryStore] Failed to delete image for ${scan.id}:`, err);
          }
        }
        set((state) => ({
          scans: state.scans.filter((s) => !ids.includes(s.id)),
        }));
      },

      clearAllScans: async () => {
        const scans = get().scans;
        for (const scan of scans) {
          try {
            await FileSystem.deleteAsync(scan.imageUri, { idempotent: true });
          } catch (err) {
            console.warn(`[useHistoryStore] Failed to delete image for ${scan.id}:`, err);
          }
        }
        set({ scans: [] });
      },

      toggleFavorite: (id: string) => {
        set((state) => ({
          scans: state.scans.map((s) =>
            s.id === id ? { ...s, isFavorite: !s.isFavorite } : s
          ),
        }));
      },

      getScanById: (id: string) => {
        return get().scans.find((s) => s.id === id);
      },

      getScansCount: () => {
        return get().scans.length;
      },

      getFavoriteScans: () => {
        return get().scans.filter((s) => s.isFavorite);
      },

      getSortedScans: () => {
        const { scans, sortBy } = get();
        return [...scans].sort((a, b) => {
          const timeA = new Date(a.scannedAt).getTime();
          const timeB = new Date(b.scannedAt).getTime();
          return sortBy === "newest" ? timeB - timeA : timeA - timeB;
        });
      },

      setSortBy: (sort) => set({ sortBy: sort }),
      setViewMode: (mode) => set({ viewMode: mode }),
      setActiveTab: (tab) => set({ activeTab: tab }),

      exportScans: () => get().scans,

      importScans: (newScans, mode) => {
        if (mode === "replace") {
          set({ scans: newScans });
        } else {
          // Merge: add scans that don't already exist
          set((state) => {
            const existingIds = new Set(state.scans.map((s) => s.id));
            const uniqueNewScans = newScans.filter((s) => !existingIds.has(s.id));
            return { scans: [...uniqueNewScans, ...state.scans] };
          });
        }
      },
    }),
    {
      name: "hanapmedisina-offline-history",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        scans: state.scans,
        sortBy: state.sortBy,
        viewMode: state.viewMode,
        activeTab: state.activeTab,
      }),
    }
  )
);
