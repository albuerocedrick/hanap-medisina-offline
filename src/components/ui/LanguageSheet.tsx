/**
 * src/components/ui/LanguageSheet.tsx
 *
 * Language picker, replacing the blind toggle in Profile.
 *
 * The old control was a menu row labelled "Language: English" that silently
 * flipped to Tagalog on tap. Three problems with that:
 *
 *   1. It never showed the options, so you could not know what you would get
 *      until after you had already changed it.
 *   2. If you tapped it by accident, the whole app was suddenly in the other
 *      language — including the row you would need to read to undo it.
 *   3. It does not scale. The moment a third language is added, a toggle is
 *      simply the wrong control.
 *
 * A picker fixes all three: both options are visible, the current one is
 * marked, and choosing is deliberate. Each language is also labelled in its
 * own language ("Tagalog", not "Filipino") — that is the one string a user who
 * cannot read the current UI language still needs to recognise.
 */

import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTranslation } from "@/src/i18n/useTranslation";
import { useTheme } from "@/src/theme/useTheme";
import type { AppLanguage } from "@/src/store/useSettingsStore";

interface LanguageOption {
  code: AppLanguage;
  /** Name in the *current* UI language. */
  label: string;
  /** Endonym — always written in its own language, never translated. */
  native: string;
  flag: string;
}

interface LanguageSheetProps {
  visible: boolean;
  current: AppLanguage;
  onSelect: (lang: AppLanguage) => void;
  onClose: () => void;
}

export function LanguageSheet({ visible, current, onSelect, onClose }: LanguageSheetProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const options: LanguageOption[] = [
    { code: "en", label: t("lang_en_name"), native: t("lang_en_native"), flag: "🇬🇧" },
    { code: "tl", label: t("lang_tl_name"), native: t("lang_tl_native"), flag: "🇵🇭" },
  ];

  const handleSelect = (lang: AppLanguage) => {
    if (lang !== current) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onSelect(lang);
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Scrim doubles as the dismiss target — standard sheet behaviour. */}
      <Animated.View
        entering={FadeIn.duration(180)}
        exiting={FadeOut.duration(150)}
        style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.45)" }]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel={t("cancel")} />
      </Animated.View>

      <View style={{ flex: 1, justifyContent: "flex-end" }} pointerEvents="box-none">
        <Animated.View
          entering={SlideInDown.duration(280).springify().damping(22)}
          exiting={SlideOutDown.duration(200)}
          style={{
            backgroundColor: theme.surface,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingTop: 10,
            paddingHorizontal: 20,
            paddingBottom: Math.max(insets.bottom, 20) + 8,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderColor: theme.border,
          }}
        >
          {/* Grabber. Signals "this is a sheet, it can be dismissed". */}
          <View
            style={{
              alignSelf: "center",
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: theme.border,
              marginBottom: 18,
            }}
          />

          <Text
            style={{
              fontFamily: "serif",
              fontStyle: "italic",
              fontSize: 24,
              color: theme.textPrimary,
              marginBottom: 4,
            }}
          >
            {t("lang_sheet_title")}
          </Text>
          <Text
            style={{
              fontFamily: "Quicksand_500Medium",
              fontSize: 14,
              lineHeight: 20,
              color: theme.textSecondary,
              marginBottom: 20,
            }}
          >
            {t("lang_sheet_subtitle")}
          </Text>

          {options.map((option) => {
            const isSelected = option.code === current;
            return (
              <Pressable
                key={option.code}
                onPress={() => handleSelect(option.code)}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={option.native}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  // 64 keeps this comfortably above the 44pt minimum even with
                  // the largest system font sizes.
                  minHeight: 64,
                  paddingHorizontal: 16,
                  borderRadius: 18,
                  marginBottom: 10,
                  backgroundColor: isSelected
                    ? theme.accentSubtle
                    : pressed
                      ? theme.surfacePressed
                      : "transparent",

                  borderWidth: isSelected ? 1.5 : StyleSheet.hairlineWidth,
                  borderColor: isSelected ? theme.accent : theme.border,
                })}
              >
                <Text style={{ fontSize: 26, marginRight: 14 }}>{option.flag}</Text>

                <View style={{ flex: 1 }}>
                  {/* Endonym leads: it is legible regardless of the current UI
                      language, which is exactly the situation someone in the
                      wrong language is in. */}
                  <Text
                    style={{
                      fontFamily: "Quicksand_700Bold",
                      fontSize: 16,
                      color: theme.textPrimary,
                    }}
                  >
                    {option.native}
                  </Text>
                  {option.label !== option.native && (
                    <Text
                      style={{
                        fontFamily: "Quicksand_500Medium",
                        fontSize: 13,
                        color: theme.textSecondary,
                        marginTop: 1,
                      }}
                    >
                      {option.label}
                    </Text>
                  )}
                </View>

                {/* Checkmark rather than a radio dot: it reads as "active"
                    rather than "pick one and confirm", which matches a control
                    that applies immediately. */}
                <View
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: isSelected ? theme.accent : "transparent",
                    borderWidth: isSelected ? 0 : 1.5,
                    borderColor: theme.border,
                  }}
                >
                  {isSelected && (
                    <Ionicons
                      name="checkmark"
                      size={16}
                      color={theme.isDark ? "#0B120B" : "#FFFFFF"}
                    />
                  )}
                </View>
              </Pressable>
            );
          })}
        </Animated.View>
      </View>
    </Modal>
  );
}
