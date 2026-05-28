/**
 * src/services/dataTransfer.ts
 *
 * Core service for exporting and importing app data as a self-contained JSON backup.
 *
 * Export flow:
 *   1. Gather data from useHistoryStore, useProfileStore, useLibraryStore
 *   2. Convert local image files → base64 strings (embedded in JSON)
 *   3. Serialize to JSON and write to cache directory
 *   4. Return file path → caller passes to expo-sharing
 *
 * Import flow:
 *   1. Read and parse JSON file
 *   2. Validate schema via validateImportData()
 *   3. Return parsed ExportData as a preview (caller shows merge/replace UI)
 *   4. Caller invokes applyImport() with the user's chosen mode
 */

import * as FileSystem from "expo-file-system";
import { ExportData, ExportedScan, LocalScanRecord } from "../types";
import { useHistoryStore } from "../store/useHistoryStore";
import { useProfileStore } from "../store/useProfileStore";
import { useLibraryStore } from "../store/useLibraryStore";
import { getPlantsByIds } from "./localLibrary";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export interface ImportResult {
  success: boolean;
  scansCount: number;
  profileName: string;
  favoritesCount: number;
  parsedData?: ExportData;
  error?: string;
}

// ─────────────────────────────────────────────
// VALIDATION
// ─────────────────────────────────────────────

/**
 * Type guard that validates the structure of a parsed JSON object against ExportData.
 * Returns false (never throws) on any validation failure.
 */
export function validateImportData(data: unknown): data is ExportData {
  if (typeof data !== "object" || data === null) {
    console.warn("[dataTransfer] validateImportData: data is not an object");
    return false;
  }

  const d = data as Record<string, unknown>;

  // version
  if (d.version !== 1) {
    console.warn("[dataTransfer] validateImportData: unsupported version", d.version);
    return false;
  }

  // exportedAt
  if (typeof d.exportedAt !== "string" || d.exportedAt.length === 0) {
    console.warn("[dataTransfer] validateImportData: missing or invalid exportedAt");
    return false;
  }

  // profile
  if (typeof d.profile !== "object" || d.profile === null) {
    console.warn("[dataTransfer] validateImportData: missing profile");
    return false;
  }
  const profile = d.profile as Record<string, unknown>;
  if (typeof profile.name !== "string") {
    console.warn("[dataTransfer] validateImportData: profile.name is not a string");
    return false;
  }
  if (typeof profile.nickname !== "string") {
    console.warn("[dataTransfer] validateImportData: profile.nickname is not a string");
    return false;
  }
  if (profile.avatarBase64 !== undefined && typeof profile.avatarBase64 !== "string") {
    console.warn("[dataTransfer] validateImportData: profile.avatarBase64 is not a string");
    return false;
  }

  // scans
  if (!Array.isArray(d.scans)) {
    console.warn("[dataTransfer] validateImportData: scans is not an array");
    return false;
  }
  for (const scan of d.scans) {
    if (typeof scan !== "object" || scan === null) return false;
    const s = scan as Record<string, unknown>;
    if (typeof s.id !== "string") return false;
    if (typeof s.plantName !== "string") return false;
    if (typeof s.plantId !== "string") return false;
    if (typeof s.confidence !== "number") return false;
    if (typeof s.scannedAt !== "string") return false;
    if (typeof s.isFavorite !== "boolean") return false;
  }

  // favorites
  if (!Array.isArray(d.favorites)) {
    console.warn("[dataTransfer] validateImportData: favorites is not an array");
    return false;
  }
  for (const fav of d.favorites) {
    if (typeof fav !== "string") return false;
  }

  return true;
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

/** Read a local file as base64. Returns undefined if the file doesn't exist or can't be read. */
async function readFileAsBase64(uri: string): Promise<string | undefined> {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    if (!info.exists) {
      console.warn("[dataTransfer] File not found, skipping:", uri);
      return undefined;
    }
    return await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
  } catch (err) {
    console.warn("[dataTransfer] Failed to read file as base64:", uri, err);
    return undefined;
  }
}

/** Ensure a directory exists, creating it (with intermediates) if needed. */
async function ensureDir(dirPath: string): Promise<void> {
  const info = await FileSystem.getInfoAsync(dirPath);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });
  }
}

// ─────────────────────────────────────────────
// EXPORT
// ─────────────────────────────────────────────

/**
 * Builds a self-contained JSON backup and writes it to the cache directory.
 * Returns the path to the written file — caller passes this to expo-sharing.
 */
export async function exportData(): Promise<string> {
  const historyState = useHistoryStore.getState();
  const profileState = useProfileStore.getState();
  const libraryState = useLibraryStore.getState();

  // 1. Convert profile avatar to base64
  const avatarBase64 = profileState.avatarUri
    ? await readFileAsBase64(profileState.avatarUri)
    : undefined;

  // 2. Convert each scan image to base64
  const exportedScans: ExportedScan[] = await Promise.all(
    historyState.scans.map(async (scan: LocalScanRecord) => {
      const { imageUri, ...rest } = scan;
      const imageBase64 = imageUri ? await readFileAsBase64(imageUri) : undefined;
      return { ...rest, imageBase64 };
    })
  );

  // 3. Gather favorite plant IDs
  const favoriteIds = libraryState.favorites.map((plant) => plant.id);

  // 4. Build the export payload
  const payload: ExportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    profile: {
      name: profileState.name,
      nickname: profileState.nickname,
      avatarBase64,
    },
    scans: exportedScans,
    favorites: favoriteIds,
  };

  // 5. Write to cache directory
  const timestamp = Date.now();
  const filePath = `${FileSystem.cacheDirectory}hanapmedisina-backup-${timestamp}.json`;
  await FileSystem.writeAsStringAsync(filePath, JSON.stringify(payload, null, 2));

  console.log("[dataTransfer] Export written to:", filePath);
  return filePath;
}

