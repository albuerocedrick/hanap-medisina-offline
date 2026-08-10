// src/components/ui/GlassCard.tsx
import { BlurView } from 'expo-blur';
import { useColorScheme } from 'nativewind';
import { View, ViewProps } from 'react-native';

interface GlassCardProps extends ViewProps {
  intensity?: number;
}

export function GlassCard({ children, intensity = 50, style, ...props }: GlassCardProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View
      // The white/20 hairline is invisible on a light background; it needs to
      // flip with the scheme, as does the blur tint (was hardcoded "light",
      // which frosts to near-white over the dark theme).
      className={`overflow-hidden rounded-3xl border shadow-sm ${
        isDark ? 'border-white/20' : 'border-[#A2CFA3]/45'
      }`}
      style={style}
      {...props}
    >
      <BlurView intensity={intensity} tint={isDark ? 'dark' : 'light'} className="p-5">
        {children}
      </BlurView>
    </View>
  );
}
