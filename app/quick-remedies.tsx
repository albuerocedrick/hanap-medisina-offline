import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import React, { useCallback, useEffect, useState } from "react";
import {
  Pressable,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { PreparationGroup } from "@/src/types/homeFeed";
import { selectPreparationGroups, useFeedStore } from "@/src/store/useFeedStore";
import { useLibraryStore } from "@/src/store/useLibraryStore";
import { useTranslation } from "@/src/i18n/useTranslation";
import { useTheme } from "@/src/theme/useTheme";
import { BackButton } from "@/src/components/ui/BackButton";


const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type ViewMode = "grid" | "list";

const GUTTER = 20;
const CARD_MARGIN = 6;
const GRID_CARD_HEIGHT = 150;
const GRID_COLUMNS = 2;


function RemedyCard({ group, index, viewMode, onPress }: {
  group: PreparationGroup;
  index: number;
  viewMode: ViewMode;
  onPress: (group: PreparationGroup) => void;
}) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = useTheme();
  const { t } = useTranslation();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isList = viewMode === "list";
  const countLabel = `${group.plantCount} ${t(group.plantCount === 1 ? "common_plant" : "common_plants")}`;

  return (
    <AnimatedPressable
      entering={FadeIn.delay(index * 40)}
      onPressIn={() => { scale.value = withSpring(0.95, { damping: 15, stiffness: 300 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 300 }); }}
      onPress={() => onPress(group)}
      accessibilityRole="button"
      accessibilityLabel={`${group.method}, ${countLabel}`}
      style={[{ flex: 1, margin: CARD_MARGIN }, animatedStyle]}
    >
      <View
        style={{
          borderRadius: 20,
          padding: 16,
          flexDirection: isList ? "row" : "column",
          alignItems: "center",
          justifyContent: isList ? "flex-start" : "center",
          backgroundColor: theme.surface,
          borderWidth: 1,
          borderColor: theme.borderSubtle,
          shadowColor: "#22451C",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 4,
          elevation: 2,
          ...(isList ? { minHeight: 68 } : { height: GRID_CARD_HEIGHT }),
        }}
      >
        <View
          style={{
            width: isList ? 40 : 56,
            height: isList ? 40 : 56,
            borderRadius: isList ? 20 : 28,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: theme.accentSubtle,
          }}
        >
          <Ionicons
            name={group.icon as any}
            size={isList ? 22 : 28}
            color={isDark ? "rgba(162,207,163,0.9)" : "#4D8035"}
          />
        </View>

        <View
          style={{
            flex: isList ? 1 : undefined,
            marginLeft: isList ? 14 : 0,
            alignItems: isList ? "flex-start" : "center",
          }}
        >
          <Text
            numberOfLines={2}
            style={{
              fontFamily: "Quicksand_600SemiBold",
              fontSize: isList ? 15 : 15,
              color: theme.textPrimary,
              textAlign: isList ? "left" : "center",
              marginTop: isList ? 0 : 10,
              lineHeight: isList ? 20 : 20,
            }}
          >
            {group.method}
          </Text>

          <View
            style={{
              marginTop: isList ? 2 : 6,
              paddingHorizontal: isList ? 0 : 8,
              paddingVertical: isList ? 0 : 2,
              borderRadius: 10,
              backgroundColor: isList
                ? "transparent"
                : (isDark ? "rgba(162,207,163,0.15)" : "rgba(162,207,163,0.25)"),
            }}
          >
            <Text
              style={{
                fontFamily: "Quicksand_600SemiBold",
                fontSize: isList ? 12 : 10,
                color: isDark ? "rgba(162,207,163,0.9)" : "#4D8035",
              }}
            >
              {countLabel}
            </Text>
          </View>
        </View>

        {isList && (
          <Ionicons name="chevron-forward" size={18} color={theme.iconInactive} />
        )}
      </View>
    </AnimatedPressable>
  );
}

