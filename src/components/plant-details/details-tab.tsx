/**
 * components/plant-details/DetailsTab.tsx
 *
 * Renders the "Details" sub-tab of the plant detail screen.
 * Maps all three data structures from PlantDetails:
 *  - `preparation` → numbered step list
 *  - `facts`       → key-value identification grid
 *  - `warnings`    → amber warning badges
 *
 * Every section has a dedicated empty state so a partially-populated
 * plant data object never causes a blank or crashed screen.
 */

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ScrollView, Text, View } from "react-native";
import { PlantDetails } from "../../types/index";

import { useColorScheme } from "nativewind";
import { StyleSheet } from "react-native";
import { useTranslation } from "@/src/i18n/useTranslation";

// ─────────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────────

interface DetailsTabProps {
  localName: string;
  details: PlantDetails;
}

// ─────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────

function SectionHeader({
  icon,
  title,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
}) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12, marginTop: 24 }}>
      <View style={{ backgroundColor: isDark ? "rgba(162,207,163,0.15)" : "rgba(162,207,163,0.2)", borderRadius: 8, padding: 6, marginRight: 8 }}>
        <Ionicons name={icon} size={16} color={isDark ? "#A2CFA3" : "#22451C"} />
      </View>
      <Text style={{ fontFamily: "Quicksand_700Bold", color: isDark ? "rgba(248,250,252,0.9)" : "#22451C", fontSize: 13, textTransform: "uppercase", letterSpacing: 0.5 }}>
        {title}
      </Text>
    </View>
  );
}

/**
 * Classifies a warning as "critical" or "caution" from its wording.
 *
 * The dataset stores warnings as plain strings with no severity field, so we
 * infer it. Terms are matched in both English and Tagalog because the same
 * component renders plants_tl.json. Anything unrecognised stays "caution" —
 * the safe direction to fail, since over-flagging every line red would rebuild
 * the flat hierarchy this is meant to break.
 */
type WarningSeverity = "critical" | "caution";

const CRITICAL_WARNING_TERMS = [
  // English
  "toxic", "poison", "fatal", "death", "overdose", "do not", "never",
  "pregnan", "breastfeed", "nursing", "infant", "children under",
  "kidney damage", "liver damage", "seek medical", "emergency", "hospital",
  "allergic reaction", "anaphyla",
  // Tagalog
  "lason", "nakakalason", "huwag", "buntis", "nagpapasuso", "sanggol",
  "delikado", "kamatayan", "agad na magpatingin",
];

function getWarningSeverity(warning: string): WarningSeverity {
  const haystack = warning.toLowerCase();
  return CRITICAL_WARNING_TERMS.some((term) => haystack.includes(term))
    ? "critical"
    : "caution";
}

