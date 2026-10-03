import { LanguageDialogProvider } from "@/src/components/ui/LanguageSheet";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Easing, Pressable, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "@/src/i18n/useTranslation";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Tabs } from "expo-router";
import { useColorScheme } from "nativewind";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { House, BookOpen, ScanLine, History, UserRound } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing as AnimatedEasing, useReducedMotion } from "react-native-reanimated";
import { useCameraStore } from "../../src/store/useCameraStore";

const tabs = [
  { name: "index", label: "Home", labelKey: "tab_home", Icon: House },
  { name: "library", label: "Library", labelKey: "tab_library", Icon: BookOpen },
  { name: "scan", label: "Scan", labelKey: "tab_scan", Icon: ScanLine },
  { name: "history", label: "History", labelKey: "tab_history", Icon: History },
  { name: "profile", label: "Profile", labelKey: "tab_profile", Icon: UserRound },
] as const;

function NavItem({ tab, active, dark, busy, onPress, onLongPress }: { tab: typeof tabs[number]; active: boolean; dark: boolean; busy: boolean; onPress: () => void; onLongPress: () => void }) {
  const scale = useSharedValue(1);
  const reduced = useReducedMotion();
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const { t } = useTranslation();
  const center = tab.name === "scan";
  const color = active ? (dark ? "#C5FFDE" : "#22451C") : (dark ? "#A5B2B7" : "#647661");
  return <Pressable onPress={onPress} onLongPress={onLongPress}
    onPressIn={() => { scale.value = reduced ? 1 : withTiming(0.93, { duration: 100 }); }}
    onPressOut={() => { scale.value = withTiming(1, { duration: reduced ? 0 : 140 }); }}
    disabled={center && busy} accessibilityRole="tab" accessibilityLabel={t(tab.labelKey)}
    accessibilityState={{ selected: active, disabled: center && busy }}
    style={{ flex: 1, minHeight: 56, alignItems: "center", justifyContent: "center" }}>
    <Animated.View style={[style, { width: "100%", minHeight: 44, alignItems: "center", justifyContent: "center", gap: 2 }]}>
      {center && busy ? <ActivityIndicator color={color} /> : <tab.Icon size={19} color={color} strokeWidth={active ? 2.2 : 1.8} />}
      <Text numberOfLines={1} style={{ fontFamily: active ? "Quicksand_700Bold" : "Quicksand_500Medium", fontSize: 10, color }}>{t(tab.labelKey)}</Text>
    </Animated.View>
  </Pressable>;
}

function GlassTabBar({ state, navigation }: BottomTabBarProps) {
  const dark = useColorScheme().colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const busy = useCameraStore(s => s.isProcessing);
  const capture = useCameraStore(s => s.triggerCapture);
  const [width, setWidth] = useState(0);
  const reduced = useReducedMotion();
  const selectedIndex = tabs.findIndex(tab => tab.name === state.routes[state.index]?.name);
  const position = useSharedValue(selectedIndex);
  useEffect(() => {
    position.value = withTiming(selectedIndex, { duration: reduced ? 0 : 260, easing: AnimatedEasing.out(AnimatedEasing.cubic) });
  }, [selectedIndex, reduced, position]);
  const indicator = useAnimatedStyle(() => ({
    transform: [{ translateX: position.value * width / tabs.length }],
  }));
  return <View onLayout={event => setWidth(event.nativeEvent.layout.width - 14)} style={{ position: "absolute", bottom: Math.max(insets.bottom, 12), left: 12, right: 12,
    borderRadius: 15, shadowColor: "#07140C", shadowOpacity: dark ? 0.35 : 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 5 }}>
    <View style={{ paddingHorizontal: 6, flexDirection: "row", borderRadius: 15, overflow: "hidden", borderWidth: 1,
      borderColor: dark ? "rgba(193,220,209,0.22)" : "rgba(112,150,107,0.28)" }}>
    <LinearGradient pointerEvents="none" colors={dark ? ["#263330", "#131D1B", "#263137"] : ["#FDFFF6", "#EFF5E7", "#F8FCEE"]}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0 }} />
    {width > 0 && <Animated.View pointerEvents="none" style={[indicator, {
      position: "absolute", left: 9, top: 6, width: Math.max(0, width / tabs.length - 4), height: 44,
      borderRadius: 10, overflow: "hidden", borderWidth: 1,
      borderColor: dark ? "rgba(111,230,169,0.25)" : "rgba(114,153,85,0.20)",
    }]}>
      <LinearGradient colors={dark ? ["#2B5741", "#183D2C", "#295740"] : ["#DCECCF", "#E8F3DB", "#D1E6BF"]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }} />
    </Animated.View>}
    {tabs.map(tab => {
      const route = state.routes.find(r => r.name === tab.name);
      const active = state.routes[state.index]?.name === tab.name;
      return <NavItem key={tab.name} tab={tab} active={active} dark={dark} busy={busy}
        onLongPress={() => navigation.emit({ type: "tabLongPress", target: route?.key })}
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          const event = navigation.emit({ type: "tabPress", target: route?.key, canPreventDefault: true });
          if (!active && !event.defaultPrevented) navigation.navigate(tab.name);
          else if (active && tab.name === "scan" && !event.defaultPrevented) capture();
        }} />;
    })}
    </View>
  </View>;
}

export default function TabLayout() {
  const dark = useColorScheme().colorScheme === "dark";
  const reduced = useReducedMotion();
  return <View style={{ flex: 1, backgroundColor: dark ? "#0B120B" : "#FAFEEF" }}><LanguageDialogProvider><Tabs tabBar={props => <GlassTabBar {...props} />} screenOptions={{ headerShown: false,
    sceneStyle: { backgroundColor: dark ? "#0B120B" : "#FAFEEF" },
    animation: reduced ? "none" : "fade",
    transitionSpec: { animation: "timing", config: { duration: 240, easing: Easing.inOut(Easing.cubic) } },
  }}>
    {tabs.map(tab => <Tabs.Screen key={tab.name} name={tab.name} options={{ title: tab.label }} />)}
  </Tabs></LanguageDialogProvider></View>;
}
