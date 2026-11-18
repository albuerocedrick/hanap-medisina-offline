import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import Animated, {
  cancelAnimation, Easing, interpolate, useAnimatedStyle, useSharedValue, withTiming,
} from "react-native-reanimated";
import { useTranslation } from "@/src/i18n/useTranslation";
import { useTheme } from "@/src/theme/useTheme";

type ScanGuideStep = keyof typeof phaseLabels;
const leafPhoto = require("../../../assets/images/plants/tsaang-gubat.jpg");
const smallPlantPhoto = require("../../../assets/images/plants/tawa-tawa.png");
const phaseLabels = {
  frame: ["scan_demo_too_close", "scan_demo_in_frame"],
  smallPlant: ["scan_demo_too_close", "scan_demo_leaves_and_stem"],
  light: ["scan_demo_in_shadow", "scan_demo_even_light"],
  focus: ["scan_demo_tap_leaf", "scan_demo_hold_still"],
} as const;
const revealAt = { frame: 0.49, smallPlant: 0.46, light: 0.54, focus: 0.36 } as const;

export function ScanGuideDemo({ step, compact, animate }: { step: ScanGuideStep; compact: boolean; animate: boolean }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [beforeLabel, afterLabel] = phaseLabels[step];
  const smallPlant = step === "smallPlant";
  const showsCapture = step === "focus" || smallPlant;
  const progress = useSharedValue(1);
  useEffect(() => {
    progress.value = animate ? 0 : 1;
    if (animate) {
      progress.value = withTiming(1, { duration: 4600, easing: Easing.linear });
      return () => cancelAnimation(progress);
    }
  }, [animate, progress]);

  const photo = useAnimatedStyle(() => {
    const tight = step === "frame" || smallPlant
      ? interpolate(progress.value, [0, 0.22, 0.28, 0.35, 0.45, 0.54, 1], [1, 1, 0.93, 0.65, 0.15, 0, 0])
      : 0;
    return { transform: [{ translateX: tight * 36 }, { translateY: tight * 17 }, { scale: 1 + tight * 0.65 }] };
  });
  const shadow = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.2, 0.34, 0.48, 0.62, 1], [1, 1, 0.85, 0.45, 0, 0]),
    transform: [{ translateX: interpolate(progress.value, [0, 0.2, 0.48, 0.62, 1], [0, 0, 72, 156, 156]) }],
  }));
  const softFocus = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.28, 0.4, 1], [1, 1, 0, 0]),
  }));
  const focus = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.19, 0.23, 0.32, 1], [0, 0, 0.8, 1, 1]),
    transform: [{ scale: interpolate(progress.value, [0, 0.2, 0.29, 0.43, 1], [1.48, 1.48, 1.2, 1, 1]) }],
  }));
  const tapRing = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.22, 0.23, 0.39, 1], [0, 0, 1, 0, 0]),
    transform: [{ scale: interpolate(progress.value, [0, 0.23, 0.39, 1], [0.6, 0.6, 1.6, 1.6]) }],
  }));
  const finger = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.06, 0.13, 0.25, 0.37, 1], [0, 0, 1, 1, 0, 0]),
    transform: [
      { translateX: interpolate(progress.value, [0, 0.1, 0.22, 0.26, 0.37, 1], [40, 40, 0, 0, 13, 13]) },
      { translateY: interpolate(progress.value, [0, 0.1, 0.22, 0.26, 0.37, 1], [14, 14, 0, 0, 9, 9]) },
    ],
  }));
  const shutter = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(progress.value, [0, 0.62, 0.67, 0.73, 1], [1, 1, 0.77, 1, 1]) }],
  }));
  const exposure = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.66, 0.68, 0.77, 1], [0, 0, 0.23, 0, 0]),
  }));
  const confirmation = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.71, 0.79, 1], [0, 0, 1, 1]),
    transform: [{ scale: interpolate(progress.value, [0, 0.71, 0.79, 1], [0.72, 0.72, 1, 1]) }],
  }));
  const beforeCue = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, revealAt[step], revealAt[step] + 0.04, 1], [1, 1, 0, 0]),
  }));
  const afterCue = useAnimatedStyle(() => ({
    opacity: interpolate(
      progress.value,
      [0, revealAt[step] + 0.04, revealAt[step] + 0.09, 0.7, 0.74, 1],
      [0, 0, 1, 1, showsCapture ? 0 : 1, showsCapture ? 0 : 1],
    ),
  }));

  return <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
    style={[styles.viewfinder, {
      height: compact ? 90 : 152,
      backgroundColor: smallPlant ? theme.scrimStrong : theme.surface,
      borderColor: theme.accentSoftBorder,
    }]}>
    <Animated.View style={[StyleSheet.absoluteFillObject, photo]}>
      <Image source={smallPlant ? smallPlantPhoto : leafPhoto} resizeMode={smallPlant ? "contain" : "cover"}
        fadeDuration={0} style={styles.photo} />
    </Animated.View>
    {step === "focus" && animate && <Animated.View style={[StyleSheet.absoluteFillObject, softFocus]}>
      <Image source={leafPhoto} resizeMode="cover" blurRadius={7} fadeDuration={0} style={styles.photo} />
    </Animated.View>}
    {step === "light" && <Animated.View style={[styles.shadow, shadow]}>
      <LinearGradient colors={["transparent", "#101914e8", "#101914f5"]}
        start={{ x: 0, y: 0.15 }} end={{ x: 0.83, y: 0.88 }} style={StyleSheet.absoluteFillObject} />
    </Animated.View>}
    <View style={smallPlant ? styles.smallPlantReticle : styles.reticle}>
      <View style={[styles.corner, styles.topLeft]} />
      <View style={[styles.corner, styles.topRight]} />
      <View style={[styles.corner, styles.bottomLeft]} />
      <View style={[styles.corner, styles.bottomRight]} />
    </View>
    {step === "light" && <View style={styles.sun}>
      <Ionicons name="sunny" size={16} color="#ffdd8b" />
    </View>}
    {step === "focus" && <>
      <Animated.View style={[styles.focus, focus]} />
      <Animated.View style={[styles.tap, tapRing]} />
      <Animated.View style={[styles.finger, finger]}>
        <MaterialCommunityIcons name="gesture-tap" size={22} color="#fff" />
      </Animated.View>
    </>}
    {showsCapture && <>
      <Animated.View style={[StyleSheet.absoluteFillObject, styles.exposure, exposure]} />
      <Animated.View style={[styles.shutter, shutter]}>
        <View style={styles.shutterCenter} />
      </Animated.View>
    </>}
    <Animated.View style={[styles.cue, beforeCue]}>
      <Text maxFontSizeMultiplier={1.3} style={styles.cueText}>{t(beforeLabel)}</Text>
    </Animated.View>
    <Animated.View style={[styles.cue, step !== "focus" && styles.goodCue, afterCue]}>
      {step !== "focus" && <Ionicons name="checkmark" size={14} color="#d2efaa" />}
      <Text maxFontSizeMultiplier={1.3} style={styles.cueText}>{t(afterLabel)}</Text>
    </Animated.View>
    {showsCapture && <Animated.View style={[styles.cue, styles.goodCue, confirmation]}>
      <Ionicons name="checkmark" size={14} color="#d2efaa" />
      <Text maxFontSizeMultiplier={1.3} style={styles.cueText}>
        {t(smallPlant ? "scan_demo_one_photo_taken" : "scan_demo_photo_taken")}
      </Text>
    </Animated.View>}
  </View>;
}

