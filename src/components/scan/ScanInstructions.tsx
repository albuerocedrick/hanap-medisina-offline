import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions,
  type NativeScrollEvent, type NativeSyntheticEvent,
} from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { useTranslation } from "@/src/i18n/useTranslation";
import { useTheme } from "@/src/theme/useTheme";
import { ScanGuideDemo } from "./ScanGuideDemo";
import { scanStyles } from "./scan.styles";

const slides = [
  { step: "frame", title: "scan_intro_frame", body: "scan_intro_frame_body" },
  { step: "light", title: "scan_intro_light", body: "scan_intro_light_body" },
  { step: "focus", title: "scan_intro_focus", body: "scan_intro_focus_body" },
] as const;
const slideCount = slides.length;
// Duplicate the end pages so crossing either edge still slides in that direction.
const pages = [slides[slideCount - 1], ...slides, slides[0]];
const holdDuration = 6500;
const edgeSettleDuration = 140;

function canonicalPage(page: number) {
  return ((page + slideCount - 1) % slideCount) + 1;
}

interface Props {
  foreground: boolean;
  skipGuide: boolean;
  onStart: (skip: boolean) => void;
  onClose: (skip: boolean) => void;
}

export function ScanInstructions({ foreground, skipGuide, onStart, onClose }: Props) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { width, height } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const compact = height < 540;
  const cardWidth = Math.min(332, width - 32);
  const pageWidth = cardWidth - 30;
  const initialOffset = useMemo(() => ({ x: pageWidth, y: 0 }), [pageWidth]);
  const [page, setPage] = useState(1);
  const [skip, setSkip] = useState(skipGuide);
  const [settled, setSettled] = useState(true);
  const scroll = useRef<ScrollView>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const offset = useRef(pageWidth);
  const currentPage = useRef(1);
  const dragging = useRef(false);
  const selected = canonicalPage(page) - 1;

  function clearSettleTimer() {
    if (settleTimer.current !== null) clearTimeout(settleTimer.current);
    settleTimer.current = null;
  }

  function finishScrolling() {
    clearSettleTimer();
    const next = Math.min(slideCount + 1, Math.max(0, Math.round(offset.current / pageWidth)));
    const canonical = canonicalPage(next);
    offset.current = canonical * pageWidth;
    if (next !== canonical) scroll.current?.scrollTo({ x: offset.current, animated: false });
    currentPage.current = canonical;
    setPage(canonical);
    setSettled(true);
  }

  function queueSettle() {
    clearSettleTimer();
    settleTimer.current = setTimeout(finishScrolling, edgeSettleDuration);
  }

  const goTo = useCallback((next: number) => {
    const destination = reducedMotion ? canonicalPage(next) : next;
    currentPage.current = destination;
    setPage(destination);
    setSettled(reducedMotion);
    scroll.current?.scrollTo({ x: destination * pageWidth, animated: !reducedMotion });
    // Some platforms omit momentum events for an imperative scroll.
    if (!reducedMotion) {
      offset.current = destination * pageWidth;
      queueSettle();
    }
  }, [pageWidth, reducedMotion]);

  useEffect(() => {
    const canonical = canonicalPage(currentPage.current);
    currentPage.current = canonical;
    offset.current = canonical * pageWidth;
    setPage(canonical);
    setSettled(true);
    scroll.current?.scrollTo({ x: offset.current, animated: false });
    return clearSettleTimer;
  }, [pageWidth]);

  useEffect(() => {
    if (!foreground || !settled || reducedMotion) return;
    const timer = setTimeout(() => goTo(currentPage.current + 1), holdDuration);
    return () => clearTimeout(timer);
  }, [foreground, settled, reducedMotion, page, goTo]);

  function trackScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    offset.current = event.nativeEvent.contentOffset.x;
    if (!dragging.current) queueSettle();
  }

  const dismiss = () => onClose(skip);
  return (
    <Modal animationType="none" transparent onRequestClose={dismiss}>
      <View style={[styles.backdrop, { backgroundColor: theme.scrim }]}>
        <View accessibilityViewIsModal style={[styles.card, {
          width: cardWidth, maxHeight: "100%", backgroundColor: theme.surface, borderColor: theme.border,
        }]}>
          <View style={styles.header}>
            <Text accessibilityRole="header" style={[styles.heading, { color: theme.textPrimary }]}>{t("capture_guide")}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={t("scan_guide_close")}
              onPress={dismiss} style={styles.iconButton}>
              <Ionicons name="close" size={22} color={theme.textSecondary} />
            </Pressable>
          </View>
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <ScrollView ref={scroll} horizontal pagingEnabled bounces={false}
              showsHorizontalScrollIndicator={false} scrollEventThrottle={16}
              contentOffset={initialOffset}
              onScroll={trackScroll}
              onScrollBeginDrag={() => {
                clearSettleTimer();
                dragging.current = true;
                setSettled(false);
              }}
              onScrollEndDrag={event => {
                dragging.current = false;
                trackScroll(event);
              }}
              onMomentumScrollEnd={event => {
                offset.current = event.nativeEvent.contentOffset.x;
                finishScrolling();
              }}>
              {pages.map(({ step, title, body }, index) => <View key={index}
                style={[styles.slide, { width: pageWidth }]}
                accessibilityElementsHidden={index !== page}
                importantForAccessibility={index === page ? "auto" : "no-hide-descendants"}>
                <ScanGuideDemo step={step} compact={compact}
                  animate={foreground && !reducedMotion && settled && index === page} />
                <Text style={[styles.tipTitle, { color: theme.textPrimary }]}>{t(title)}</Text>
                <Text style={[scanStyles.body, { color: theme.textSecondary }]}>{t(body)}</Text>
              </View>)}
            </ScrollView>
          </ScrollView>
          <View style={styles.controls}>
            {slides.map(({ step, title }, index) => <Pressable key={step} accessibilityRole="button"
              accessibilityLabel={t(title)} accessibilityState={{ selected: selected === index, disabled: !settled }}
              disabled={!settled} onPress={() => goTo(index + 1)} style={styles.dotButton}>
              <View style={[styles.dot, {
                width: selected === index ? 18 : 7,
                backgroundColor: selected === index ? theme.accent : theme.iconInactive,
              }]} />
            </Pressable>)}
          </View>
          <Pressable accessibilityRole="checkbox" accessibilityLabel={t("scan_guide_skip")}
            accessibilityState={{ checked: skip }} onPress={() => setSkip(value => !value)} style={styles.checkbox}>
            <View style={[styles.check, { borderColor: theme.accent, backgroundColor: skip ? theme.accent : "transparent" }]}>
              {skip && <Ionicons name="checkmark" size={15} color={theme.textOnAccent} />}
            </View>
            <Text style={[styles.checkboxText, { color: theme.textPrimary }]}>{t("scan_guide_skip")}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={t("scan_intro_start")}
            onPress={() => onStart(skip)} style={[scanStyles.captureButton, styles.start, {
              backgroundColor: theme.accent, borderColor: theme.accentSoftBorder,
            }]}>
            <Ionicons name="scan-outline" size={20} color={theme.textOnAccent} />
            <Text style={[scanStyles.captureText, styles.startText, { color: theme.textOnAccent }]}>{t("scan_intro_start")}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 10 },
  card: { flexShrink: 1, borderWidth: 1, borderRadius: 22, paddingHorizontal: 14, paddingTop: 4, paddingBottom: 14 },
  header: { flexDirection: "row", alignItems: "center", paddingLeft: 6 },
  heading: { flex: 1, fontFamily: "Quicksand_700Bold", fontSize: 20, marginVertical: 4 },
  iconButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  content: { flexGrow: 0, flexShrink: 1 },
  slide: { paddingHorizontal: 2, alignItems: "stretch", paddingBottom: 4 },
  tipTitle: { textAlign: "center", fontFamily: "Quicksand_700Bold", fontSize: 16, marginTop: 10, marginBottom: 3 },
  controls: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  dotButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  dot: { height: 7, borderRadius: 4 },
  checkbox: { minHeight: 44, paddingVertical: 6, flexDirection: "row", alignItems: "center", gap: 9 },
  check: { width: 21, height: 21, borderRadius: 5, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  checkboxText: { flex: 1, fontFamily: "Quicksand_600SemiBold", fontSize: 14 },
  start: { minHeight: 46, paddingVertical: 8, marginTop: 3 },
  startText: { flexShrink: 1, textAlign: "center" },
});
