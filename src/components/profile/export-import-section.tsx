/**
 * src/components/profile/export-import-section.tsx
 */
import React, { useState } from 'react';
import { Alert, View, ActivityIndicator } from 'react-native';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { exportData, importData, applyImport } from '@/src/services/dataTransfer';
import { ProfileMenuItem } from './profile-menu-item';
import { useColorScheme } from "nativewind";
import { useTranslation } from "@/src/i18n/useTranslation";

export function ExportImportSection() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const { t } = useTranslation();

  const handleExport = async () => {
    if (isExporting || isImporting) return;
    
    setIsExporting(true);
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert("Export Unavailable", "Sharing is not available on this device.");
        return;
      }
      const filePath = await exportData();
      await Sharing.shareAsync(filePath, {
        mimeType: 'application/json',
        dialogTitle: 'Export Backup',
        UTI: 'public.json',
      });
    } catch (error: any) {
      console.error("[ExportImportSection] Export failed:", error);
      Alert.alert("Export Failed", error.message || "An unknown error occurred.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async () => {
    if (isExporting || isImporting) return;
    
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      setIsImporting(true);
      const fileUri = result.assets[0].uri;
      const importPreview = await importData(fileUri);

      if (!importPreview.success || !importPreview.parsedData) {
        Alert.alert("Invalid File", importPreview.error || "Could not parse backup file.");
        setIsImporting(false);
        return;
      }

      Alert.alert(
        "Import Backup",
        `Found ${importPreview.scansCount} scans\nProfile: ${importPreview.profileName}\n${importPreview.favoritesCount} favorites\n\nChoose how to import:`,
        [
          { text: "Cancel", style: "cancel", onPress: () => setIsImporting(false) },
          {
            text: "Merge (Add)",
            onPress: async () => {
              try {
                await applyImport(importPreview.parsedData!, "merge");
                Alert.alert("Import Complete", `Successfully merged ${importPreview.scansCount} scans.`);
              } catch (e: any) {
                Alert.alert("Import Failed", e.message);
              } finally {
                setIsImporting(false);
              }
            }
          },
          {
            text: "Replace (Overwrite)",
            style: "destructive",
            onPress: () => {
              Alert.alert(
                "Are you sure?",
                "This will replace ALL your current data. This action cannot be undone.",
                [
                  { text: "Cancel", style: "cancel", onPress: () => setIsImporting(false) },
                  {
                    text: "Yes, Replace",
                    style: "destructive",
                    onPress: async () => {
                      try {
                        await applyImport(importPreview.parsedData!, "replace");
                        Alert.alert("Import Complete", `Successfully replaced data with ${importPreview.scansCount} scans.`);
                      } catch (e: any) {
                        Alert.alert("Import Failed", e.message);
                      } finally {
                        setIsImporting(false);
                      }
                    }
                  }
                ]
              );
            }
          }
        ]
      );
    } catch (error: any) {
      Alert.alert("Import Error", error.message || "An unknown error occurred.");
      setIsImporting(false);
    }
  };

  return (
    <View>
      <View style={{ opacity: isExporting ? 0.7 : 1 }}>
        <ProfileMenuItem
          icon="download"
          label={isExporting ? t('profile_exporting') : t('profile_export')}
          onPress={handleExport}
        />
        {isExporting && (
          <ActivityIndicator 
            size="small" 
            color={isDark ? "rgba(248,250,252,0.85)" : "#22451C"} 
            style={{ position: 'absolute', right: 16, top: 16 }} 
          />
        )}
      </View>
      
      <View style={{ opacity: isImporting ? 0.7 : 1 }}>
        <ProfileMenuItem
          icon="upload"
          label={isImporting ? t('profile_importing') : t('profile_import')}
          onPress={handleImport}
        />
        {isImporting && (
          <ActivityIndicator 
            size="small" 
            color={isDark ? "rgba(248,250,252,0.85)" : "#22451C"} 
            style={{ position: 'absolute', right: 16, top: 16 }} 
          />
        )}
      </View>
    </View>
  );
}
