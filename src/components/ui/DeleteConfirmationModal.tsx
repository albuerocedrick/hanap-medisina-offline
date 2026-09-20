import React, { useEffect } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeIn,
  FadeOut,
  ZoomIn,
  ZoomOut,
  useReducedMotion,
} from "react-native-reanimated";
import { useTheme } from "@/src/theme/useTheme";

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

export function DeleteConfirmationModal({
  visible,
  title,
  message,
  itemName,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  itemCount,
  onConfirm,
  onCancel,
}: DeleteConfirmationModalProps) {
  const t = useTheme();
  const reduceMotion = useReducedMotion();
  const isDark = t.isDark;

  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    }
  }, [visible]);

  if (!visible) return null;

  const isMultiple = itemCount !== undefined && itemCount > 1;

  const displayTitle = isMultiple
    ? `Delete ${itemCount} Scans?`
    : title || "Delete Scan?";

  const displayMessage = isMultiple
    ? `Are you sure you want to permanently delete these ${itemCount} selected scans?\n\nThis action cannot be undone.`
    : message || `Are you sure you want to permanently delete the scan for ${itemName || "this plant"}?\n\nThis action cannot be undone.`;

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onCancel();
  };

  const handleConfirm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onConfirm();
  };

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 9999, elevation: 9999 }]} pointerEvents="box-none">
      <View style={styles.backdrop}>
        {/* Backdrop Tap to Dismiss */}
        <Pressable style={StyleSheet.absoluteFill} onPress={handleCancel}>
          <Animated.View
            entering={FadeIn.duration(180)}
            exiting={FadeOut.duration(140)}
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: "rgba(11, 18, 11, 0.6)" },
            ]}
          />
        </Pressable>

        {/* Modal Card */}
        <Animated.View
          entering={reduceMotion ? FadeIn.duration(180) : ZoomIn.duration(240).springify().damping(20)}
          exiting={reduceMotion ? FadeOut.duration(140) : ZoomOut.duration(160)}
          style={[
            styles.card,
            {
              backgroundColor: isDark ? "#0B120B" : "#FAFEEF",
              borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(162,207,163,0.5)",
              shadowColor: isDark ? "#000" : "#22451C",
              shadowOpacity: isDark ? 0.3 : 0.1,
            },
          ]}
          accessibilityRole="alert"
        >
          {/* Header Row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 }}>
            <View style={{
                backgroundColor: isDark ? "rgba(239, 68, 68, 0.1)" : "#fee2e2",
                width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center'
            }}>
              <Feather name="trash-2" size={20} color={isDark ? "#fca5a5" : "#dc2626"} />
            </View>
            <Text
              style={[
                styles.title,
                { color: isDark ? "#F8FAFC" : "#22451C" },
              ]}
              numberOfLines={2}
            >
              {displayTitle}
            </Text>
          </View>

          {/* Description Message */}
          <Text
            style={[
              styles.message,
              { color: isDark ? "rgba(248, 250, 252, 0.6)" : "rgba(34, 69, 28, 0.7)" },
            ]}
          >
            {displayMessage}
          </Text>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            {/* Cancel Button */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleCancel}
              accessibilityRole="button"
              accessibilityLabel={cancelLabel}
              style={[
                styles.cancelButton,
                {
                  backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(162,207,163,0.15)",
                },
              ]}
            >
              <Text style={[styles.cancelText, { color: isDark ? "#F8FAFC" : "#22451C" }]}>
                {cancelLabel}
              </Text>
            </TouchableOpacity>

            {/* Delete / Confirm Button */}
            <TouchableOpacity
              activeOpacity={0.82}
              onPress={handleConfirm}
              accessibilityRole="button"
              accessibilityLabel={confirmLabel}
              style={[
                styles.deleteButton,
                {
                  backgroundColor: "transparent",
                  borderColor: isDark ? "rgba(239, 68, 68, 0.4)" : "#fca5a5",
                },
              ]}
            >
              <Text style={[styles.deleteText, { color: isDark ? "#fca5a5" : "#dc2626" }]}>
                {confirmLabel}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  card: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontFamily: "serif",
    fontSize: 22,
    fontStyle: "italic",
    flex: 1,
  },
  message: {
    fontFamily: "Quicksand_500Medium",
    fontSize: 14.5,
    lineHeight: 22,
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: {
    fontFamily: "Quicksand_600SemiBold",
    fontSize: 15,
  },
  deleteButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteText: {
    fontFamily: "Quicksand_700Bold",
    fontSize: 15,
  },
});
