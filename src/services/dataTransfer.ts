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
import { randomUUID } from "expo-crypto";
import { ExportData, ExportedScan, LocalScanRecord } from "@/src/types";
import { useHistoryStore } from "@/src/store/useHistoryStore";
import { useProfileStore } from "@/src/store/useProfileStore";
import { useLibraryStore } from "@/src/store/useLibraryStore";

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

// JSON parsing and base64 decoding require additional heap beyond file size.
export const MAX_IMPORT_BYTES = 25 * 1024 * 1024;

// ─────────────────────────────────────────────
// VALIDATION
// ─────────────────────────────────────────────

/**
 * Type guard that validates the structure of a parsed JSON object against ExportData.
 * Returns false (never throws) on any validation failure.
 */
export function validateImportData(data: unknown): data is ExportData {
  if (typeof data !== "object" || data === null) {
    if (__DEV__) console.warn("[dataTransfer] validateImportData: data is not an object");
    return false;
  }

  const d = data as Record<string, unknown>;

  // version
  if (d.version !== 1) {
    if (__DEV__) console.warn("[dataTransfer] validateImportData: unsupported version", d.version);
    return false;
  }

  // exportedAt
  if (typeof d.exportedAt !== "string" || !Number.isFinite(Date.parse(d.exportedAt))) {
    if (__DEV__) console.warn("[dataTransfer] validateImportData: missing or invalid exportedAt");
    return false;
  }

  // profile
  if (typeof d.profile !== "object" || d.profile === null) {
    if (__DEV__) console.warn("[dataTransfer] validateImportData: missing profile");
    return false;
  }
  const profile = d.profile as Record<string, unknown>;
  if (typeof profile.firstName !== "string") {
    if (__DEV__) console.warn("[dataTransfer] validateImportData: profile.firstName is not a string");
    return false;
  }
  if (typeof profile.lastName !== "string") {
    if (__DEV__) console.warn("[dataTransfer] validateImportData: profile.lastName is not a string");
    return false;
  }
  if (profile.avatarBase64 !== undefined && typeof profile.avatarBase64 !== "string") {
    if (__DEV__) console.warn("[dataTransfer] validateImportData: profile.avatarBase64 is not a string");
    return false;
  }

  // scans
  if (!Array.isArray(d.scans)) {
    if (__DEV__) console.warn("[dataTransfer] validateImportData: scans is not an array");
    return false;
  }
  for (const scan of d.scans) {
    if (typeof scan !== "object" || scan === null) return false;
    const s = scan as Record<string, unknown>;
    // IDs become local filenames during restore.
    if (typeof s.id !== "string" || !/^[a-zA-Z0-9_-]+$/.test(s.id)) return false;
    if (typeof s.plantName !== "string") return false;
    if (typeof s.plantId !== "string") return false;
    if (typeof s.confidence !== "number" || !Number.isFinite(s.confidence) || s.confidence < 0 || s.confidence > 1) return false;
    if (typeof s.scannedAt !== "string" || !Number.isFinite(Date.parse(s.scannedAt))) return false;
    if (typeof s.isFavorite !== "boolean") return false;
    if (s.imageBase64 !== undefined && typeof s.imageBase64 !== "string") return false;
    if (s.notes !== undefined && typeof s.notes !== "string") return false;
  }

  // favorites
  if (!Array.isArray(d.favorites)) {
    if (__DEV__) console.warn("[dataTransfer] validateImportData: favorites is not an array");
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
  if (!uri || typeof uri !== "string") return undefined;
  try {
    const fileUri = uri.startsWith("file://") || uri.startsWith("/") ? uri : `file://${uri}`;
    const info = await FileSystem.getInfoAsync(fileUri);
    if (!info.exists) {
      if (__DEV__) console.warn("[dataTransfer] File not found, skipping:", uri);
      return undefined;
    }
    return await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
  } catch (err) {
    if (__DEV__) console.warn("[dataTransfer] Failed to read file as base64:", uri, err);
    return undefined;
  }
}

/** Ensure a directory exists, creating it (with intermediates) if needed. */
async function ensureDir(dirPath: string): Promise<void> {
  if (!dirPath) return;
  try {
    const info = await FileSystem.getInfoAsync(dirPath);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });
    }
  } catch (e) {
    if (__DEV__) console.warn("[dataTransfer] ensureDir warning:", dirPath, e);
    throw e;
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
  let avatarBase64: string | undefined = undefined;
  if (profileState?.avatarUri) {
    try {
      avatarBase64 = await readFileAsBase64(profileState.avatarUri);
    } catch (e) {
      if (__DEV__) console.warn("[dataTransfer] Avatar read failed:", e);
    }
  }

  // 2. Convert each scan image to base64
  const scansList = Array.isArray(historyState?.scans) ? historyState.scans : [];
  const exportedScans: ExportedScan[] = await Promise.all(
    scansList.map(async (scan: LocalScanRecord) => {
      const { imageUri, ...rest } = scan;
      let imageBase64: string | undefined = undefined;
      if (imageUri) {
        try {
          imageBase64 = await readFileAsBase64(imageUri);
        } catch (e) {
          if (__DEV__) console.warn("[dataTransfer] Scan image read failed:", scan.id, e);
        }
      }
      return {
        id: scan.id || `scan_${Date.now()}`,
        plantName: scan.plantName || "Unknown",
        plantId: scan.plantId || "",
        confidence: typeof scan.confidence === "number" ? scan.confidence : 0,
        scannedAt: scan.scannedAt || new Date().toISOString(),
        isFavorite: Boolean(scan.isFavorite),
        ...(typeof scan.notes === "string" ? { notes: scan.notes } : {}),
        imageBase64,
      };
    })
  );

  // 3. Gather favorite plant IDs
  const rawFavorites = Array.isArray(libraryState?.favorites) ? libraryState.favorites : [];
  const favoriteIds: string[] = rawFavorites
    .map((item: any) => (typeof item === "string" ? item : item?.id))
    .filter((id): id is string => typeof id === "string" && id.length > 0);

  // 4. Build the export payload
  const payload: ExportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    profile: {
      firstName: profileState?.firstName || "Plant",
      lastName: profileState?.lastName || "Explorer",
      avatarBase64,
    },
    scans: exportedScans,
    favorites: favoriteIds,
  };

  // 5. Write to cache directory
  const cacheDir = FileSystem.cacheDirectory || FileSystem.documentDirectory || "";
  await ensureDir(cacheDir);
  const timestamp = Date.now();
  const filePath = `${cacheDir}hanapmedisina-backup-${timestamp}.json`;
  await FileSystem.writeAsStringAsync(filePath, JSON.stringify(payload, null, 2));

  if (__DEV__) console.log("[dataTransfer] Export written to:", filePath);
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
    const info = await FileSystem.getInfoAsync(fileUri);
    if (!info.exists || info.isDirectory || !("size" in info) || !Number.isFinite(info.size) || info.size < 0) {
      return { success: false, scansCount: 0, profileName: "", favoritesCount: 0, error: "Could not determine the selected file's size." };
    }
    if (info.size > MAX_IMPORT_BYTES) {
      return { success: false, scansCount: 0, profileName: "", favoritesCount: 0, error: "Backup file is too large (max 25MB)." };
    }
    raw = await FileSystem.readAsStringAsync(fileUri);
    if (raw.length > MAX_IMPORT_BYTES) {
      return { success: false, scansCount: 0, profileName: "", favoritesCount: 0, error: "Backup file is too large (max 25MB)." };
    }
  } catch (err) {
    if (__DEV__) console.warn("[dataTransfer] Failed to read import file:", err);
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
    profileName: `${parsed.profile.firstName} ${parsed.profile.lastName}`.trim(),
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
  if (!validateImportData(data) || (mode !== "merge" && mode !== "replace")) {
    throw new Error("Invalid backup data or import mode.");
  }
  if (!FileSystem.documentDirectory) throw new Error("Local storage is unavailable.");
  const scansDir = `${FileSystem.documentDirectory}scans/`;
  const profileDir = `${FileSystem.documentDirectory}profile/`;
  const previousScans = useHistoryStore.getState().scans;
  const previousAvatar = useProfileStore.getState().avatarUri;
  const seen = new Set(mode === "merge" ? previousScans.map(scan => scan.id) : []);
  const incoming = data.scans.filter(scan => {
    if (seen.has(scan.id)) return false;
    seen.add(scan.id);
    return true;
  });
  const stagedFiles: string[] = [];
  const restoredScans: LocalScanRecord[] = [];
  let avatarUri: string | null = null;
  try {
    // Stage complete files under unique names before changing saved records.
    // Sequential writes prevent late writes from recreating rolled-back files.
    if (incoming.some(scan => scan.imageBase64)) await ensureDir(scansDir);
    for (const scan of incoming) {
      const { imageBase64, ...rest } = scan;
      let imageUri = "";
      if (imageBase64) {
        imageUri = `${scansDir}restore_${randomUUID()}.jpg`;
        stagedFiles.push(imageUri);
        await FileSystem.writeAsStringAsync(imageUri, imageBase64, { encoding: FileSystem.EncodingType.Base64 });
      }
      restoredScans.push({ ...rest, imageUri });
    }
    if (mode === "replace" && data.profile.avatarBase64) {
      await ensureDir(profileDir);
      avatarUri = `${profileDir}restore_${randomUUID()}.jpg`;
      stagedFiles.push(avatarUri);
      await FileSystem.writeAsStringAsync(avatarUri, data.profile.avatarBase64, { encoding: FileSystem.EncodingType.Base64 });
    }
    // Finish the fallible favorite write before committing history/profile.
    await useLibraryStore.getState().replaceFavorites(data.favorites, mode);
  } catch (error) {
    await Promise.allSettled(stagedFiles.map(uri => FileSystem.deleteAsync(uri, { idempotent: true })));
    throw error;
  }
  useHistoryStore.getState().importScans(restoredScans, mode);
  if (mode === "replace") {
    useProfileStore.getState().updateProfile({
      firstName: data.profile.firstName, lastName: data.profile.lastName, avatarUri,
    });
    const activeFiles = new Set(useHistoryStore.getState().scans.map(scan => scan.imageUri));
    if (avatarUri) activeFiles.add(avatarUri);
    const obsolete = [...previousScans.map(scan => scan.imageUri), previousAvatar]
      .filter((uri): uri is string => !!uri && (uri.startsWith(scansDir) || uri.startsWith(profileDir)) && !activeFiles.has(uri));
    await Promise.allSettled([...new Set(obsolete)].map(uri => FileSystem.deleteAsync(uri, { idempotent: true })));
  } else {
    // A matching ID may have arrived while images were being restored.
    const activeFiles = new Set(useHistoryStore.getState().scans.map(scan => scan.imageUri));
    await Promise.allSettled(stagedFiles.filter(uri => !activeFiles.has(uri)).map(uri => FileSystem.deleteAsync(uri, { idempotent: true })));
  }
  if (__DEV__) console.log("[dataTransfer] Import applied successfully. Mode:", mode, "Scans:", restoredScans.length);
}
