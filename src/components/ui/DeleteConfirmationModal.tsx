import React, { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
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
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmationModal({ visible, title, message, itemName, confirmLabel, cancelLabel, itemCount, onConfirm, onCancel }: DeleteConfirmationModalProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const multiple = itemCount !== undefined && itemCount > 1;
  const heading = title || (multiple ? t("history_delete_many_title").replace("{count}", String(itemCount)) : t("history_delete_title"));
  const description = message || (multiple ? t("history_delete_many_body") : t("history_delete_body"));
  const danger = theme.isDark ? "#FFB4A9" : "#A63328";
  useEffect(() => {
    if (visible) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
  }, [visible]);
  return <AppSheet visible={visible} title={heading} onClose={onCancel}>
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: 16, backgroundColor: theme.surfaceTint, borderWidth: 1, borderColor: theme.borderSubtle }}>
      <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: theme.isDark ? "#38201F" : "#FBE9E5", alignItems: "center", justifyContent: "center" }}><Feather name="trash-2" size={20} color={danger} /></View>
      <Text numberOfLines={2} style={{ flex: 1, color: theme.textPrimary, fontSize: 16, fontFamily: "Quicksand_700Bold" }}>{multiple ? `${itemCount} ${t("history_scans_label")}` : itemName || t("history_scan_label")}</Text>
    </View>
    <Text style={{ color: theme.textSecondary, fontFamily: "Quicksand_500Medium", fontSize: 14, lineHeight: 22, marginTop: 16, marginBottom: 24 }}>{description}</Text>
    <View style={{ flexDirection: "row", gap: 12 }}>
      <Pressable accessibilityRole="button" onPress={onCancel} style={({ pressed }) => ({ flex: 1, minHeight: 52, paddingHorizontal: 10, paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: theme.borderSubtle, backgroundColor: pressed ? theme.surfacePressed : theme.surfaceTint, alignItems: "center", justifyContent: "center" })}>
        <Text style={{ color: theme.textPrimary, fontFamily: "Quicksand_700Bold", fontSize: 14 }}>{cancelLabel || t("cancel")}</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={onConfirm} style={({ pressed }) => ({ flex: 1, minHeight: 52, paddingHorizontal: 10, paddingVertical: 14, borderRadius: 14, backgroundColor: pressed ? "#85271F" : "#A63328", flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center" })}>
        <Feather name="trash-2" size={16} color="#FFFFFF" /><Text style={{ color: "#FFFFFF", fontFamily: "Quicksand_700Bold", fontSize: 14 }}>{confirmLabel || t("history_delete")}</Text>
      </Pressable>
    </View>
  </AppSheet>;
}