function ViewToggle({ mode, onChange }: { mode: ViewMode; onChange: (m: ViewMode) => void }) {
  const theme = useTheme();
  const { t } = useTranslation();

  const Option = ({ value, icon, label }: { value: ViewMode; icon: any; label: string }) => {
    const active = mode === value;
    return (
      <TouchableOpacity
        onPress={() => onChange(value)}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        accessibilityLabel={label}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={{
          width: 36,
          height: 32,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 8,
          backgroundColor: active ? theme.accentSubtle : "transparent",
        }}
      >
        <Ionicons name={icon} size={18} color={active ? theme.accent : theme.iconInactive} />
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={{
        flexDirection: "row",
        padding: 3,
        borderRadius: 11,
        backgroundColor: theme.surfaceTint,
        borderWidth: 1,
        borderColor: theme.borderSubtle,
      }}
    >
      <Option value="grid" icon="grid-outline" label={t("view_grid")} />
      <Option value="list" icon="list-outline" label={t("view_list")} />
    </View>
  );
}

export default function QuickRemediesScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = useTheme();
  const { t } = useTranslation();

  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const preparationGroups = useFeedStore(selectPreparationGroups);
  const fetchHomeFeed = useFeedStore((s) => s.fetchHomeFeed);
  const setActivePreparationMethod = useLibraryStore((s) => s.setActivePreparationMethod);

  useEffect(() => {
    if (preparationGroups.length === 0) {
      fetchHomeFeed();
    }
  }, [preparationGroups.length, fetchHomeFeed]);

  const handleGroupPress = useCallback((group: PreparationGroup) => {
    setActivePreparationMethod(group.method);
    router.push("/(tabs)/library");
  }, [setActivePreparationMethod, router]);

  const renderItem = useCallback(({ item, index }: { item: PreparationGroup; index: number }) => (
    <RemedyCard group={item} index={index} viewMode={viewMode} onPress={handleGroupPress} />
  ), [handleGroupPress, viewMode]);

  const renderHeader = () => (
    <View style={{ paddingBottom: 8, marginHorizontal: CARD_MARGIN }}>
      <Text
        style={{
          fontFamily: "Quicksand_500Medium",
          fontSize: 14,
          color: theme.textSecondary,
          marginBottom: 4,
        }}
      >
        {t("home_remedies_title")}
      </Text>
      <Text
        style={{
          fontFamily: "Quicksand_700Bold",
          fontSize: 13,
          color: isDark ? "rgba(162,207,163,0.7)" : "#4D8035",
        }}
      >
        {t("lib_plants_found").replace("{count}", String(preparationGroups.length))}
      </Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? "#0B120B" : "#FAFEEF" }}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent
      />
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: GUTTER,
            paddingVertical: 16,
            gap: 12,
          }}
        >
          <BackButton />

          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Ionicons
                name="flask-outline"
                size={18}
                color={isDark ? "rgba(162,207,163,0.8)" : "#4D8035"}
              />
              <Text
                numberOfLines={1}
                style={{
                  fontSize: 24,
                  fontFamily: "serif",
                  fontStyle: "italic",
                  fontWeight: "500",
                  color: theme.textPrimary,
                  letterSpacing: 0.3,
                }}
              >
                {t("home_remedies_title")}
              </Text>
            </View>
          </View>

          <ViewToggle mode={viewMode} onChange={setViewMode} />
        </View>

        <FlatList
          key={viewMode}
          data={preparationGroups}
          keyExtractor={(item) => item.method}
          renderItem={renderItem}
          numColumns={viewMode === "grid" ? GRID_COLUMNS : 1}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingTop: 64, paddingHorizontal: GUTTER }}>
              <View
                style={{
                  width: 64, height: 64, borderRadius: 32,
                  alignItems: "center", justifyContent: "center",
                  backgroundColor: theme.accentSubtle,
                }}
              >
                <Ionicons name="flask-outline" size={28} color={theme.iconInactive} />
              </View>
              <Text
                style={{
                  marginTop: 16, textAlign: "center",
                  fontFamily: "Quicksand_500Medium", fontSize: 14,
                  color: theme.textSecondary,
                }}
              >
                {t("home_remedies_title")}
              </Text>
            </View>
          }
          contentContainerStyle={{
            paddingHorizontal: GUTTER - CARD_MARGIN,
            paddingBottom: 120,
          }}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </View>
  );
}
