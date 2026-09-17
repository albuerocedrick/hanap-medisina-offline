import React, { useEffect } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeIn,
  FadeOut,
  ZoomIn,
  ZoomOut,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useTheme } from "@/src/theme/useTheme";
import { MIN_TOUCH_TARGET, spacing } from "@/src/theme/tokens";

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

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function DeleteConfirmationModal({
  visible,
  title = "Delete Scan",
  message = "This scan and its stored image will be permanently deleted from your device.",
  itemName,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  itemCount,
  onConfirm,
  onCancel,
}: DeleteConfirmationModalProps) {
  const t = useTheme();
  const reduceMotion = useReducedMotion();

  const confirmScale = useSharedValue(1);
  const cancelScale = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    }
  }, [visible]);

  if (!visible) return null;

  const isMultiple = itemCount !== undefined && itemCount > 1;

  const displayTitle = isMultiple
    ? `Delete ${itemCount} Scans`
    : itemName
    ? `Delete ${itemName}?`
    : title;

  const displayMessage = isMultiple
    ? `Are you sure you want to permanently delete these ${itemCount} selected scans? This action cannot be undone.`
    : message;

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onCancel();
  };

  const handleConfirm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onConfirm();
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleCancel}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        {/* Backdrop Tap to Dismiss */}
        <Pressable style={StyleSheet.absoluteFill} onPress={handleCancel}>
          <Animated.View
            entering={FadeIn.duration(180)}
            exiting={FadeOut.duration(140)}
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: t.isDark ? "rgba(0, 0, 0, 0.78)" : "rgba(10, 20, 10, 0.52)" },
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
              backgroundColor: t.isDark ? "#132113" : "#FAFEEF",
              borderColor: t.isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(34, 69, 28, 0.14)",
              shadowColor: t.isDark ? "#000000" : "#22451C",
              shadowOpacity: t.isDark ? 0.45 : 0.16,
            },
          ]}
          accessibilityRole="alert"
        >
          {/* Subtle Accent Glow Ring & Icon Disc */}
          <View
            style={[
              styles.iconOuterRing,
              {
                backgroundColor: t.isDark
                  ? "rgba(239, 68, 68, 0.12)"
                  : "rgba(220, 38, 38, 0.08)",
                borderColor: t.isDark
                  ? "rgba(239, 68, 68, 0.25)"
                  : "rgba(220, 38, 38, 0.16)",
              },
            ]}
          >
            <View
              style={[
                styles.iconInnerDisc,
                {
                  backgroundColor: t.isDark
                    ? "rgba(239, 68, 68, 0.22)"
                    : "rgba(220, 38, 38, 0.14)",
                },
              ]}
            >
              <Ionicons
                name="trash-outline"
                size={26}
                color={t.isDark ? "#F87171" : "#DC2626"}
              />
            </View>
          </View>

          {/* Title */}
          <Text
            style={[
              styles.title,
              { color: t.textPrimary },
            ]}
            numberOfLines={2}
            maxFontSizeMultiplier={1.4}
          >
            {displayTitle}
          </Text>

          {/* Target Chip (if single item with name or multi batch) */}
          {(itemName || isMultiple) && (
            <View
              style={[
                styles.targetChip,
                {
                  backgroundColor: t.isDark ? "rgba(255,255,255,0.06)" : "rgba(34,69,28,0.06)",
                  borderColor: t.isDark ? "rgba(255,255,255,0.1)" : "rgba(34,69,28,0.1)",
                },
              ]}
            >
              <Ionicons
                name={isMultiple ? "layers-outline" : "leaf-outline"}
                size={14}
                color={t.textSecondary}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.targetChipText,
                  { color: t.textSecondary },
                ]}
                numberOfLines={1}
              >
                {isMultiple ? `${itemCount} items selected` : itemName}
              </Text>
            </View>
          )}

          {/* Description Message */}
          <Text
            style={[
              styles.message,
              { color: t.isDark ? "rgba(248, 250, 252, 0.7)" : "rgba(34, 69, 28, 0.72)" },
            ]}
            maxFontSizeMultiplier={1.5}
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
                  backgroundColor: t.isDark ? "rgba(255, 255, 255, 0.07)" : "rgba(34, 69, 28, 0.07)",
                  borderColor: t.isDark ? "rgba(255, 255, 255, 0.14)" : "rgba(34, 69, 28, 0.16)",
                },
              ]}
            >
              <Text
                style={[
                  styles.cancelText,
                  { color: t.textPrimary },
                ]}
                maxFontSizeMultiplier={1.3}
              >
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
                  backgroundColor: t.isDark ? "#DC2626" : "#DC2626",
                  shadowColor: "#DC2626",
                },
              ]}
            >
              <Ionicons name="trash" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.deleteText} maxFontSizeMultiplier={1.3}>
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
    paddingHorizontal: 28,
  },
  card: {
    width: "100%",
    maxWidth: 348,
    borderRadius: 28,
    paddingHorizontal: spacing.xl,
    paddingTop: 28,
    paddingBottom: 22,
    alignItems: "center",
    borderWidth: 1,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 24,
    elevation: 10,
  },
  iconOuterRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 1,
  },
  iconInnerDisc: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: "Quicksand_700Bold",
    fontSize: 19,
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  targetChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 10,
    maxWidth: "92%",
  },
  targetChipText: {
    fontFamily: "Quicksand_600SemiBold",
    fontSize: 12,
    letterSpacing: 0.1,
  },
  message: {
    fontFamily: "Quicksand_500Medium",
    fontSize: 13.5,
    lineHeight: 19,
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 6,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  cancelButton: {
    flex: 1,
    minHeight: MIN_TOUCH_TARGET,
    paddingVertical: 13,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  cancelText: {
    fontFamily: "Quicksand_700Bold",
    fontSize: 14.5,
  },
  deleteButton: {
    flex: 1,
    minHeight: MIN_TOUCH_TARGET,
    paddingVertical: 13,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 3,
  },
  deleteText: {
    fontFamily: "Quicksand_700Bold",
    fontSize: 14.5,
    color: "#FFFFFF",
  },
});
