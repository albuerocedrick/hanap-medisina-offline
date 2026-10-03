import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BackHandler, Image, Keyboard, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";
import { getAllPlants, searchPlantsLocally } from "../../services/localLibrary";
import { groupPlantSearchResults } from "../../services/plantSearch";
import { useTranslation } from "@/src/i18n/useTranslation";
import { useTheme } from "@/src/theme/useTheme";

export function HomeSearchBar({ onActiveChange }: { onActiveChange?: (active: boolean) => void }) {
  const router = useRouter();
  const theme = useTheme();
  const { t, language } = useTranslation();
  const reduced = useReducedMotion();
  const tabFocused = useIsFocused();
  const input = useRef<TextInput>(null);
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const opacity = useSharedValue(0);
  const resultStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  useEffect(() => { opacity.value = withTiming(focused ? 1 : 0, { duration: reduced ? 0 : 180 }); }, [focused, reduced, opacity]);
  // Read all bundled plants immediately, even before the Library tab is opened.
  const plants = useMemo(() => getAllPlants(), [language]);
  const results = useMemo(() => query.trim() ? searchPlantsLocally(plants, query) : [], [query, plants]);
  const groups = useMemo(() => groupPlantSearchResults(results, query, language), [results, query, language]);
  const closeSearch = useCallback(() => {
    input.current?.blur();
    setFocused(false);
    setQuery("");
  }, []);
  useEffect(() => {
    const subscription = Keyboard.addListener("keyboardDidHide", closeSearch);
    return () => subscription.remove();
  }, [closeSearch]);
  useEffect(() => {
    if (!tabFocused) closeSearch();
  }, [tabFocused, closeSearch]);
  useEffect(() => {
    if (!focused) return;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      closeSearch();
      Keyboard.dismiss();
      return true;
    });
    return () => subscription.remove();
  }, [focused, closeSearch]);
  useEffect(() => { onActiveChange?.(focused); }, [focused, onActiveChange]);
  const bodyStyle = { color: theme.textSecondary, fontFamily: "Quicksand_500Medium", fontSize: 13, lineHeight: 20 };
  return <View style={{ paddingHorizontal: 22, paddingBottom: 16 }}>
    <View style={{ height: 46, borderRadius: 18, borderWidth: 1, borderColor: focused ? theme.accent : theme.border, backgroundColor: theme.surface, flexDirection: "row", alignItems: "center", paddingLeft: 14 }}>
      <Feather name="search" size={18} color={theme.textSecondary} />
      <TextInput ref={input} value={query} onChangeText={setQuery} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        placeholder={t("home_search_placeholder")} placeholderTextColor={theme.textSecondary} returnKeyType="search" blurOnSubmit={false} autoCorrect={false} autoCapitalize="none" selectionColor={theme.accent}
        style={{ flex: 1, height: 44, paddingHorizontal: 10, paddingVertical: 10, color: theme.textPrimary, fontFamily: "Quicksand_500Medium", fontSize: 14 }} />
      {query.length > 0 && <TouchableOpacity activeOpacity={0.65} accessibilityRole="button" accessibilityLabel={t("home_search_clear")} onPress={() => { setQuery(""); input.current?.focus(); }}
        style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}>
        <View style={{ width: 24, height: 24, borderRadius: 8, backgroundColor: theme.accentSubtle, alignItems: "center", justifyContent: "center" }}><Feather name="x" size={16} color={theme.textPrimary} /></View>
      </TouchableOpacity>}
    </View>
    <Animated.View collapsable={false} pointerEvents={focused ? "auto" : "none"} importantForAccessibility={focused ? "auto" : "no-hide-descendants"} style={[resultStyle, { height: focused ? undefined : 0, marginTop: focused ? 12 : 0, borderRadius: 18, backgroundColor: theme.surfaceTint, borderWidth: focused ? 1 : 0, borderColor: theme.borderSubtle, overflow: "hidden" }]}>
      {!query.trim() ? <Text style={[bodyStyle, { padding: 16 }]}>{t("home_search_hint")}</Text> : results.length === 0 ? <Text style={[bodyStyle, { padding: 16 }]}>{t("home_search_empty")}</Text> : <>
        {groups.map(group => <React.Fragment key={group.key}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 9, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: theme.accentSubtle }}>
            <Feather name="tag" size={15} color={theme.textSecondary} />
            <Text accessibilityRole="header" style={{ flex: 1, color: theme.textPrimary, fontFamily: "Quicksand_700Bold", fontSize: 15 }}>{group.label || t("home_search_plants")}</Text>
            <Text accessibilityLiveRegion="polite" style={{ color: theme.textSecondary, fontFamily: "Quicksand_600SemiBold", fontSize: 12 }}>{group.plants.length === 1 ? t("home_search_one_plant") : t("home_search_group_count").replace("{count}", String(group.plants.length))}</Text>
          </View>
        {group.plants.map(plant => <TouchableOpacity activeOpacity={0.65} key={plant.id} accessibilityRole="button" accessibilityLabel={plant.name} onPress={() => { closeSearch(); Keyboard.dismiss(); router.push(`/(tabs)/library/${plant.id}`); }}
          style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderTopWidth: 1, borderTopColor: theme.borderSubtle }}>
          <Image source={plant.imageUrl ? { uri: plant.imageUrl } : require("../../../assets/images/plant-placeholder.jpg")} style={{ width: 48, height: 54, borderRadius: 12, backgroundColor: theme.accentSubtle }} resizeMode="cover" />
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={{ color: theme.textPrimary, fontFamily: "Quicksand_700Bold", fontSize: 15, marginBottom: 3 }}>{plant.name}</Text>
            <Text numberOfLines={2} style={bodyStyle}>{plant.shortDescription}</Text>
          </View>
          <Feather name="chevron-right" size={17} color={theme.textSecondary} />
        </TouchableOpacity>)}
        </React.Fragment>)}
      </>}
    </Animated.View>
  </View>;
}
