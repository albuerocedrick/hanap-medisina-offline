import { useTheme } from "@/src/theme/useTheme";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";
import { selectIsLoadingFeed, useFeedStore } from "@/src/store/useFeedStore";
import { SkeletonTriviaCard } from "./HomeSkeletons";
import { useTranslation } from "@/src/i18n/useTranslation";

export function DailyTrivia() {
  const theme = useTheme();
  const getTodayTrivia = useFeedStore((s) => s.getTodayTrivia);
  const isLoadingFeed = useFeedStore(selectIsLoadingFeed);
  const trivia = getTodayTrivia();


  const { t } = useTranslation();

  if (trivia === null && isLoadingFeed) return <View className="px-6 mb-8"><SkeletonTriviaCard /></View>;
  if (trivia === null) return null;

  return (
    <View className="px-6 mb-8">
      <Text
        className="mb-3"
        style={[{ color: theme.textPrimary }, { fontSize: 22, fontFamily: "serif", fontStyle: "italic", fontWeight: "500", letterSpacing: 0.4 }]}
      >
        {t('home_trivia_title')}
      </Text>

      <View className="border rounded-[24px] p-4" style={{ backgroundColor: theme.surface, borderColor: theme.borderSubtle }}>
        <View className="flex-row items-center">
          <View style={{ width: 24, marginRight: 10, alignItems: "center", justifyContent: "center" }}>
            <Feather
              name="book-open"
              size={19}
              color={theme.textSecondary}
            />
          </View>
          <Text className="flex-1 text-[13px] leading-[20px]" style={{ color: theme.textSecondary }}>
            {trivia.text}
          </Text>
        </View>
      </View>
    </View>
  );
}