function EmptySection({ message }: { message: string }) {

  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View style={{ backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(34,69,28,0.03)", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12 }}>
      <Text style={{ fontFamily: "Quicksand_500Medium", color: isDark ? "rgba(248,250,252,0.5)" : "rgba(34,69,28,0.5)", fontSize: 13, fontStyle: "italic" }}>
        {message}
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────

export function DetailsTab({ localName, details }: DetailsTabProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const { t } = useTranslation();

  // ── Guard: graceful degradation if details is undefined/null ─────────────
  if (!details) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 64 }}>
        <Ionicons name="leaf-outline" size={40} color={isDark ? "rgba(255,255,255,0.2)" : "rgba(34,69,28,0.2)"} />
        <Text style={{ fontFamily: "Quicksand_500Medium", color: isDark ? "rgba(248,250,252,0.5)" : "rgba(34,69,28,0.5)", fontSize: 14, marginTop: 12 }}>
          {t('details_no_details')}
        </Text>
      </View>
    );
  }

  const preparation = Array.isArray(details.preparation)
    ? details.preparation.filter(Boolean)
    : [];

  const factsEntries =
    details.facts && typeof details.facts === "object"
      ? Object.entries(details.facts).filter(([k, v]) => k && v)
      : [];

  const warnings = Array.isArray(details.warnings)
    ? details.warnings.filter(Boolean)
    : [];

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Local Name ─────────────────────────────────────────────────────── */}
      {!!localName?.trim() && (
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12, paddingHorizontal: 4 }}>
          <Ionicons name="pricetag-outline" size={13} color={isDark ? "rgba(248,250,252,0.4)" : "rgba(34,69,28,0.5)"} style={{ marginRight: 6 }} />
          <Text style={{ fontFamily: "Quicksand_500Medium", color: isDark ? "rgba(248,250,252,0.5)" : "rgba(34,69,28,0.6)", fontSize: 13, marginRight: 6 }}>
            {t('details_known_locally')}
          </Text>
          <Text style={{ fontFamily: "serif", fontStyle: "italic", fontWeight: "500", color: isDark ? "#F8FAFC" : "#22451C", fontSize: 15, marginTop: -2 }}>
            {localName}
          </Text>
        </View>
      )}

      {/* ── Preparation ────────────────────────────────────────────────────── */}
      <SectionHeader icon="flask-outline" title={t('details_preparation_title')} />
      {preparation.length > 0 ? (
        <View style={{ gap: 12 }}>
          {preparation.map((prep: any, index: number) => (
            <View
              key={index}
              style={{ backgroundColor: "transparent", borderWidth: StyleSheet.hairlineWidth, borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(162,207,163,0.4)", borderRadius: 16, padding: 16 }}
            >
              <Text style={{ fontFamily: "Quicksand_700Bold", color: isDark ? "#A2CFA3" : "#22451C", fontSize: 15, marginBottom: 6 }}>
                {prep.method}
              </Text>
              <Text style={{ fontFamily: "Quicksand_500Medium", color: isDark ? "rgba(248,250,252,0.85)" : "#334155", fontSize: 14, lineHeight: 22, marginBottom: 12 }}>
                {prep.description}
              </Text>
              {prep.uses && prep.uses.length > 0 && (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {prep.uses.map((use: string, uIdx: number) => (
                    <View key={uIdx} style={{ backgroundColor: isDark ? "rgba(162,207,163,0.15)" : "rgba(162,207,163,0.2)", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 }}>
                      <Text style={{ fontFamily: "Quicksand_600SemiBold", color: isDark ? "#A2CFA3" : "#22451C", fontSize: 11 }}>
                        {use}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      ) : (
        <EmptySection message={t('details_no_prep')} />
      )}

      {/* ── Identification Facts ────────────────────────────────────────────── */}
      <SectionHeader icon="eye-outline" title={t('details_identification')} />
      {factsEntries.length > 0 ? (
        <View style={{ backgroundColor: "transparent", borderWidth: StyleSheet.hairlineWidth, borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(162,207,163,0.4)", borderRadius: 16, overflow: "hidden" }}>
          {factsEntries.map(([key, value], index) => {
            const isLast = index === factsEntries.length - 1;
            return (
              <View
                key={key}
                style={{ flexDirection: "row", paddingHorizontal: 16, paddingVertical: 12, alignItems: "flex-start", borderBottomWidth: !isLast ? StyleSheet.hairlineWidth : 0, borderBottomColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(162,207,163,0.2)" }}
              >
                <Text style={{ width: 110, fontFamily: "Quicksand_600SemiBold", color: isDark ? "rgba(248,250,252,0.5)" : "rgba(34,69,28,0.6)", fontSize: 13, marginTop: 2 }}>
                  {key}
                </Text>
                <Text style={{ flex: 1, fontFamily: "Quicksand_600SemiBold", color: isDark ? "rgba(248,250,252,0.9)" : "#22451C", fontSize: 14, lineHeight: 20 }}>
                  {value}
                </Text>
              </View>
            );
          })}
        </View>
      ) : (
        <EmptySection message={t('details_no_facts')} />
      )}

      {/* ── Warnings ───────────────────────────────────────────────────────── */}
      <SectionHeader icon="warning-outline" title={t('details_warnings_title')} />
      {warnings.length > 0 ? (
        <View style={{ gap: 8 }}>
          {/*
            Warnings are sorted so critical ones surface first, and are colored
            by severity. Previously every warning shared one amber treatment,
            which flattened "may cause mild drowsiness" and "toxic in high
            doses — do not use while pregnant" into the same visual weight. On
            a screen whose whole purpose is guiding people to ingest a plant,
            uniform styling means the reader has to parse all the prose to find
            the one line that matters. Red + a filled octagon gives the
            dangerous cases a shape and color the eye catches before reading.
          */}
          {[...warnings]
            .map((warning) => ({ warning, severity: getWarningSeverity(warning) }))
            .sort((a, b) => (a.severity === b.severity ? 0 : a.severity === "critical" ? -1 : 1))
            .map(({ warning, severity }, index) => {
              const critical = severity === "critical";
              const palette = critical
                ? {
                    bg: isDark ? "rgba(220,38,38,0.10)" : "#FEF2F2",
                    border: isDark ? "rgba(248,113,113,0.28)" : "#FECACA",
                    icon: isDark ? "#F87171" : "#DC2626",
                    text: isDark ? "#FECACA" : "#B91C1C",
                  }
                : {
                    bg: isDark ? "rgba(217,119,6,0.08)" : "#FFFBEB",
                    border: isDark ? "rgba(217,119,6,0.2)" : "#FDE68A",
                    icon: isDark ? "#FBBF24" : "#D97706",
                    text: isDark ? "#FDE68A" : "#B45309",
                  };

              return (
                <View
                  key={index}
                  accessibilityRole="text"
                  accessibilityLabel={`${critical ? t("details_warning_critical") : t("details_warning_caution")}: ${warning}`}
                  style={{
                    flexDirection: "row",
                    backgroundColor: palette.bg,
                    borderWidth: critical ? 1 : StyleSheet.hairlineWidth,
                    borderColor: palette.border,
                    borderRadius: 16,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    alignItems: "flex-start",
                  }}
                >
                  <Ionicons
                    name={critical ? "warning" : "alert-circle"}
                    size={16}
                    color={palette.icon}
                    style={{ marginTop: 2, marginRight: 10 }}
                  />
                  <Text style={{ flex: 1, fontFamily: "Quicksand_500Medium", color: palette.text, fontSize: 14, lineHeight: 20 }}>
                    {warning}
                  </Text>
                </View>
              );
            })}
        </View>
      ) : (

        <EmptySection message={t('details_no_warnings')} />
      )}
    </ScrollView>
  );
}
