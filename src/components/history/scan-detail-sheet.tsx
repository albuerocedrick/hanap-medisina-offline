import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getAllPlants, MedicinalPlant } from "@/src/services/localLibrary";
import { useHistoryStore } from "@/src/store/useHistoryStore";
import { LocalScanRecord } from "@/src/types";

interface Props {
  visible: boolean;
  scanId: string | null;
  onClose: () => void;
}

export function ScanDetailSheet({ visible, scanId, onClose }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const getScanById = useHistoryStore((s) => s.getScanById);
  const toggleFavorite = useHistoryStore((s) => s.toggleFavorite);
  const deleteScan = useHistoryStore((s) => s.deleteScan);
  const scans = useHistoryStore((s) => s.scans); // Subscribe to changes

  const [scan, setScan] = useState<LocalScanRecord | null>(null);
  const [libraryMatch, setLibraryMatch] = useState<MedicinalPlant | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || !scanId) {
      setScan(null);
      setLibraryMatch(null);
      return;
    }

    async function loadScanData(sid: string) {
      setLoading(true);
      setError(null);

      try {
        const currentScan = getScanById(sid);
        if (!currentScan) throw new Error("Scan data could not be found.");

        setScan(currentScan);

        // Cross-reference Library
        const allPlants = await getAllPlants();
        const matchedPlant = allPlants.find(
          (p) => p.name.toLowerCase() === currentScan.plantName.toLowerCase()
        );
        
        if (matchedPlant) setLibraryMatch(matchedPlant);

      } catch (err: any) {
        setError(err.message || "Failed to load scan details.");
      } finally {
        setLoading(false);
      }
    }

    loadScanData(scanId);
  }, [scanId, visible]);

  // Keep scan state in sync with store changes (like favorites)
  useEffect(() => {
    if (visible && scanId) {
      const currentScan = getScanById(scanId);
      if (currentScan) setScan(currentScan);
    }
  }, [scans, visible, scanId]);

  const handleDelete = () => {
    if (!scan) return;
    Alert.alert(
      "Delete Scan",
      "Are you sure you want to delete this scan? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            await deleteScan(scan.id);
            onClose();
          } 
        }
      ]
    );
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return "Unknown Date";
    return new Intl.DateTimeFormat("en-PH", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(isoString));
  };

  const displayConf = scan ? Number((scan.confidence * 100).toFixed(2)) : 0;
  
  const getConfColor = (val: number) => {
    if (val >= 70) return { bg: "#22c55e", text: isDark ? "#4ade80" : "#15803d", bar: isDark ? "rgba(34, 197, 94, 0.2)" : "#f0fdf4" };
    if (val >= 35) return { bg: "#f59e0b", text: isDark ? "#fbbf24" : "#b45309", bar: isDark ? "rgba(245, 158, 11, 0.2)" : "#fffbeb" };
    return { bg: "#ef4444", text: isDark ? "#f87171" : "#b91c1c", bar: isDark ? "rgba(239, 68, 68, 0.2)" : "#fef2f2" };
  };
  const confStyles = getConfColor(displayConf);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      {/* Dimmed Backdrop (Closes on press) */}
      <Pressable 
        style={{ flex: 1, backgroundColor: "rgba(11, 18, 11, 0.6)" }} 
        onPress={onClose} 
      />

      {/* Bottom Sheet Container */}
      <View 
        style={{ 
          height: "85%", 
          paddingBottom: insets.bottom,
          backgroundColor: isDark ? "#0B120B" : "#FAFEEF",
          borderTopWidth: 1,
          borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(162,207,163,0.5)",
        }}
        className="rounded-t-[32px] absolute bottom-0 left-0 right-0 shadow-xl overflow-hidden"
      >
        {/* Drag Handle */}
        <View 
          style={{ backgroundColor: isDark ? "rgba(255,255,255,0.2)" : "rgba(34,69,28,0.2)" }}
          className="w-12 h-1.5 rounded-full self-center mt-4 mb-2" 
        />

        {/* Header */}
        <View className="flex-row items-center justify-between px-6 py-2">
          <Text 
            style={{ 
              color: isDark ? "rgba(248,250,252,0.5)" : "rgba(34,69,28,0.6)",
              fontFamily: "Quicksand_700Bold",
            }}
            className="text-sm tracking-widest uppercase"
          >
            Scan Details
          </Text>
          <TouchableOpacity 
            onPress={onClose}
            style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(162,207,163,0.3)" }}
            className="w-8 h-8 items-center justify-center rounded-full"
          >
            <Feather name="x" size={18} color={isDark ? "rgba(248,250,252,0.9)" : "#22451C"} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View className="flex-1 items-center justify-center pb-20">
            <ActivityIndicator size="large" color={isDark ? "#A2CFA3" : "#16a34a"} />
          </View>
        ) : error || !scan ? (
          <View className="flex-1 items-center justify-center px-6 pb-20">
            <Feather name="alert-triangle" size={40} color={isDark ? "rgba(248,250,252,0.3)" : "#A2CFA3"} />
            <Text style={{ color: isDark ? "#F8FAFC" : "#22451C", fontFamily: "Quicksand_700Bold" }} className="text-lg mt-4 text-center">Scan Not Found</Text>
            <Text style={{ color: isDark ? "rgba(248,250,252,0.5)" : "rgba(34,69,28,0.6)", fontFamily: "Quicksand_500Medium" }} className="text-center mt-2">{error}</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
            
            {/* Title & Favorite Badge */}
            <View className="px-6 pt-2 pb-6 flex-row items-start justify-between gap-4">
              <View className="flex-1">
                <Text 
                  style={{ 
                    color: isDark ? "#F8FAFC" : "#22451C",
                    fontFamily: "serif",
                    fontStyle: "italic",
                    fontWeight: "500" 
                  }}
                  className="text-3xl tracking-tight mb-2"
                >
                  {scan.plantName}
                </Text>
                
                <View 
                  style={{
                    backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(162,207,163,0.15)",
                    borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(162,207,163,0.4)",
                    borderWidth: 1,
                    alignSelf: "flex-start",
                  }}
                  className="px-2.5 py-1 rounded-full flex-row items-center gap-1.5"
                >
                  <Feather name="save" size={12} color={isDark ? "rgba(248,250,252,0.6)" : "#4D8035"} />
                  <Text style={{ color: isDark ? "rgba(248,250,252,0.8)" : "rgba(34,69,28,0.8)", fontFamily: "Quicksand_700Bold" }} className="text-[10px] uppercase tracking-wider">
                    Local Scan
                  </Text>
                </View>
              </View>

              <TouchableOpacity 
                onPress={() => toggleFavorite(scan.id)}
                style={{
                  backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "#FAFEEF",
                  borderColor: isDark ? "rgba(255,255,255,0.14)" : "#A2CFA3",
                  borderWidth: StyleSheet.hairlineWidth,
                }}
                className="w-12 h-12 rounded-full items-center justify-center"
              >
                <Ionicons 
                  name={scan.isFavorite ? "heart" : "heart-outline"} 
                  size={24} 
                  color={scan.isFavorite ? "#ef4444" : isDark ? "rgba(248,250,252,0.7)" : "#4D8035"} 
                />
              </TouchableOpacity>
            </View>

            {/* Side-by-Side Images */}
            <View className="px-6 mb-6 flex-row justify-between gap-3">
              <View className="flex-1">
                <Text 
                  style={{ color: isDark ? "rgba(248,250,252,0.5)" : "rgba(34,69,28,0.6)", fontFamily: "Quicksand_700Bold" }}
                  className="text-[11px] uppercase tracking-wider mb-2"
                >
                  Your Scan
                </Text>
                <View 
                  style={{ borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(162,207,163,0.5)", borderWidth: 1 }}
                  className="aspect-square bg-slate-200 rounded-2xl overflow-hidden"
                >
                  <Image source={{ uri: scan.imageUri }} className="w-full h-full" resizeMode="cover" />
                </View>
              </View>

              <View className="flex-1">
                <Text 
                  style={{ color: isDark ? "rgba(248,250,252,0.5)" : "rgba(34,69,28,0.6)", fontFamily: "Quicksand_700Bold" }}
                  className="text-[11px] uppercase tracking-wider mb-2"
                >
                  Reference
                </Text>
                <View 
                  style={{ 
                    borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(162,207,163,0.5)", 
                    borderWidth: 1,
                    backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(162,207,163,0.15)"
                  }}
                  className="aspect-square rounded-2xl overflow-hidden items-center justify-center"
                >
                  {libraryMatch?.imageUrl ? (
                    <Image source={{ uri: libraryMatch.imageUrl }} className="w-full h-full" resizeMode="cover" />
                  ) : (
                    <Ionicons name="leaf-outline" size={28} color={isDark ? "rgba(248,250,252,0.3)" : "#A2CFA3"} />
                  )}
                </View>
              </View>
            </View>

            {/* Details Card */}
            <View className="px-6 mb-6">
              <View 
                style={{
                  backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#FAFEEF",
                  borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(162,207,163,0.55)",
                  borderWidth: 1,
                }}
                className="rounded-2xl p-4 shadow-sm"
              >
                <View className="mb-4">
                  <View className="flex-row justify-between items-end mb-2">
                    <Text 
                      style={{ color: isDark ? "rgba(248,250,252,0.8)" : "rgba(34,69,28,0.8)", fontFamily: "Quicksand_600SemiBold" }}
                      className="text-xs"
                    >
                      AI Confidence
                    </Text>
                    <Text style={{ color: confStyles.text, fontFamily: "Quicksand_700Bold" }} className="text-base">{displayConf}%</Text>
                  </View>
                  <View style={{ backgroundColor: confStyles.bar }} className="h-2 rounded-full overflow-hidden">
                    <View className="h-full rounded-full" style={{ width: `${displayConf}%`, backgroundColor: confStyles.bg }} />
                  </View>
                </View>

                <View style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(162,207,163,0.3)" }} className="h-px mb-3" />

                <View className="gap-3">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                      <Feather name="camera" size={14} color={isDark ? "rgba(248,250,252,0.6)" : "#4D8035"} />
                      <Text style={{ color: isDark ? "rgba(248,250,252,0.6)" : "#4D8035", fontFamily: "Quicksand_500Medium" }} className="text-xs">Captured on</Text>
                    </View>
                    <Text style={{ color: isDark ? "#F8FAFC" : "#22451C", fontFamily: "Quicksand_600SemiBold" }} className="text-xs">{formatDate(scan.scannedAt)}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Actions */}
            <View className="px-6 gap-3">
              {/* Library navigation or fallback */}
              {libraryMatch ? (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    onClose();
                    router.push(`/(tabs)/library/${libraryMatch.id}`);
                  }}
                  style={{ backgroundColor: "#4D8035" }}
                  className="w-full flex-row items-center justify-center gap-2 py-3.5 rounded-xl shadow-sm"
                >
                  <Ionicons name="book-outline" size={18} color="white" />
                  <Text style={{ fontFamily: "Quicksand_700Bold" }} className="text-white text-sm tracking-wide">
                    View Full MedicinalPlant Info
                  </Text>
                </TouchableOpacity>
              ) : (
                <View 
                  style={{
                    backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(162,207,163,0.15)",
                    borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(162,207,163,0.4)",
                    borderWidth: 1,
                  }}
                  className="rounded-xl p-3 flex-row gap-3 items-center"
                >
                  <Feather name="info" size={16} color={isDark ? "rgba(248,250,252,0.6)" : "#4D8035"} />
                  <Text style={{ color: isDark ? "rgba(248,250,252,0.8)" : "rgba(34,69,28,0.8)", fontFamily: "Quicksand_500Medium" }} className="flex-1 text-xs">
                    Not documented in the Library yet.
                  </Text>
                </View>
              )}

              {/* Delete Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleDelete}
                style={{
                  backgroundColor: "transparent",
                  borderColor: isDark ? "rgba(239, 68, 68, 0.4)" : "#fca5a5",
                  borderWidth: 1,
                }}
                className="w-full flex-row items-center justify-center gap-2 py-3.5 rounded-xl mt-4"
              >
                <Feather name="trash-2" size={16} color={isDark ? "#fca5a5" : "#dc2626"} />
                <Text style={{ fontFamily: "Quicksand_700Bold", color: isDark ? "#fca5a5" : "#dc2626" }} className="text-sm">
                  Delete Scan
                </Text>
              </TouchableOpacity>
            </View>

          </ScrollView>
        )}
      </View>
    </Modal>
  );
}
