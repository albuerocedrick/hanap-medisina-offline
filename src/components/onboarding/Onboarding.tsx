import React, { useState } from "react";
import { Pressable, ScrollView, StatusBar, Text, View } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import Animated, { FadeIn, FadeOut, useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/src/theme/useTheme";
import { useTranslation } from "@/src/i18n/useTranslation";
import { useOnboardingStore } from "@/src/store/useOnboardingStore";

export function Onboarding() {
  const [step, setStep] = useState(0);
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const complete = useOnboardingStore(s => s.complete);
  const pages = [
    { title: t("onboard_welcome"), body: t("onboard_welcome_body"), label: t("onboard_offline") },
    { title: t("onboard_prepare"), body: t("onboard_prepare_body"), label: t("onboard_one_leaf") },
    { title: t("onboard_capture"), body: t("onboard_capture_body"), label: t("onboard_ready") },
  ];
  return <View style={{ flex: 1, backgroundColor: theme.bg, paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 20) }}>
    <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 28, minHeight: 60 }}>
      <View><Text style={{ fontFamily: "Quicksand_700Bold", fontSize: 16, color: theme.textPrimary }}>HanapMedisina</Text></View>
      <Pressable onPress={complete} accessibilityRole="button" style={{ minHeight: 44, justifyContent: "center", paddingLeft: 16 }}><Text style={{ fontFamily: "Quicksand_600SemiBold", color: theme.textSecondary }}>{t("onboard_skip")}</Text></Pressable>
    </View>
    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 32, paddingVertical: 32 }} showsVerticalScrollIndicator={false}>
      <Animated.View key={step} entering={reduced ? undefined : FadeIn.duration(300)} exiting={reduced ? undefined : FadeOut.duration(100)}>
        <Text style={{ fontFamily: "Quicksand_700Bold", fontSize: 12, letterSpacing: 0.5, color: theme.accent, marginBottom: 12 }}>{pages[step].label}</Text>
        <Text accessibilityRole="header" style={{ fontFamily: "Quicksand_700Bold", fontSize: 32, lineHeight: 41, color: theme.textPrimary, marginBottom: 20 }}>{pages[step].title}</Text>
        <Text style={{ fontFamily: "Quicksand_500Medium", fontSize: 16, lineHeight: 26, color: theme.textSecondary }}>{pages[step].body}</Text>
      </Animated.View>
    </ScrollView>
    <View style={{ paddingHorizontal: 28, paddingTop: 12 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 22 }}>
        <Text style={{ fontFamily: "Quicksand_600SemiBold", fontSize: 12, color: theme.textSecondary }}>{`0${step + 1} / 03`}</Text>
        <View accessibilityLabel={`${step + 1} / 3`} style={{ flex: 1, flexDirection: "row", gap: 6 }}>{pages.map((_, index) => <View key={index} style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: index <= step ? theme.accent : theme.borderSubtle }} />)}</View>
      </View>
      <View style={{ flexDirection: "row", gap: 12 }}>
        {step > 0 && <Pressable onPress={() => setStep(step - 1)} accessibilityRole="button" accessibilityLabel={t("onboard_back")} style={{ width: 54, height: 54, borderRadius: 12, borderWidth: 1, borderColor: theme.border, alignItems: "center", justifyContent: "center" }}><ArrowLeft size={21} color={theme.textPrimary} /></Pressable>}
        <Pressable onPress={() => step === 2 ? complete() : setStep(step + 1)} accessibilityRole="button" style={{ flex: 1, minHeight: 54, borderRadius: 12, backgroundColor: theme.accent, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 12 }}><Text style={{ fontFamily: "Quicksand_700Bold", fontSize: 16, color: theme.textOnAccent }}>{step === 2 ? t("onboard_start") : t("onboard_next")}</Text></Pressable>
      </View>
    </View>
  </View>;
}