const styles = StyleSheet.create({
  viewfinder: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  photo: { width: "100%", height: "100%" },
  shadow: { position: "absolute", width: "125%", height: "115%", left: "8%", top: "-7%" },
  reticle: { position: "absolute", width: "70%", height: "65%" },
  smallPlantReticle: { position: "absolute", aspectRatio: 3 / 4, height: "96%", maxWidth: "96%" },
  corner: { position: "absolute", width: 17, height: 17, borderColor: "#f8fbed" },
  topLeft: { top: 0, left: 0, borderTopWidth: 2, borderLeftWidth: 2, borderTopLeftRadius: 5 },
  topRight: { top: 0, right: 0, borderTopWidth: 2, borderRightWidth: 2, borderTopRightRadius: 5 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 2, borderLeftWidth: 2, borderBottomLeftRadius: 5 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 2, borderRightWidth: 2, borderBottomRightRadius: 5 },
  sun: { position: "absolute", top: 7, right: 7, borderRadius: 14, padding: 5, backgroundColor: "#18251ad9" },
  focus: { position: "absolute", width: 42, height: 42, borderRadius: 7, borderWidth: 2, borderColor: "#ffdd8b" },
  tap: { position: "absolute", width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: "#f8fbed" },
  finger: { position: "absolute", marginTop: 22, marginLeft: 23, padding: 4, borderRadius: 16, backgroundColor: "#132016d9" },
  exposure: { backgroundColor: "#fff" },
  shutter: { position: "absolute", bottom: 7, right: 8, width: 27, height: 27, borderRadius: 14, backgroundColor: "#18251acc", borderColor: "#fff", borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  shutterCenter: { width: 17, height: 17, borderRadius: 9, backgroundColor: "#fff" },
  cue: { position: "absolute", left: 9, bottom: 8, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
    backgroundColor: "#15231aeb", flexDirection: "row", alignItems: "center", gap: 4 },
  goodCue: { backgroundColor: "#244b28f5" },
  cueText: { color: "#fff", fontFamily: "Quicksand_700Bold", fontSize: 12 },
});
