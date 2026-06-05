import React from 'react';
import { View, Text } from 'react-native';
import { useColorScheme } from 'nativewind';
import { Ionicons } from '@expo/vector-icons';
import { useLibraryStore } from '../../store/useLibraryStore';
import { useHistoryStore } from '../../store/useHistoryStore';
import { getAllPlants } from '../../services/localLibrary';

export default function YourStats() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const favoritesCount = useLibraryStore((state) => state.favorites?.length || 0);
  const scansCount = useHistoryStore((state) => state.scans?.length || 0);
  const totalPlantsCount = getAllPlants().length;

  const stats = [
    {
      icon: 'scan-outline' as const,
      value: scansCount,
      label: 'Scanned',
    },
    {
      icon: 'star-outline' as const,
      value: favoritesCount,
      label: 'Saved',
    },
    {
      icon: 'book-outline' as const,
      value: totalPlantsCount,
      label: 'In Library',
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
        Your Plant Journey
      </Text>

      {/* Stats card */}
      <View
        style={{
          borderRadius: 20,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(162,207,163,0.5)',
          backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FAFEEF',
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
                  backgroundColor: isDark
                    ? 'rgba(162,207,163,0.12)'
                    : 'rgba(162,207,163,0.25)',
                }}
              >
                <Ionicons
                  name={stat.icon}
                  size={20}
                  color={isDark ? 'rgba(162,207,163,0.9)' : '#4D8035'}
                />
              </View>
              <Text
                style={{
                  fontFamily: 'Quicksand_700Bold',
                  fontSize: 20,
                  color: isDark ? '#F8FAFC' : '#22451C',
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
                  color: isDark ? 'rgba(162,207,163,0.8)' : '#4D8035',
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
                  backgroundColor: isDark
                    ? 'rgba(255,255,255,0.08)'
                    : 'rgba(162,207,163,0.4)',
                }}
              />
            )}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}
