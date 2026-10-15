import { useTheme } from "@/src/theme/useTheme";
/**
 * src/components/profile/profile-stats.tsx
 * Stat pill row (Total Scans).
 */
import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface StatPillProps {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  value: string;
}

function StatPill({ icon, label, value }: StatPillProps) {
  const theme = useTheme();



  return (
    <View className="flex-1 items-center py-2 px-2">
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.surface,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.border,
          marginBottom: 8,
        }}
      >
        <Feather name={icon} size={15} color={theme.textPrimary} />
      </View>
      <Text
        style={{ color: theme.textPrimary, fontFamily: "Quicksand_700Bold" }}
        className="text-xl"
      >
        {value}
      </Text>
      <Text
        style={{ color: theme.textSecondary, fontFamily: "Quicksand_600SemiBold" }}
        className="text-[11px] mt-0.5 text-center"
      >
        {label}
      </Text>
    </View>
  );
}

interface Props {
  totalScans: number;
  loading: boolean;
}

export function ProfileStats({ totalScans, loading }: Props) {
  return (
    <View className="flex-row gap-3 mx-6 mb-6">
      <StatPill
        icon="camera"
        label="Total Scans"
        value={loading ? "—" : String(totalScans)}
      />
    </View>
  );
}
