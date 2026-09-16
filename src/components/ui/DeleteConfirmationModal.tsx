import React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import Animated, { FadeIn, FadeOut, ZoomIn, ZoomOut } from "react-native-reanimated";

interface DeleteConfirmationModalProps {
  visible: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  itemCount?: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmationModal({
  visible,
  title = "Delete Scan",
  message = "Are you sure you want to delete this scan? This action cannot be undone.",
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  itemCount,
  onConfirm,
  onCancel,
}: DeleteConfirmationModalProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  if (!visible) return null;

  const displayTitle = itemCount !== undefined && itemCount > 1
    ? `Delete ${itemCount} Scans`
    : title;

  const displayMessage = itemCount !== undefined && itemCount > 1
    ? `Are you sure you want to delete ${itemCount} selected scans? This action cannot be undone.`
    : message;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        {/* Backdrop tap to dismiss */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel}>
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(150)}
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: isDark ? "rgba(0,0,0,0.72)" : "rgba(0,0,0,0.5)" },
            ]}
          />
        </Pressable>

        {/* Modal Card */}
        <Animated.View
          entering={ZoomIn.duration(220).springify().damping(18)}
          exiting={ZoomOut.duration(160)}
          style={[
            styles.card,
            {
              backgroundColor: isDark ? "#141F14" : "#FAFEEF",
              borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(34,69,28,0.15)",
              shadowColor: "#000",
              shadowOpacity: isDark ? 0.4 : 0.15,
            },
          ]}
        >
          {/* Warning Icon Disc */}
          <View
            style={[
              styles.iconDisc,
              {
                backgroundColor: isDark ? "rgba(239, 68, 68, 0.18)" : "rgba(239, 68, 68, 0.12)",
                borderColor: isDark ? "rgba(239, 68, 68, 0.35)" : "rgba(239, 68, 68, 0.25)",
              },
            ]}
          >
            <Ionicons name="trash-outline" size={28} color="#EF4444" />
          </View>

          {/* Title */}
          <Text
            style={[
              styles.title,
              { color: isDark ? "#F8FAFC" : "#1A2E16" },
            ]}
          >
            {displayTitle}
          </Text>

          {/* Message */}
          <Text
            style={[
              styles.message,
              { color: isDark ? "rgba(248,250,252,0.65)" : "rgba(34,69,28,0.7)" },
            ]}
          >
            {displayMessage}
          </Text>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            {/* Cancel Button */}
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={onCancel}
              style={[
                styles.cancelButton,
                {
                  backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(34,69,28,0.08)",
                  borderColor: isDark ? "rgba(255,255,255,0.14)" : "rgba(34,69,28,0.18)",
                },
              ]}
            >
              <Text
                style={[
                  styles.cancelText,
                  { color: isDark ? "rgba(248,250,252,0.85)" : "#22451C" },
                ]}
              >
                {cancelLabel}
              </Text>
            </TouchableOpacity>

            {/* Delete (Destructive) Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={onConfirm}
              style={styles.deleteButton}
            >
              <Ionicons name="trash" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.deleteText}>
                {confirmLabel}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
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
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 22,
    alignItems: "center",
    borderWidth: 1,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 24,
    elevation: 8,
  },
  iconDisc: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 1,
  },
  title: {
    fontFamily: "Quicksand_700Bold",
    fontSize: 20,
    textAlign: "center",
    marginBottom: 8,
  },
  message: {
    fontFamily: "Quicksand_500Medium",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  cancelText: {
    fontFamily: "Quicksand_700Bold",
    fontSize: 14,
  },
  deleteButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DC2626",
    flexDirection: "row",
    shadowColor: "#DC2626",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 2,
  },
  deleteText: {
    fontFamily: "Quicksand_700Bold",
    fontSize: 14,
    color: "#FFFFFF",
  },
});
