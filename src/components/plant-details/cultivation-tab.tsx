import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ScrollView, Text, View, StyleSheet } from "react-native";
import { useColorScheme } from "nativewind";
import { CultivationGuide } from "../../types";

interface CultivationTabProps {
  cultivationGuide: CultivationGuide;
}

function SectionItem({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View style={{ flexDirection: "row", paddingHorizontal: 16, paddingVertical: 12, alignItems: "flex-start", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(162,207,163,0.2)" }}>
      <View style={{ marginTop: 2, marginRight: 10 }}>
        <Ionicons name={icon} size={18} color={isDark ? "rgba(248,250,252,0.6)" : "rgba(34,69,28,0.7)"} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: "Quicksand_600SemiBold", color: isDark ? "rgba(248,250,252,0.5)" : "rgba(34,69,28,0.6)", fontSize: 13, marginBottom: 2 }}>
          {label}
        </Text>
        <Text style={{ fontFamily: "Quicksand_600SemiBold", color: isDark ? "rgba(248,250,252,0.9)" : "#22451C", fontSize: 14, lineHeight: 20 }}>
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

export function CultivationTab({ cultivationGuide }: CultivationTabProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  if (!cultivationGuide) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 64 }}>
        <Ionicons name="leaf-outline" size={40} color={isDark ? "rgba(255,255,255,0.2)" : "rgba(34,69,28,0.2)"} />
        <Text style={{ fontFamily: "Quicksand_500Medium", color: isDark ? "rgba(248,250,252,0.5)" : "rgba(34,69,28,0.5)", fontSize: 14, marginTop: 12 }}>
          No cultivation guide available.
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
      <SectionHeader icon="rose-outline" title="Growing Requirements" />
      <View style={{ backgroundColor: "transparent", borderWidth: StyleSheet.hairlineWidth, borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(162,207,163,0.4)", borderRadius: 16, overflow: "hidden" }}>
        <SectionItem icon="thermometer-outline" label="Climate" value={cultivationGuide.climate || "N/A"} />
        <SectionItem icon="earth-outline" label="Soil" value={cultivationGuide.soil || "N/A"} />
        <SectionItem icon="sunny-outline" label="Sunlight" value={cultivationGuide.sunlight || "N/A"} />
        <SectionItem icon="water-outline" label="Watering" value={cultivationGuide.watering || "N/A"} />
        <SectionItem icon="git-branch-outline" label="Propagation" value={cultivationGuide.propagation || "N/A"} />
        <SectionItem icon="time-outline" label="Growth Time" value={cultivationGuide.growthTime || "N/A"} />
      </View>

      <SectionHeader icon="bulb-outline" title="Tips & Care" />
      {tips.length > 0 ? (
        <View style={{ gap: 8 }}>
          {tips.map((tip, index) => (
            <View
              key={index}
              style={{ flexDirection: "row", paddingHorizontal: 16, paddingVertical: 12, alignItems: "flex-start", backgroundColor: isDark ? "rgba(162,207,163,0.08)" : "#F2F9F2", borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, borderColor: isDark ? "rgba(162,207,163,0.2)" : "rgba(162,207,163,0.5)" }}
            >
              <Ionicons name="checkmark-circle" size={16} color={isDark ? "#A2CFA3" : "#4A7A44"} style={{ marginTop: 2, marginRight: 10 }} />
              <Text style={{ flex: 1, fontFamily: "Quicksand_500Medium", color: isDark ? "rgba(248,250,252,0.85)" : "#22451C", fontSize: 14, lineHeight: 20 }}>
                {tip}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <EmptySection message="No cultivation tips available." />
      )}
    </ScrollView>
  );
}
