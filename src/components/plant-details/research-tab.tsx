import { useTheme } from "@/src/theme/useTheme";
/**
 * components/MedicinalPlant-details/ResearchTab.tsx
 *
 * Renders the "Research" sub-tab — maps the `research` array from local data.
 * Each item shows: title, summary, reference journal, and year.
 *
 * Empty and partial-data states are handled per-card so one malformed
 * research entry doesn't hide the rest.
 */

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ScrollView, Text, View } from "react-native";
import { ResearchItem } from "@/src/services/localLibrary";

import { StyleSheet } from "react-native";
import { useTranslation } from "@/src/i18n/useTranslation";

// ─────────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────────

interface ResearchTabProps {
  research: ResearchItem[];
}

// ─────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────

interface ResearchCardProps {
  item: ResearchItem;
  index: number;
}

function ResearchCard({ item, index }: ResearchCardProps) {
  const theme = useTheme();


  const { t } = useTranslation();

  // Per-card guard: skip rendering if the entire item is unusable
  if (!item || typeof item !== "object") {
    if (__DEV__) console.warn(
      `[ResearchTab] Research item at index ${index} is invalid — skipping.`,
    );
    return null;
  }

  const title = item.title?.trim() || t('details_untitled_study');
  const summary = item.summary?.trim();
  const reference = item.reference?.trim();
  const year =
    typeof item.year === "number" && item.year > 0 ? item.year : null;

  return (
    <View style={{ backgroundColor: "transparent", borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border, borderRadius: 16, overflow: "hidden", marginBottom: 16 }}>
      {/* Card header */}
      <View style={{ backgroundColor: theme.accentSubtle, paddingHorizontal: 16, paddingVertical: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.borderSubtle }}>
        <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
          <View style={{ backgroundColor: theme.surfaceHighlight, borderRadius: 8, padding: 6, marginRight: 8 }}>
            <Ionicons name="document-text-outline" size={14} color={theme.accent} />
          </View>
          <Text
            style={{ fontFamily: "Quicksand_700Bold", color: theme.textPrimary, fontSize: 13, flex: 1, lineHeight: 18 }}
            numberOfLines={2}
          >
            {title}
          </Text>
        </View>
        {year !== null && (
          <View style={{ backgroundColor: theme.surfaceTint, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, marginLeft: 8 }}>
            <Text style={{ fontFamily: "Quicksand_600SemiBold", color: theme.accent, fontSize: 11 }}>{year}</Text>
          </View>
        )}
      </View>

      {/* Summary */}
      {summary ? (
        <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}>
          <Text style={{ fontFamily: "Quicksand_500Medium", color: theme.textPrimary, fontSize: 13, lineHeight: 20 }}>{summary}</Text>
        </View>
      ) : (
        <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}>
          <Text style={{ fontFamily: "Quicksand_500Medium", color: theme.textSecondary, fontSize: 13, fontStyle: "italic" }}>
            {t('details_no_summary')}
          </Text>
        </View>
      )}

      {/* Reference */}
      {reference && (
        <View style={{ flexDirection: "row", alignItems: "flex-start", paddingHorizontal: 16, paddingBottom: 12, paddingTop: 4 }}>
          <Ionicons
            name="library-outline"
            size={13}
            color={theme.textSecondary}
            style={{ marginRight: 6, marginTop: 1 }}
          />
          <Text
            style={{ fontFamily: "Quicksand_500Medium", color: theme.textSecondary, fontSize: 11, fontStyle: "italic", flex: 1 }}
            numberOfLines={2}
          >
            {reference}
          </Text>
        </View>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────

export function ResearchTab({ research }: ResearchTabProps) {
  const theme = useTheme();


  const { t } = useTranslation();

  // ── Guard ─────────────────────────────────────────────────────────────────
  const safeResearch = Array.isArray(research)
    ? research.filter((item) => item !== null && item !== undefined)
    : [];

  if (safeResearch.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 80, paddingHorizontal: 32 }}>
        <View style={{ backgroundColor: theme.surfaceHighlight, borderRadius: 32, padding: 16, marginBottom: 16 }}>
          <Ionicons name="flask-outline" size={32} color={theme.border} />
        </View>
        <Text style={{ fontFamily: "Quicksand_700Bold", color: theme.textPrimary, fontSize: 16, textAlign: "center", marginBottom: 8 }}>
          {t('details_no_research_title')}
        </Text>
        <Text style={{ fontFamily: "Quicksand_500Medium", color: theme.textSecondary, fontSize: 13, textAlign: "center", lineHeight: 20 }}>
          {t('details_no_research_body')}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Count header */}
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16, paddingLeft: 4 }}>
        <Text style={{ fontFamily: "Quicksand_600SemiBold", color: theme.textSecondary, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>
          {t('details_studies_found').replace('{count}', safeResearch.length.toString())}
        </Text>
      </View>

      {safeResearch.map((item, index) => (
        <ResearchCard key={`research-${index}`} item={item} index={index} />
      ))}

      {/* Footer note */}
      <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8, paddingHorizontal: 4 }}>
        <Ionicons
          name="information-circle-outline"
          size={14}
          color={theme.textSecondary}
          style={{ marginRight: 6 }}
        />
        <Text style={{ flex: 1, fontFamily: "Quicksand_500Medium", color: theme.textSecondary, fontSize: 11, lineHeight: 16 }}>
          {t('details_research_disclaimer')}
        </Text>
      </View>
    </ScrollView>
  );
}

