import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import { randomUUID } from "expo-crypto";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { LocalScanRecord } from "@/src/types";

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

// Maximum number of stored scans to prevent AsyncStorage CursorWindow / SQLite overflow
export const MAX_SCAN_HISTORY = 500;

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      scans: [],
      sortBy: "newest",
      viewMode: "list",
      activeTab: "all",

      addScan: (scanData) => {
        const id = `scan_${randomUUID()}`;
        const newScan: LocalScanRecord = {
          ...scanData,
          id,
          plantName: toTitleCase(scanData.plantName),
          isFavorite: false,
        };
        set((state) => {
          let updated = [newScan, ...state.scans];
          if (updated.length > MAX_SCAN_HISTORY) {
            const pruneIdxFromEnd = [...updated].reverse().findIndex(s => !s.isFavorite);
            if (pruneIdxFromEnd !== -1) {
              const actualIdx = updated.length - 1 - pruneIdxFromEnd;
              const pruned = updated[actualIdx];
              if (pruned?.imageUri) {
                void FileSystem.deleteAsync(pruned.imageUri, { idempotent: true }).catch(() => {});
              }
              updated = updated.filter((_, i) => i !== actualIdx);
            } else {
              const pruned = updated[updated.length - 1];
              if (pruned?.imageUri) {
                void FileSystem.deleteAsync(pruned.imageUri, { idempotent: true }).catch(() => {});
              }
              updated = updated.slice(0, MAX_SCAN_HISTORY);
            }
          }
          return { scans: updated };
        });
      },

      deleteScan: async (id: string) => {
        await get().deleteMultipleScans([id]);
      },

      deleteMultipleScans: async (ids: string[]) => {
        const requested = new Set(ids);
        const scansToDelete = get().scans.filter(scan => requested.has(scan.id));
        const deleted = new Map<string, string>();
        let failedCount = 0;
        // Bound native I/O while allowing several deletions to progress together.
        for (let offset = 0; offset < scansToDelete.length; offset += 8) {
          const batch = scansToDelete.slice(offset, offset + 8);
          const results = await Promise.allSettled(batch.map(async scan => {
            if (scan.imageUri) await FileSystem.deleteAsync(scan.imageUri, { idempotent: true });
          }));
          results.forEach((result, index) => {
            if (result.status === "fulfilled") deleted.set(batch[index].id, batch[index].imageUri);
            else {
              failedCount++;
              if (__DEV__) console.warn(`[useHistoryStore] Failed to delete image for ${batch[index].id}:`, result.reason);
            }
          });
        }
        set(state => ({
          // A failed image deletion retains its record for a later retry.
          // Preserve scans added or replaced while the native work was in flight.
          scans: state.scans.filter(scan => !deleted.has(scan.id) || deleted.get(scan.id) !== scan.imageUri),
        }));
        if (failedCount) {
          throw new Error(`Could not delete ${failedCount} scan image(s). Those scans were kept so you can try again.`);
        }
      },

      clearAllScans: async () => {
        await get().deleteMultipleScans(get().scans.map(scan => scan.id));
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
        const seen = new Set<string>();
        const distinctScans = newScans.filter(scan => {
          if (seen.has(scan.id)) return false;
          seen.add(scan.id);
          return true;
        });
        if (mode === "replace") {
          set({ scans: distinctScans.slice(0, MAX_SCAN_HISTORY) });
        } else {
          // Merge: add scans that don't already exist
          set((state) => {
            const existingIds = new Set(state.scans.map((s) => s.id));
            const uniqueNewScans = distinctScans.filter((s) => !existingIds.has(s.id));
            return { scans: [...uniqueNewScans, ...state.scans].slice(0, MAX_SCAN_HISTORY) };
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
