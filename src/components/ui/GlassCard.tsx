import { useTheme } from "@/src/theme/useTheme";
// src/components/ui/GlassCard.tsx
import { BlurView } from 'expo-blur';
import { View, ViewProps } from 'react-native';

interface GlassCardProps extends ViewProps {
  intensity?: number;
}

export function GlassCard({ children, intensity = 50, style, ...props }: GlassCardProps) {
  const theme = useTheme();

  const isDark = theme.isDark;

  return (
    <View
      // The white/20 hairline is invisible on a light background; it needs to
      // flip with the scheme, as does the blur tint (was hardcoded "light",
      // which frosts to near-white over the dark theme).
      className="overflow-hidden rounded-3xl border shadow-sm"
      style={[{ borderColor: theme.borderSubtle }, style]}
      {...props}
    >
      <BlurView intensity={intensity} tint={isDark ? 'dark' : 'light'} className="p-5">
        {children}
      </BlurView>
    </View>
  );
}
