import React from 'react';
import { View, Text } from 'react-native';
import { useColorScheme } from 'nativewind';
import { Ionicons } from '@expo/vector-icons';
import { useLibraryStore } from '../../store/useLibraryStore';
import { useHistoryStore } from '../../store/useHistoryStore';
import { getAllPlants } from '../../services/localLibrary';
import { useTranslation } from '@/src/i18n/useTranslation';
import { useTheme } from '@/src/theme/useTheme';

export default function YourStats() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = useTheme();
  const { t } = useTranslation();


  const favoritesCount = useLibraryStore((state) => state.favorites?.length || 0);
  const scansCount = useHistoryStore((state) => state.scans?.length || 0);
  const totalPlantsCount = getAllPlants().length;

  const stats = [
    {
      icon: 'scan-outline' as const,
      value: scansCount,
      label: t('stats_scanned'),
    },
    {
      icon: 'star-outline' as const,
      value: favoritesCount,
      label: t('stats_saved'),
    },
    {
      icon: 'book-outline' as const,
      value: totalPlantsCount,
      label: t('stats_in_library'),
    },
  ];

  return (
    <View style={{ marginTop: 4, marginBottom: 32, paddingHorizontal: 24 }}>
      <Text
        style={{
          fontSize: 22,
          fontFamily: 'serif',
          fontStyle: 'italic',
          fontWeight: '500',
          letterSpacing: 0.4,
          marginBottom: 14,
          color: isDark ? '#EAF3D5' : '#22451C',
        }}
      >
        {t('home_stats_title')}
      </Text>

      {/* Stats card */}
      <View
        style={{
          borderRadius: 20,
          borderWidth: 1,
          borderColor: theme.borderSubtle,
          // Light mode used #FAFEEF, identical to the page behind it, so the
          // card had no presence of its own.
          backgroundColor: theme.surface,
          flexDirection: 'row',
          shadowColor: '#22451C',

          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        {stats.map((stat, i) => (
          <React.Fragment key={stat.label}>
            {/* Stat item */}
            <View style={{ flex: 1, alignItems: 'center', paddingVertical: 18 }}>
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 21,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 8,
                  // At 0.12 alpha over the dark card this disc was nearly
                  // indistinguishable from black, which is the dark box showing
                  // behind each icon. accentSubtle is tuned per theme.
                  backgroundColor: theme.accentSubtle,
                }}
              >
                <Ionicons
                  name={stat.icon}
                  size={20}
                  color={theme.accent}
                />

              </View>
              <Text
                style={{
                  fontFamily: 'Quicksand_700Bold',
                  fontSize: 20,
                  color: theme.textPrimary,
                  lineHeight: 24,

                }}
              >
                {stat.value}
              </Text>
              <Text
                style={{
                  fontFamily: 'Quicksand_500Medium',
                  fontSize: 12,
                  marginTop: 2,
                  color: theme.textSecondary,
                }}

              >
                {stat.label}
              </Text>
            </View>

            {/* Divider between items */}
            {i < stats.length - 1 && (
              <View
                style={{
                  width: 1,
                  marginVertical: 16,
                  backgroundColor: theme.borderSubtle,
                }}

              />
            )}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}
