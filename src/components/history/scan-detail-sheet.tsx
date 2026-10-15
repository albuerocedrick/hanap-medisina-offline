import { useTheme } from "@/src/theme/useTheme";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    BackHandler,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from "react-native";
import Animated, {
    interpolate,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
    Easing,
    FadeIn,
    FadeOut,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getAllPlants, MedicinalPlant } from "@/src/services/localLibrary";
import { useHistoryStore } from "@/src/store/useHistoryStore";
import { LocalScanRecord } from "@/src/types";
import { useTranslation } from "@/src/i18n/useTranslation";

const ANIM_CONFIG = { duration: 320, easing: Easing.out(Easing.cubic) };

interface Props {
  visible: boolean;
  scanId: string | null;
  onClose: () => void;
  onDeleteRequest?: (id: string) => void;
}

export function ScanDetailSheet({ visible, scanId, onClose, onDeleteRequest }: Props) {
  const theme = useTheme();
  const { t, language } = useTranslation();
  const { height } = useWindowDimensions();
  const sheetHeight = height * 0.85;
  const router = useRouter();
  const insets = useSafeAreaInsets();




  const getScanById = useHistoryStore((s) => s.getScanById);
  const toggleFavorite = useHistoryStore((s) => s.toggleFavorite);
  const scans = useHistoryStore((s) => s.scans);

  const [scan, setScan] = useState<LocalScanRecord | null>(null);
  const [libraryMatch, setLibraryMatch] = useState<MedicinalPlant | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [viewerImage, setViewerImage] = useState<string | null>(null);

  // Animated values — run entirely on UI thread, no JS freeze
  const progress = useSharedValue(0); // 0 = hidden, 1 = visible

  // Backdrop animated style
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1]),
  }));


  // Sheet animated style: slides up from bottom
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          progress.value,
          [0, 1],
          [sheetHeight, 0]
        ),
      },
    ],
  }));

  // Animate in/out whenever visible changes
  useEffect(() => {
    if (visible) {
      setIsMounted(true);
      progress.value = withTiming(1, ANIM_CONFIG);
    } else {
      progress.value = withTiming(0, ANIM_CONFIG, (finished) => {
        if (finished) runOnJS(setIsMounted)(false);
      });
    }
  }, [visible]);

  // Android hardware back button
  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [visible, onClose]);

  // Load scan data
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

        const allPlants = getAllPlants(language);
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
  }, [scanId, visible, language]);

  // Keep scan state in sync with store changes (like favorites)
  useEffect(() => {
    if (visible && scanId) {
      const currentScan = getScanById(scanId);
      if (currentScan) setScan(currentScan);
    }
  }, [scans, visible, scanId]);

  const handleDelete = () => {
    if (!scan) return;
    onClose();
    setTimeout(() => {
      onDeleteRequest?.(scan.id);
    }, 150);
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return "Unknown Date";
    return new Intl.DateTimeFormat(language === "tl" ? "fil-PH" : "en-PH", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(isoString));
  };

  const displayConf = scan ? Number((scan.confidence * 100).toFixed(2)) : 0;

  const getConfColor = (val: number) => {
    // High confidence: Solid green
    if (val >= 70) return { bg: theme.success, text: theme.success, bar: theme.successSubtle };
    // Lower confidence: Light green/Lime instead of Orange/Red
    return { bg: theme.accent, text: theme.accent, bar: theme.accentSubtle };
  };
  const confStyles = getConfColor(displayConf);

  if (!isMounted) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Dimmed Backdrop */}
      <Animated.View
        style={[StyleSheet.absoluteFill, { backgroundColor: theme.scrim }, backdropStyle]}
      >
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
      </Animated.View>

      {/* Bottom Sheet */}
      <Animated.View
        style={[
          sheetStyle,
          {
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: sheetHeight,
            paddingBottom: insets.bottom,
            backgroundColor: theme.bg,
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            borderTopWidth: 1,
            borderLeftWidth: 1,
            borderRightWidth: 1,
            borderColor: theme.border,
            overflow: "hidden",
            shadowColor: theme.shadow,
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.2,
            shadowRadius: 12,
            elevation: 20,
          },
        ]}
      >
        {/* Drag Handle */}
        <View
          style={{ backgroundColor: theme.surfaceTint }}
          className="w-12 h-1.5 rounded-full self-center mt-4 mb-2"
        />

        {/* Header */}
        <View className="flex-row items-center justify-between px-6 py-2">
          <Text
            style={{
              color: theme.textSecondary,
              fontFamily: "Quicksand_700Bold",
            }}
            className="text-sm tracking-widest uppercase"
          >
            {t("history_scan_details")}
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={t("cancel")}
            onPress={onClose}
            style={{ backgroundColor: theme.surfaceTint }}
            className="w-8 h-8 items-center justify-center rounded-full"
          >
            <Feather name="x" size={18} color={theme.textPrimary} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View className="flex-1 items-center justify-center pb-20">
            <ActivityIndicator size="large" color={theme.success} />
          </View>
        ) : error || !scan ? (
          <View className="flex-1 items-center justify-center px-6 pb-20">
            <Feather name="alert-triangle" size={40} color={theme.textSecondary} />
            <Text style={{ color: theme.textPrimary, fontFamily: "Quicksand_700Bold" }} className="text-lg mt-4 text-center">Scan Not Found</Text>
            <Text style={{ color: theme.textSecondary, fontFamily: "Quicksand_500Medium" }} className="text-center mt-2">{error}</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>

            {/* Title & Favorite Badge */}
            <View className="px-6 pt-2 pb-6 flex-row items-start justify-between gap-4">
              <View className="flex-1">
                <Text
                  style={{
                    color: theme.textPrimary,
                    fontFamily: "serif",
                    fontStyle: "italic",
                    fontWeight: "500",
                  }}
                  className="text-3xl tracking-tight mb-2"
                >
                  {scan.plantName}
                </Text>

              </View>

              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={t(scan.isFavorite ? "a11y_remove_favorite" : "a11y_add_favorite")}
                accessibilityState={{ selected: scan.isFavorite }}
                onPress={() => toggleFavorite(scan.id)}
                style={{
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  borderWidth: StyleSheet.hairlineWidth,
                }}
                className="w-12 h-12 rounded-full items-center justify-center"
              >
                <Ionicons
                  name={scan.isFavorite ? "heart" : "heart-outline"}
                  size={24}
                  color={scan.isFavorite ? theme.danger : theme.textSecondary}
                />
              </TouchableOpacity>
            </View>

            {/* Side-by-Side Images */}
            <View className="px-6 mb-6 flex-row justify-between gap-3">
              <View className="flex-1">
                <Text
                  style={{ color: theme.textSecondary, fontFamily: "Quicksand_700Bold" }}
                  className="text-[11px] uppercase tracking-wider mb-2"
                >
                  Your Scan
                </Text>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => setViewerImage(scan.imageUri)}
                  style={{ borderColor: theme.border, borderWidth: 1 }}
                  className="aspect-square rounded-2xl overflow-hidden"
                >
                  <Image source={{ uri: scan.imageUri }} className="w-full h-full" resizeMode="cover" />
                </TouchableOpacity>
              </View>

              <View className="flex-1">
                <Text
                  style={{ color: theme.textSecondary, fontFamily: "Quicksand_700Bold" }}
                  className="text-[11px] uppercase tracking-wider mb-2"
                >
                  Reference
                </Text>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => libraryMatch?.imageUrl && setViewerImage(libraryMatch.imageUrl)}
                  style={{
                    borderColor: theme.border,
                    borderWidth: 1,
                    backgroundColor: theme.surfaceHighlight,
                  }}
                  className="aspect-square rounded-2xl overflow-hidden items-center justify-center"
                >
                  {libraryMatch?.imageUrl ? (
                    <Image source={{ uri: libraryMatch.imageUrl }} className="w-full h-full" resizeMode="cover" />
                  ) : (
                    <Ionicons name="leaf-outline" size={28} color={theme.textSecondary} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Details Card */}
            <View className="px-6 mb-6">
              <View
                style={{
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  borderWidth: 1,
                }}
                className="rounded-2xl p-4 shadow-sm"
              >
                <View className="mb-4">
                  <View className="flex-row justify-between items-end mb-2">
                    <Text
                      style={{ color: theme.textSecondary, fontFamily: "Quicksand_600SemiBold" }}
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

                <View style={{ backgroundColor: theme.surfaceTint }} className="h-px mb-3" />

                <View className="gap-3">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                      <Feather name="camera" size={14} color={theme.textSecondary} />
                      <Text style={{ color: theme.textSecondary, fontFamily: "Quicksand_500Medium" }} className="text-xs">Captured on</Text>
                    </View>
                    <Text style={{ color: theme.textPrimary, fontFamily: "Quicksand_600SemiBold" }} className="text-xs">{formatDate(scan.scannedAt)}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Actions */}
            <View className="px-6 gap-3">
              {libraryMatch ? (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    onClose();
                    router.push(`/(tabs)/library/${libraryMatch.id}`);
                  }}
                  style={{ backgroundColor: theme.accentStrong }}
                  className="w-full flex-row items-center justify-center gap-2 py-3.5 rounded-xl shadow-sm"
                >
                  <Ionicons name="book-outline" size={18} color={theme.onImage} />
                  <Text style={[{ color: theme.onImage }, { fontFamily: "Quicksand_700Bold" }]} className="text-sm tracking-wide">
                    View Full Plant Info
                  </Text>
                </TouchableOpacity>
              ) : (
                <View
                  style={{
                    backgroundColor: theme.surfaceTint,
                    borderColor: theme.border,
                    borderWidth: 1,
                  }}
                  className="rounded-xl p-3 flex-row gap-3 items-center"
                >
                  <Feather name="info" size={16} color={theme.textSecondary} />
                  <Text style={{ color: theme.textSecondary, fontFamily: "Quicksand_500Medium" }} className="flex-1 text-xs">
                    Not documented in the Library yet.
                  </Text>
                </View>
              )}

              {/* Delete Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleDelete}
                style={{
                    backgroundColor: theme.dangerSubtle,
                    borderColor: theme.dangerBorder,
                  borderWidth: 1,
                    minHeight: 54, marginTop: 16, borderRadius: 16,
                    flexDirection: "row", gap: 10, alignItems: "center", justifyContent: "center",
                }}
                  accessibilityRole="button"
                  accessibilityLabel={t("history_delete")}
              >
                  <Feather name="trash-2" size={18} color={theme.danger} />
                  <Text style={{ fontFamily: "Quicksand_700Bold", fontSize: 14, color: theme.danger }}>
                  Delete Scan
                </Text>
              </TouchableOpacity>
            </View>

          </ScrollView>
        )}
      </Animated.View>

      {!!viewerImage && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          style={[StyleSheet.absoluteFill, { zIndex: 9999, elevation: 9999, backgroundColor: theme.scrimStrong, justifyContent: 'center', alignItems: 'center' }]}
        >
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={t("cancel")}
            style={{ position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 10 }}
            onPress={() => setViewerImage(null)}
          >
            <Feather name="x" size={32} color={theme.onImage} />
          </TouchableOpacity>
          <Image
            source={{ uri: viewerImage }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="contain"
          />
        </Animated.View>
      )}
    </View>
  );
}
