import { StyleSheet, View } from "react-native";
import { scanStyles as styles } from "@/src/components/scan/scan.styles";
import { useTheme } from "@/src/theme/useTheme";

export function ScanReticle({ width, height }: { width: number; height: number }) {
  const theme = useTheme();
  return (
    <View style={styles.reticleContainer} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={[styles.reticle, { width, height }]}>
        {(["tl", "tr", "bl", "br"] as const).map(pos => {
          const top = pos[0] === "t";
          const left = pos[1] === "l";
          return <View key={pos} style={{ position: "absolute", width: 32, height: 32,
            top: top ? 0 : undefined, bottom: top ? undefined : 0, left: left ? 0 : undefined, right: left ? undefined : 0,
            borderTopWidth: top ? StyleSheet.hairlineWidth * 3 : 0, borderBottomWidth: top ? 0 : StyleSheet.hairlineWidth * 3,
            borderLeftWidth: left ? StyleSheet.hairlineWidth * 3 : 0, borderRightWidth: left ? 0 : StyleSheet.hairlineWidth * 3,
            borderColor: theme.onImage, borderRadius: 2 }} />;
        })}
      </View>
    </View>
  );
}
