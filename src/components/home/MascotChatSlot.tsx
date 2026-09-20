import React, { useEffect, useMemo, useRef, useState } from "react";
import { AppState, Image, ImageResolvedAssetSource, Pressable, Text, View } from "react-native";
import { useColorScheme } from "nativewind";
import { useIsFocused } from "@react-navigation/native";
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  useSharedValue,
  useAnimatedStyle,
  useReducedMotion,
  withTiming,
  withRepeat,
  Easing,
  runOnJS,
  cancelAnimation
} from "react-native-reanimated";

const IDLE_MESSAGES = [
  "Tip: Scan leaves in good light.",
  "Try searching a plant name above.",
  "New here? Start with a quick scan.",
  "Did you know? Some herbs look alike—double-check details.",
];

const EXPRESSION_MESSAGES = [
  "Yay! Let's find your plant!",
  "Hmm... let me think about that.",
  "Nice! I am excited to help.",
  "Hehe, got it!",
  "Feeling calm and ready.",
];

const MASCOT_CONFIG = {
  idle: { source: require("../../../assets/images/home-mascot/herbi-idle.png"), cols: 8, rows: 8, frames: 64 },
  goingSleep: { source: require("../../../assets/images/home-mascot/herbi-going-to-sleep.png"), cols: 8, rows: 8, frames: 64 },
  sleeping: { source: require("../../../assets/images/home-mascot/herbi-sleep-idle.png"), cols: 8, rows: 8, frames: 64 },
  wakeup: { source: require("../../../assets/images/home-mascot/herbi-wakeup.png"), cols: 8, rows: 8, frames: 64 },
  expressions: [
    { source: require("../../../assets/images/home-mascot/herbi-happy.png"), cols: 8, rows: 8, frames: 64 },
    { source: require("../../../assets/images/home-mascot/herbi-thinking.png"), cols: 8, rows: 8, frames: 64 },
    { source: require("../../../assets/images/home-mascot/herbi-excited.png"), cols: 8, rows: 8, frames: 64 },
    { source: require("../../../assets/images/home-mascot/herbi-winking.png"), cols: 8, rows: 8, frames: 64 },
    { source: require("../../../assets/images/home-mascot/herbi-peaceful.png"), cols: 8, rows: 8, frames: 64 },
  ],
};

// Option C: Scale by HEIGHT so Herbi is always the same height across all animations.
// Width varies slightly per animation but height stays perfectly consistent.
const TARGET_HEIGHT = 120; // Herbi is always this tall, every animation
const SLOT_WIDTH = 140; // fixed pressable width — wide enough for the widest frame
type MascotMode = "idle" | "expression" | "goingSleep" | "sleeping" | "wakeup";

/**
 * `idle` and `sleeping` are resting states, so a `withRepeat(..., -1)` loop there
 * runs for as long as Home is on screen — permanently animating the UI. That
 * drains battery on low-end devices, ignores "reduce motion", and prevents the
 * framework from ever reporting an idle frame (which stalls UIAutomator-based
 * tooling, including Google Play's pre-launch report).
 *
 * Instead these cycles now play a few times and then rest on a static frame.
 */
const RESTING_CYCLES = 3;

/** Ticks of the "zzz..." dots before settling on a static string. */
const MAX_SLEEP_DOT_TICKS = 8;

/** How long a non-looping pose stays up when animations are suppressed. */
const STATIC_POSE_MS = 1200;

