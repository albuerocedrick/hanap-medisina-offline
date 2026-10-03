import React from "react";
import { View, ViewStyle } from "react-native";
import { useTheme } from "@/src/theme/useTheme";

interface PageTransitionProps {
  children: React.ReactNode;
  style?: ViewStyle;
  className?: string;
}

// The tab navigator owns the crossfade. Keep the canvas stationary so no
// unpainted navigator background is exposed during a page change.
export function PageTransition({ children, style, className }: PageTransitionProps) {
  const theme = useTheme();
  return <View style={[{ flex: 1, backgroundColor: theme.bg }, style]} className={className}>
    {children}
  </View>;
}