// ─────────────────────────────────────────────
// IMPORT — PARSE & PREVIEW
// ─────────────────────────────────────────────

/**
 * Reads and validates a backup file.
 * Returns an ImportResult with a preview for the UI to display before applying.
 * Does NOT modify any store state — call applyImport() for that.
 */
export async function importData(fileUri: string): Promise<ImportResult> {
  let raw: string;
  try {
    raw = await FileSystem.readAsStringAsync(fileUri);
  } catch (err) {
    console.warn("[dataTransfer] Failed to read import file:", err);
    return { success: false, scansCount: 0, profileName: "", favoritesCount: 0, error: "Could not read the selected file." };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    return { success: false, scansCount: 0, profileName: "", favoritesCount: 0, error: "Invalid file format. The file is not valid JSON." };
  }

  if (!validateImportData(parsed)) {
    // Check for unsupported version specifically
    if (typeof parsed === "object" && parsed !== null) {
      const d = parsed as Record<string, unknown>;
      if (typeof d.version === "number" && d.version !== 1) {
        return {
          success: false,
          scansCount: 0,
          profileName: "",
          favoritesCount: 0,
          error: `Unsupported backup version (v${d.version}). This app only supports v1 backups.`,
        };
      }
    }
    return { success: false, scansCount: 0, profileName: "", favoritesCount: 0, error: "Invalid backup file structure. The file may be corrupt or from an incompatible app." };
  }

  return {
    success: true,
    scansCount: parsed.scans.length,
    profileName: parsed.profile.name,
    favoritesCount: parsed.favorites.length,
    parsedData: parsed,
  };
}

// ─────────────────────────────────────────────
// IMPORT — APPLY
// ─────────────────────────────────────────────

/**
 * Applies a validated ExportData object to the local stores.
 * mode === 'merge'   → adds imported scans not already present (by ID), keeps current profile
 * mode === 'replace' → replaces all scan history and profile with imported data
 */
export async function applyImport(
  data: ExportData,
  mode: "merge" | "replace"
): Promise<void> {
  const scansDir = `${FileSystem.documentDirectory}scans/`;
  const profileDir = `${FileSystem.documentDirectory}profile/`;

  await ensureDir(scansDir);

  // 1. Restore scan images from base64 and rebuild LocalScanRecord[]
  const restoredScans: LocalScanRecord[] = await Promise.all(
    data.scans.map(async (scan: ExportedScan) => {
      const { imageBase64, ...rest } = scan;
      let imageUri = "";

      if (imageBase64) {
        const localPath = `${scansDir}${scan.id}.jpg`;
        try {
          await FileSystem.writeAsStringAsync(localPath, imageBase64, {
            encoding: FileSystem.EncodingType.Base64,
          });
          imageUri = localPath;
        } catch (err) {
          console.warn("[dataTransfer] Failed to restore image for scan:", scan.id, err);
        }
      }

      return { ...rest, imageUri };
    })
  );

  // 2. Apply scan history
  useHistoryStore.getState().importScans(restoredScans, mode);

  // 3. Apply profile data (only in replace mode; merge keeps current profile)
  if (mode === "replace") {
    useProfileStore.getState().updateProfile({
      name: data.profile.name,
      nickname: data.profile.nickname,
    });

    // Restore avatar if present
    if (data.profile.avatarBase64) {
      try {
        await ensureDir(profileDir);
        const avatarPath = `${profileDir}avatar.jpg`;
        await FileSystem.writeAsStringAsync(avatarPath, data.profile.avatarBase64, {
          encoding: FileSystem.EncodingType.Base64,
        });
        useProfileStore.getState().setAvatar(avatarPath);
      } catch (err) {
        console.warn("[dataTransfer] Failed to restore avatar:", err);
      }
    }
  }

  // 4. Restore library favorites
  // Look up full MedicinalPlant objects from local library (skip unknown IDs gracefully)
  if (data.favorites.length > 0) {
    const plantsToFavorite = getPlantsByIds(data.favorites);
    const libraryStore = useLibraryStore.getState();

    if (mode === "replace") {
      // Clear existing favorites first, then add imported ones
      for (const existingFav of libraryStore.favorites) {
        await libraryStore.toggleFavorite(existingFav);
      }
    }

    // Add each plant from the backup that isn't already favorited
    for (const plant of plantsToFavorite) {
      if (!libraryStore.isFavorite(plant.id)) {
        await libraryStore.toggleFavorite(plant);
      }
    }
  }

  console.log("[dataTransfer] Import applied successfully. Mode:", mode, "Scans:", restoredScans.length);
}
