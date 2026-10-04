import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { forwardRef, useImperativeHandle, useMemo, useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { useHistoryStore } from "../../store/useHistoryStore";
import { LocalScanRecord } from "../../types";
import { useTranslation } from "@/src/i18n/useTranslation";
import { useTheme } from "@/src/theme/useTheme";

export interface RecentScansHandle { refresh: () => Promise<void>; }
interface RecentScansProps { onScanPress?: (scan: LocalScanRecord) => void; }

function ScanThumbnail({ uri }: { uri: string }) {
  const [failed, setFailed] = useState(false);
  return <Image source={uri && !failed ? { uri } : require("../../../assets/images/plant-placeholder.jpg")} onError={() => setFailed(true)} style={{ width: 76, height: 82, borderRadius: 14 }} resizeMode="cover" accessible={false} />;
}

export const RecentScans = forwardRef<RecentScansHandle, RecentScansProps>(function RecentScans({ onScanPress }, ref) {
  const theme = useTheme();
  const { t, language } = useTranslation();
  const scans = useHistoryStore(s => s.scans);
  const recentScans = useMemo(() => [...scans].sort((a, b) => new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime()).slice(0, 3), [scans]);
  useImperativeHandle(ref, () => ({ refresh: async () => new Promise(resolve => setTimeout(resolve, 500)) }));
  const surface = theme.surface;
  return <View style={{ paddingHorizontal: 24, marginBottom: 32 }}>
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
      <Text style={{ flex: 1, color: theme.textPrimary, fontFamily: "Quicksand_700Bold", fontSize: 20 }}>{t("home_recent_scans_title")}</Text>
      <TouchableOpacity activeOpacity={0.65} accessibilityRole="button" onPress={() => router.push("/(tabs)/history")} style={{ minHeight: 44, flexDirection: "row", gap: 5, alignItems: "center", paddingLeft: 10 }}>
        <Text style={{ color: theme.textSecondary, fontFamily: "Quicksand_600SemiBold", fontSize: 13 }}>{t("home_see_all")}</Text><Feather name="arrow-up-right" size={16} color={theme.textSecondary} />
      </TouchableOpacity>
    </View>
    {recentScans.length === 0 ? <View style={{ borderRadius: 20, padding: 20, flexDirection: "row", gap: 14, alignItems: "center", backgroundColor: surface, borderWidth: 1, borderColor: theme.borderSubtle }}>
      <View style={{ width: 46, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: theme.accentSubtle }}><Feather name="camera" size={21} color={theme.accent} /></View>
      <View style={{ flex: 1 }}><Text style={{ color: theme.textPrimary, fontFamily: "Quicksand_700Bold", fontSize: 15 }}>{t("history_no_history")}</Text><Text style={{ color: theme.textSecondary, fontFamily: "Quicksand_500Medium", fontSize: 12, lineHeight: 18, marginTop: 4 }}>{t("history_hist_desc")}</Text></View>
    </View> : <View style={{ backgroundColor: surface, borderRadius: 22, borderWidth: 1, borderColor: theme.borderSubtle, overflow: "hidden" }}>
      {recentScans.map((scan, index) => <TouchableOpacity key={scan.id} activeOpacity={0.75} accessibilityRole="button" accessibilityLabel={`${scan.plantName}, ${Math.round(scan.confidence * 100)}${t("scan_match")}`} onPress={() => onScanPress ? onScanPress(scan) : router.push({ pathname: "/(tabs)/history", params: { scanId: scan.id, openAt: String(Date.now()) } })}
        style={{ flexDirection: "row", alignItems: "center", gap: 14, padding: 12, minHeight: 108 }}>
        <ScanThumbnail uri={scan.imageUri} />
        <View style={{ flex: 1, gap: 7 }}>
          <Text numberOfLines={1} style={{ color: theme.textPrimary, fontFamily: "Quicksand_700Bold", fontSize: 16 }}>{scan.plantName}</Text>
          <Text style={{ color: theme.textSecondary, fontFamily: "Quicksand_500Medium", fontSize: 12 }}>{new Date(scan.scannedAt).toLocaleDateString(language === "tl" ? "fil-PH" : "en-PH", { month: "short", day: "numeric" })}</Text>
          <View style={{ alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: theme.accentSubtle, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
            <Feather name="check-circle" size={11} color={theme.accent} />
            <Text style={{ color: theme.textSecondary, fontFamily: "Quicksand_600SemiBold", fontSize: 11 }}>{Math.round(scan.confidence * 100)}{t("scan_match")}</Text>
          </View>
        </View>
        <Feather name="chevron-right" size={17} color={theme.iconInactive} />
        {index < recentScans.length - 1 && <View pointerEvents="none" style={{ position: "absolute", bottom: 0, left: 102, right: 16, height: 1, backgroundColor: theme.borderSubtle }} />}
      </TouchableOpacity>)}
    </View>}
  </View>;
});