export function MascotChatSlot() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const [mode, setMode] = useState<MascotMode>("idle");
  const [exprIdx, setExprIdx] = useState(0);
  const [idleMsgIdx, setIdleMsgIdx] = useState(0);
  const [sleepDots, setSleepDots] = useState(0);
  const lastInteractionRef = useRef(Date.now());

  const frame = useSharedValue(0);
  const transitionOpacity = useSharedValue(1);

  // Animate only when the mascot is actually on screen, the app is foregrounded,
  // and the user has not asked for reduced motion.
  const isFocused = useIsFocused();
  const reduceMotion = useReducedMotion();
  const [isAppActive, setIsAppActive] = useState(AppState.currentState === "active");

  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      setIsAppActive(next === "active");
    });
    return () => sub.remove();
  }, []);

  const animationsEnabled = isFocused && isAppActive && !reduceMotion;
  const timersEnabled = isFocused && isAppActive;

  const activeConfig = useMemo(() => {
    if (mode === "expression") return MASCOT_CONFIG.expressions[exprIdx];
    if (mode === "goingSleep") return MASCOT_CONFIG.goingSleep;
    if (mode === "sleeping") return MASCOT_CONFIG.sleeping;
    if (mode === "wakeup") return MASCOT_CONFIG.wakeup;
    return MASCOT_CONFIG.idle;
  }, [exprIdx, mode]);

  // 🌟 Hardware-accelerated Sprite Animation 🌟
  useEffect(() => {
    cancelAnimation(frame);
    frame.value = 0;

    // Suppressed (off-screen, backgrounded, or reduce-motion): show a single
    // static frame. The state machine still has to advance, or a pose such as
    // "expression" would never hand back to "idle".
    if (!animationsEnabled) {
      if (mode === "idle" || mode === "sleeping") return;

      const next: MascotMode = mode === "goingSleep" ? "sleeping" : "idle";
      const timeout = setTimeout(() => setMode(next), STATIC_POSE_MS);
      return () => clearTimeout(timeout);
    }

    const durationMs = (activeConfig.frames / 16) * 1000;

    if (mode === "idle" || mode === "sleeping") {
      // Play a few cycles, then rest on a static frame rather than looping forever.
      frame.value = withRepeat(
        withTiming(activeConfig.frames, { duration: durationMs, easing: Easing.linear }),
        RESTING_CYCLES,
        false
      );
    } else {
      // Play once, then switch state
      frame.value = withTiming(
        activeConfig.frames,
        { duration: durationMs, easing: Easing.linear },
        (finished) => {
          if (finished) {
            if (mode === "expression" || mode === "wakeup") {
              runOnJS(setMode)("idle");
            } else if (mode === "goingSleep") {
              runOnJS(setMode)("sleeping");
            }
          }
        }
      );
    }
  }, [mode, activeConfig, animationsEnabled]);

  // Never leave a loop running behind us.
  useEffect(() => {
    return () => cancelAnimation(frame);
  }, [frame]);

  // Idle message rotation.
  // These three timers previously ran in *every* mode and whether or not Home was
  // on screen, re-rendering forever in the background. Each now starts only in the
  // mode that needs it, and only while the tab is focused and the app foregrounded.
  useEffect(() => {
    if (!timersEnabled || mode !== "idle") return;

    const idleInterval = setInterval(() => {
      setIdleMsgIdx((v) => (v + 1) % IDLE_MESSAGES.length);
    }, 5000);
    return () => clearInterval(idleInterval);
  }, [mode, timersEnabled]);

  // Sleeping dots — bounded, then settles on a static "zzzzz..." string.
  useEffect(() => {
    if (!animationsEnabled || mode !== "sleeping") return;

    setSleepDots(0);
    let ticks = 0;
    const sleepDotsInterval = setInterval(() => {
      ticks += 1;
      setSleepDots((v) => (v + 1) % 4);
      if (ticks >= MAX_SLEEP_DOT_TICKS) clearInterval(sleepDotsInterval);
    }, 900);
    return () => clearInterval(sleepDotsInterval);
  }, [mode, animationsEnabled]);

  // Inactivity timeout to go to sleep
  useEffect(() => {
    if (!timersEnabled) return;
    if (mode !== "idle" && mode !== "expression") return;

    const inactivity = setInterval(() => {
      const inactiveFor = Date.now() - lastInteractionRef.current;
      if (inactiveFor >= 30000) {
        setMode("goingSleep");
      }
    }, 1000);
    return () => clearInterval(inactivity);
  }, [mode, timersEnabled]);

  const message = useMemo(() => {
    if (mode === "expression") return EXPRESSION_MESSAGES[exprIdx];
    if (mode === "goingSleep") return "I'm getting sleepy...";
    if (mode === "wakeup") return "Oh, hello there!";
    if (mode === "sleeping") return `zzzzz${".".repeat(sleepDots)}`;
    return IDLE_MESSAGES[idleMsgIdx];
  }, [exprIdx, idleMsgIdx, mode, sleepDots]);

  const handleMascotPress = () => {
    lastInteractionRef.current = Date.now();

    if (mode === "sleeping" || mode === "goingSleep") {
      setMode("wakeup");
      return;
    }

    if (mode === "wakeup") return; // Let wakeup finish

    const next = Math.floor(Math.random() * EXPRESSION_MESSAGES.length);
    setExprIdx(next);
    setMode("expression");
  };

  const resolved = Image.resolveAssetSource(activeConfig.source) as ImageResolvedAssetSource;
  const sw = resolved?.width || 2048;
  const sh = resolved?.height || 2048;
  const fw = sw / activeConfig.cols;
  const fh = sh / activeConfig.rows;

  // Scale by HEIGHT — Herbi is always TARGET_HEIGHT px tall regardless of which sheet.
  // MAX_SCALE caps short-frame sheets (sleep-idle fh=223) from scaling up too large.
  const MAX_SCALE = TARGET_HEIGHT / 285;
  const scale = Math.min(TARGET_HEIGHT / fh, MAX_SCALE);
  const displayWidth = fw * scale;
  // Use actual scaled frame height (not TARGET_HEIGHT) as viewport height —
  // prevents next-row bleed when scale is capped below TARGET_HEIGHT/fh
  const displayHeight = fh * scale;


  const animatedSpriteStyle = useAnimatedStyle(() => {
    const currentFrame = Math.floor(frame.value) % activeConfig.frames;
    const frameCol = currentFrame % activeConfig.cols;
    const frameRow = Math.floor(currentFrame / activeConfig.cols);
    return {
      opacity: transitionOpacity.value,
      transform: [
        { translateX: -frameCol * fw * scale },
        { translateY: -frameRow * fh * scale },
      ]
    };
  });

  return (
    <View style={{ paddingHorizontal: 22, height: 164, marginBottom: 24 }}>
      <Text
        style={{
          marginBottom: 8,
          color: isDark ? "rgba(248,250,252,0.84)" : "#22451C",
          fontSize: 18,
          // Was fontFamily: "serif" — a different platform default on Android vs
          // iOS, clashing with Quicksand.
          fontFamily: "Quicksand_600SemiBold",
          fontStyle: "italic",
          letterSpacing: 0.3,
        }}
      >
        Meet Herbi...
      </Text>

      <View style={{ flex: 1, flexDirection: "row", alignItems: "flex-end" }}>
        <Pressable
          onPress={handleMascotPress}
          // Fixed slot width keeps layout stable; sprite is centered inside
          style={{ width: SLOT_WIDTH, alignItems: "center", justifyContent: "flex-end" }}
        >
          {/* Viewport: exact one-frame size — no bleed left/right or top/bottom */}
          <View
            style={{
              width: displayWidth,
              height: displayHeight,
              overflow: "hidden",
            }}
          >
            <Animated.Image
              source={activeConfig.source}
              style={[
                { width: sw * scale, height: sh * scale },
                animatedSpriteStyle,
              ]}
              resizeMode="stretch"
            />
          </View>
        </Pressable>

        <Animated.View
          layout={LinearTransition.duration(200)}
          style={{
            flex: 1,
            marginLeft: 12,
            marginBottom: 4,
            borderRadius: 18,
            paddingVertical: 12,
            paddingHorizontal: 14,
            backgroundColor: isDark ? "#141d14" : "#FAFEEF",
            borderWidth: 1,
            borderColor: isDark ? "rgba(255,255,255,0.10)" : "rgba(162,207,163,0.55)",
          }}
        >
          <Animated.Text
            key={message}
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(150)}
            style={{
              color: isDark ? "rgba(248,250,252,0.80)" : "#22451C",
              fontSize: 13,
              lineHeight: 18,
              fontFamily: "Quicksand_500Medium",
            }}
          >
            {message}
          </Animated.Text>

          {/* Bubble tail */}
          <View
            style={{
              position: "absolute",
              left: -6,
              bottom: 12,
              width: 12,
              height: 12,
              backgroundColor: isDark ? "#141d14" : "#FAFEEF",
              borderLeftWidth: 1,
              borderBottomWidth: 1,
              borderColor: isDark ? "rgba(255,255,255,0.10)" : "rgba(162,207,163,0.55)",
              transform: [{ rotate: "45deg" }],
            }}
          />

          <Text
            style={{
              marginTop: 8,
              color: isDark ? "rgba(248,250,252,0.45)" : "rgba(34,69,28,0.55)",
              fontSize: 11,
              fontFamily: "Quicksand_500Medium",
            }}
          >
            Tap mascot for expression
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}
