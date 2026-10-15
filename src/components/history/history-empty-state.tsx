import { useTheme } from "@/src/theme/useTheme";
import { Feather, Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";
import { useTranslation } from "@/src/i18n/useTranslation";

export const HistoryEmptyState = ({ activeTab }: { activeTab: "all" | "favorites" }) => {
  const theme = useTheme();


  const isFavorites = activeTab === "favorites";
  const { t } = useTranslation();

  return (
    <View className="flex-1 items-center justify-center px-10 pt-20">
      <View
        style={{
          backgroundColor: theme.surfaceTint,
          borderColor: theme.border,
          borderWidth: 1,
        }}
        className="mb-4 p-4 rounded-full"
      >
        {isFavorites ? (
          <Ionicons name="heart-outline" size={32} color={theme.textSecondary} />
        ) : (
          <Ionicons name="leaf-outline" size={32} color={theme.textSecondary} />
        )}
      </View>
      <Text
        style={{
          color: theme.textPrimary,
          fontFamily: "Quicksand_700Bold",
        }}
        className="text-lg text-center mb-2"
      >
        {isFavorites ? t('history_no_favorites') : t('history_no_history')}
      </Text>
      <Text
        style={{
          color: theme.textSecondary,
          fontFamily: "Quicksand_500Medium",
        }}
        className="text-sm text-center leading-relaxed"
      >
        {isFavorites
          ? t('history_fav_desc')
          : t('history_hist_desc')}
      </Text>
    </View>
  );
};