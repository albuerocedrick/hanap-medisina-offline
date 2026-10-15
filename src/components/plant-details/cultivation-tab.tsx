import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ScrollView, Text, View, StyleSheet } from "react-native";
import { CultivationGuide } from "@/src/types";
import { useTranslation } from "@/src/i18n/useTranslation";
import { useTheme } from "@/src/theme/useTheme";


interface CultivationTabProps {
  cultivationGuide: CultivationGuide;
}

function SectionItem({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  const theme = useTheme();



  return (
    <View style={{ flexDirection: "row", paddingHorizontal: 16, paddingVertical: 12, alignItems: "flex-start", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.borderSubtle }}>
      <View style={{ marginTop: 2, marginRight: 10 }}>
        <Ionicons name={icon} size={18} color={theme.textSecondary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: "Quicksand_600SemiBold", color: theme.textSecondary, fontSize: 13, marginBottom: 2 }}>
          {label}
        </Text>
        <Text style={{ fontFamily: "Quicksand_600SemiBold", color: theme.textPrimary, fontSize: 14, lineHeight: 20 }}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function SectionHeader({
  icon,
  title,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
}) {
  const theme = useTheme();



  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12, marginTop: 24 }}>
      <View style={{ backgroundColor: theme.accentSubtle, borderRadius: 8, padding: 6, marginRight: 8 }}>
        <Ionicons name={icon} size={16} color={theme.accent} />
      </View>
      <Text style={{ fontFamily: "Quicksand_700Bold", color: theme.textPrimary, fontSize: 13, textTransform: "uppercase", letterSpacing: 0.5 }}>
        {title}
      </Text>
    </View>
  );
}

function EmptySection({ message }: { message: string }) {
  const theme = useTheme();



  return (
    <View style={{ backgroundColor: theme.surfaceHighlight, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12 }}>
      <Text style={{ fontFamily: "Quicksand_500Medium", color: theme.textSecondary, fontSize: 13, fontStyle: "italic" }}>
        {message}
      </Text>
    </View>
  );
}

export function CultivationTab({ cultivationGuide }: CultivationTabProps) {
  const { t } = useTranslation();
  const theme = useTheme();


  if (!cultivationGuide) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 64 }}>
        <Ionicons name="leaf-outline" size={40} color={theme.border} />
        <Text style={{ fontFamily: "Quicksand_500Medium", color: theme.textSecondary, fontSize: 14, marginTop: 12 }}>
          {t('details_no_cultivation')}
        </Text>
      </View>
    );
  }

  const tips = Array.isArray(cultivationGuide.tips) ? cultivationGuide.tips : [];

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      <SectionHeader icon="rose-outline" title={t('details_growing_req')} />
      {/* Was backgroundColor "transparent" while the Tips cards below were a
          different pale green (#F2F9F2) — two sibling cards on one screen with
          two different surfaces. Both now use the shared surfaceTint token. */}
      <View style={{ backgroundColor: theme.surfaceTint, borderWidth: 1, borderColor: theme.borderSubtle, borderRadius: 16, overflow: "hidden" }}>

        <SectionItem icon="thermometer-outline" label={t('details_climate')} value={cultivationGuide.climate || t('details_na')} />
        <SectionItem icon="earth-outline" label={t('details_soil')} value={cultivationGuide.soil || t('details_na')} />
        <SectionItem icon="sunny-outline" label={t('details_sunlight')} value={cultivationGuide.sunlight || t('details_na')} />
        <SectionItem icon="water-outline" label={t('details_watering')} value={cultivationGuide.watering || t('details_na')} />
        <SectionItem icon="git-branch-outline" label={t('details_propagation')} value={cultivationGuide.propagation || t('details_na')} />
        <SectionItem icon="time-outline" label={t('details_growth_time')} value={cultivationGuide.growthTime || t('details_na')} />
      </View>

      <SectionHeader icon="bulb-outline" title={t('details_tips_care')} />
      {tips.length > 0 ? (
        <View style={{ gap: 8 }}>
          {tips.map((tip, index) => (
            <View
              key={index}
              style={{ flexDirection: "row", paddingHorizontal: 16, paddingVertical: 12, alignItems: "flex-start", backgroundColor: theme.surfaceTint, borderRadius: 16, borderWidth: 1, borderColor: theme.borderSubtle }}
            >
              <Ionicons name="checkmark-circle" size={16} color={theme.accent} style={{ marginTop: 2, marginRight: 10 }} />
              <Text style={{ flex: 1, fontFamily: "Quicksand_500Medium", color: theme.textPrimary, fontSize: 14, lineHeight: 20 }}>

                {tip}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <EmptySection message={t('details_no_tips')} />
      )}
    </ScrollView>
  );
}
