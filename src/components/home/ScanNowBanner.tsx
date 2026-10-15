import { useTheme } from "@/src/theme/useTheme";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useTranslation } from "@/src/i18n/useTranslation";

export function ScanNowBanner() {
  const theme = useTheme();

  const isDark = theme.isDark;
  const { t } = useTranslation();

  return (
    <View className="px-[22px] mb-6">
      <TouchableOpacity
        className="rounded-[24px] px-4 py-4 border"
        style={{
          backgroundColor: theme.surface,
          borderColor: theme.border,
          shadowColor: theme.shadow,
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: isDark ? 0.2 : 0.06,
          shadowRadius: 8,
          elevation: 2,
        }}
        onPress={() => router.push("/(tabs)/scan")}
        activeOpacity={0.9}
      >
        <View className="flex-row items-center">
          <View
            className="w-[44px] h-[44px] rounded-[14px] items-center justify-center mr-3"
            style={{
              backgroundColor: theme.surfaceTint,
            }}
          >
            <Feather name="camera" size={20} color={theme.textPrimary} />
          </View>

          <View className="flex-1">
            <Text
              className="font-bold text-[15px] leading-tight"
              style={{ color: theme.textPrimary }}
            >
              {t('home_scan_banner_title')}
            </Text>
            <Text
              className="text-[12px] mt-0.5"
              style={{ color: theme.textSecondary }}
            >
              {t('home_scan_banner_sub')}
            </Text>
          </View>

          <View
            className="w-9 h-9 rounded-full items-center justify-center"
            style={{
              backgroundColor: theme.surfaceTint,
              borderWidth: 1,
              borderColor: theme.border,
            }}
          >
            <Feather name="arrow-up-right" size={15} color={theme.textPrimary} />
          </View>
        </View>

        <View
          className="mt-3 pt-3 flex-row items-center justify-between"
          style={{ borderTopWidth: 1, borderTopColor: theme.border }}
        >
          <Text
            className="text-[11px] font-medium tracking-[0.3px]"
            style={{ color: theme.textSecondary }}
          >
            Point camera at leaf for best results
          </Text>
          <Feather
            name="zap"
            size={13}
            color={theme.textSecondary}
          />
        </View>
      </TouchableOpacity>
    </View>
  );
}