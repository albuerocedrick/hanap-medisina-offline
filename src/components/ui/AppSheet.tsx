import React, { createContext, useContext, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { BackHandler, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { Easing, runOnJS, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";
import { X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/src/theme/useTheme";
import { useTranslation } from "@/src/i18n/useTranslation";

type Request = { id: string; title: string; content: React.ReactNode; onClose: () => void };
const Context = createContext<React.Dispatch<React.SetStateAction<Request | null>> | null>(null);

export function SheetProvider({ children }: { children: React.ReactNode }) {
  const [request, setRequest] = useState<Request | null>(null);
  return <Context.Provider value={setRequest}>
    <View style={{ flex: 1 }} importantForAccessibility={request ? "no-hide-descendants" : "auto"}>{children}</View>
    <SheetFrame request={request} />
  </Context.Provider>;
}

export function AppSheet({ visible, title, children, onClose }: { visible: boolean; title: string; children: React.ReactNode; onClose: () => void }) {
  const setRequest = useContext(Context);
  const id = useId();
  useLayoutEffect(() => {
    if (!setRequest) return;
    if (visible) setRequest({ id, title, content: children, onClose });
    else setRequest(previous => previous?.id === id ? null : previous);
    return () => setRequest(previous => previous?.id === id ? null : previous);
  }, [visible, title, children, onClose, id, setRequest]);
  return null;
}

function SheetFrame({ request }: { request: Request | null }) {
  const [mounted, setMounted] = useState<Request | null>(null);
  const open = useRef(false);
  const { height } = useWindowDimensions();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const reduced = useReducedMotion();
  const offset = useSharedValue(height);
  const dim = useSharedValue(0);
  useEffect(() => {
    if (request) {
      setMounted(request);
      if (!open.current) {
        offset.value = height;
        offset.value = withTiming(0, { duration: reduced ? 0 : 420, easing: Easing.out(Easing.cubic) });
        dim.value = withTiming(1, { duration: reduced ? 0 : 320 });
      }
      open.current = true;
    } else if (open.current) {
      open.current = false;
      Keyboard.dismiss();
      dim.value = withTiming(0, { duration: reduced ? 0 : 300 });
      offset.value = withTiming(height, { duration: reduced ? 0 : 360, easing: Easing.inOut(Easing.cubic) }, finished => {
        if (finished) runOnJS(setMounted)(null);
      });
    }
  }, [request, height, reduced, offset, dim]);
  const close = () => { Keyboard.dismiss(); mounted?.onClose(); };
  useEffect(() => {
    if (!mounted) return;
    const handler = BackHandler.addEventListener("hardwareBackPress", () => { close(); return true; });
    return () => handler.remove();
  }, [mounted]);
  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: offset.value }] }));
  const dimStyle = useAnimatedStyle(() => ({ opacity: dim.value }));
  const pan = Gesture.Pan().activeOffsetY(10).onUpdate(event => {
    offset.value = Math.max(0, event.translationY);
  }).onEnd(event => {
    if (event.translationY > 90 || event.velocityY > 650) runOnJS(close)();
    else offset.value = withTiming(0, { duration: reduced ? 0 : 280, easing: Easing.out(Easing.cubic) });
  });
  if (!mounted) return null;
  return <View style={[StyleSheet.absoluteFillObject, { zIndex: 100, elevation: 40 }]} accessibilityViewIsModal>
    <Animated.View style={[StyleSheet.absoluteFillObject, dimStyle, { backgroundColor: "rgba(6,18,9,0.55)" }]}>
      <Pressable onPress={close} accessibilityLabel={t("cancel")} style={StyleSheet.absoluteFillObject} />
    </Animated.View>
    <KeyboardAvoidingView pointerEvents="box-none" behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, justifyContent: "flex-end" }}>
      <Animated.View style={[sheetStyle, { maxHeight: height * 0.88, backgroundColor: theme.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingBottom: Math.max(insets.bottom, 20), borderWidth: 1, borderColor: theme.border }]}>
        <GestureDetector gesture={pan}>
          <View style={{ paddingTop: 12, paddingHorizontal: 24, paddingBottom: 12 }}>
            <View style={{ width: 42, height: 4, borderRadius: 2, backgroundColor: theme.border, alignSelf: "center", marginBottom: 8 }} />
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text accessibilityRole="header" style={{ flex: 1, fontFamily: "Quicksand_700Bold", fontSize: 22, color: theme.textPrimary }}>{mounted.title}</Text>
              <Pressable onPress={close} accessibilityRole="button" accessibilityLabel={t("cancel")} style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}><X size={21} color={theme.textSecondary} /></Pressable>
            </View>
          </View>
        </GestureDetector>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 12 }}>{mounted.content}</ScrollView>
      </Animated.View>
    </KeyboardAvoidingView>
  </View>;
}
