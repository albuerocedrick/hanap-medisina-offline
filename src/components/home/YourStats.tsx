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

  return (
    <View className="mt-4 mb-8 px-6">
      <View className="flex-row items-center space-x-2 mb-4">
        <Ionicons name="stats-chart-outline" size={20} color={isDark ? '#a1a1aa' : '#52525b'} />
        <Text className={`text-lg font-bold ${isDark ? 'text-zinc-100' : 'text-zinc-800'}`}>
          Your Plant Journey
        </Text>
      </View>

      <View className={`rounded-2xl p-4 border flex-row justify-between ${isDark ? 'bg-zinc-800/80 border-zinc-700/50' : 'bg-white border-zinc-200/50'} shadow-sm`}>
        
        {/* Scanned */}
        <View className="items-center flex-1">
          <View className={`w-10 h-10 rounded-full items-center justify-center mb-2 ${isDark ? 'bg-emerald-900/40' : 'bg-emerald-50'}`}>
            <Ionicons name="scan-outline" size={20} color={isDark ? '#34d399' : '#059669'} />
          </View>
          <Text className={`font-bold text-lg ${isDark ? 'text-zinc-100' : 'text-zinc-800'}`}>
            {scansCount}
          </Text>
          <Text className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
            Scanned
          </Text>
        </View>

        {/* Divider */}
        <View className={`w-px h-full ${isDark ? 'bg-zinc-700' : 'bg-zinc-200'}`} />

        {/* Saved */}
        <View className="items-center flex-1">
          <View className={`w-10 h-10 rounded-full items-center justify-center mb-2 ${isDark ? 'bg-amber-900/40' : 'bg-amber-50'}`}>
            <Ionicons name="star-outline" size={20} color={isDark ? '#fbbf24' : '#d97706'} />
          </View>
          <Text className={`font-bold text-lg ${isDark ? 'text-zinc-100' : 'text-zinc-800'}`}>
            {favoritesCount}
          </Text>
          <Text className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
            Saved
          </Text>
        </View>

        {/* Divider */}
        <View className={`w-px h-full ${isDark ? 'bg-zinc-700' : 'bg-zinc-200'}`} />

        {/* In Library */}
        <View className="items-center flex-1">
          <View className={`w-10 h-10 rounded-full items-center justify-center mb-2 ${isDark ? 'bg-blue-900/40' : 'bg-blue-50'}`}>
            <Ionicons name="book-outline" size={20} color={isDark ? '#60a5fa' : '#2563eb'} />
          </View>
          <Text className={`font-bold text-lg ${isDark ? 'text-zinc-100' : 'text-zinc-800'}`}>
            {totalPlantsCount}
          </Text>
          <Text className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
            In Library
          </Text>
        </View>

      </View>
    </View>
  );
}
