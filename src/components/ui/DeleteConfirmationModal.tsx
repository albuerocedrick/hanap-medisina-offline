import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { AppSheet } from "./AppSheet";
import { useTheme } from "@/src/theme/useTheme";
import { useTranslation } from "@/src/i18n/useTranslation";

interface DeleteConfirmationModalProps {
  visible: boolean;
  title?: string;
  message?: string;
  itemName?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  itemCount?: number;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export function DeleteConfirmationModal({ visible, title, message, itemName, confirmLabel, cancelLabel, itemCount, onConfirm, onCancel }: DeleteConfirmationModalProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const multiple = itemCount !== undefined && itemCount > 1;
  const heading = title || (multiple ? t("history_delete_many_title").replace("{count}", String(itemCount)) : t("history_delete_title"));
  const description = message || (multiple ? t("history_delete_many_body") : t("history_delete_body"));
  const danger = theme.isDark ? "#FFB4A9" : "#A63328";
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const pending = useRef(false);
  const confirm = async () => {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setFailed(false);
    try { await onConfirm(); }
    catch { setFailed(true); }
    finally { pending.current = false; setBusy(false); }
  };
  useEffect(() => {
    if (visible) {
      setFailed(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    }
  }, [visible]);
  return <AppSheet visible={visible} title={heading} onClose={() => { if (!pending.current) onCancel(); }}>
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: 16, backgroundColor: theme.surfaceTint, borderWidth: 1, borderColor: theme.borderSubtle }}>
      <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: theme.isDark ? "#38201F" : "#FBE9E5", alignItems: "center", justifyContent: "center" }}><Feather name="trash-2" size={20} color={danger} /></View>
      <Text numberOfLines={2} style={{ flex: 1, color: theme.textPrimary, fontSize: 16, fontFamily: "Quicksand_700Bold" }}>{multiple ? `${itemCount} ${t("history_scans_label")}` : itemName || t("history_scan_label")}</Text>
    </View>
    <Text style={{ color: theme.textSecondary, fontFamily: "Quicksand_500Medium", fontSize: 14, lineHeight: 22, marginTop: 16, marginBottom: 24 }}>{description}</Text>
    {failed && <Text accessibilityRole="alert" style={{ color: danger, fontFamily: "Quicksand_500Medium", marginBottom: 16 }}>{t("history_delete_failed")}</Text>}
    <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled: busy, busy }} disabled={busy} onPress={confirm} activeOpacity={0.8}
      style={{ minHeight: 56, paddingHorizontal: 20, paddingVertical: 16, borderRadius: 16, backgroundColor: theme.isDark ? "#F0ADA2" : "#B53C32", flexDirection: "row", gap: 10, alignItems: "center", justifyContent: "center", opacity: busy ? 0.65 : 1 }}>
      {busy ? <ActivityIndicator color={theme.isDark ? "#351713" : "#FFFFFF"} /> : <Feather name="trash-2" size={19} color={theme.isDark ? "#351713" : "#FFFFFF"} />}
      <Text style={{ color: theme.isDark ? "#351713" : "#FFFFFF", fontFamily: "Quicksand_700Bold", fontSize: 15 }}>{confirmLabel || t("history_delete")}</Text>
    </TouchableOpacity>
    <TouchableOpacity accessibilityRole="button" disabled={busy} onPress={onCancel} activeOpacity={0.7}
      style={{ minHeight: 52, marginTop: 10, borderRadius: 16, borderWidth: 1, borderColor: theme.borderSubtle, backgroundColor: theme.surfaceTint, alignItems: "center", justifyContent: "center", opacity: busy ? 0.65 : 1 }}>
      <Text style={{ color: theme.textPrimary, fontFamily: "Quicksand_600SemiBold", fontSize: 14 }}>{cancelLabel || t("cancel")}</Text>
    </TouchableOpacity>
  </AppSheet>;
}
