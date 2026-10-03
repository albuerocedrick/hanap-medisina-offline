import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { forwardRef, useImperativeHandle, useMemo } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useHistoryStore } from "../../store/useHistoryStore";
import { LocalScanRecord } from "../../types";
import { useTranslation } from "@/src/i18n/useTranslation";
import { useTheme } from "@/src/theme/useTheme";

export interface RecentScansHandle { refresh: () => Promise<void>; }
interface RecentScansProps { onScanPress?: (scan: LocalScanRecord) => void; }

export const RecentScans = forwardRef<RecentScansHandle, RecentScansProps>(function RecentScans({ onScanPress }, ref) {
  const theme = useTheme();
  const { t, language } = useTranslation();
  const scans = useHistoryStore(s => s.scans);
  const recentScans = useMemo(() => [...scans].sort((a, b) => new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime()).slice(0, 3), [scans]);
  useImperativeHandle(ref, () => ({ refresh: async () => new Promise(resolve => setTimeout(resolve, 500)) }));
  const surface = theme.isDark ? "#162916" : "#F5FAED";
  return <View style={{ paddingHorizontal: 24, marginBottom: 32 }}>
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
      <Text style={{ flex: 1, color: theme.textPrimary, fontFamily: "Quicksand_700Bold", fontSize: 20 }}>{t("home_recent_scans_title")}</Text>
      <Pressable accessibilityRole="button" onPress={() => router.push("/(tabs)/history")} style={({ pressed }) => ({ minHeight: 44, flexDirection: "row", gap: 4, alignItems: "center", paddingLeft: 10, opacity: pressed ? 0.6 : 1 })}>
        <Text style={{ color: theme.textSecondary, fontFamily: "Quicksand_600SemiBold", fontSize: 13 }}>{t("home_see_all")}</Text><Feather name="arrow-up-right" size={16} color={theme.textSecondary} />
      </Pressable>
    </View>
    {recentScans.length === 0 ? <View style={{ borderRadius: 20, padding: 20, flexDirection: "row", gap: 14, alignItems: "center", backgroundColor: surface, borderWidth: 1, borderColor: theme.borderSubtle }}>
      <View style={{ width: 46, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: theme.accentSubtle }}><Feather name="camera" size={21} color={theme.accent} /></View>
      <View style={{ flex: 1 }}><Text style={{ color: theme.textPrimary, fontFamily: "Quicksand_700Bold", fontSize: 15 }}>{t("history_no_history")}</Text><Text style={{ color: theme.textSecondary, fontFamily: "Quicksand_500Medium", fontSize: 12, lineHeight: 18, marginTop: 4 }}>{t("history_hist_desc")}</Text></View>
    </View> : <View style={{ gap: 10 }}>
      {recentScans.map(scan => <Pressable key={scan.id} accessibilityRole="button" accessibilityLabel={scan.plantName} onPress={() => onScanPress?.(scan)} style={({ pressed }) => ({ backgroundColor: surface, borderRadius: 20, overflow: "hidden", borderWidth: 1, borderColor: theme.borderSubtle, minHeight: 104, opacity: pressed ? 0.78 : 1 })}>
        <View pointerEvents="none" style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "34%" }}>
          <Image source={scan.imageUri ? { uri: scan.imageUri } : require("../../../assets/images/plant-placeholder.jpg")} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
          <LinearGradient colors={[`${surface}00`, surface]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "35%" }} />
        </View>
        <View style={{ marginLeft: "32%", paddingLeft: 10, paddingRight: 14, paddingVertical: 14, flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={{ flex: 1, gap: 6 }}>
            <Text numberOfLines={1} style={{ color: theme.textPrimary, fontFamily: "Quicksand_700Bold", fontSize: 16 }}>{scan.plantName}</Text>
            <Text style={{ color: theme.textSecondary, fontFamily: "Quicksand_500Medium", fontSize: 12 }}>{new Date(scan.scannedAt).toLocaleDateString(language === "tl" ? "fil-PH" : "en-PH", { month: "short", day: "numeric", year: "numeric" })}</Text>
            <View style={{ alignSelf: "flex-start", backgroundColor: theme.accentSubtle, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 7 }}><Text style={{ color: theme.textSecondary, fontFamily: "Quicksand_600SemiBold", fontSize: 11 }}>{(scan.confidence * 100).toFixed(0)}{t("scan_match")}</Text></View>
          </View>
          <Feather name="chevron-right" size={17} color={theme.textSecondary} />
        </View>
      </Pressable>)}
    </View>}
  </View>;
});
