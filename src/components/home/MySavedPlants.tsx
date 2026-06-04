import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, useAnimatedStyle, withSpring, useSharedValue } from 'react-native-reanimated';
import { useLibraryStore } from '../../store/useLibraryStore';
import { MedicinalPlant } from '../../types';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const PlantCard = ({ plant, index, onPress }: { plant: MedicinalPlant; index: number; onPress: () => void }) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.94, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const imageSource = plant.imageUrl ? { uri: plant.imageUrl } : require('../../../assets/images/plant-placeholder.jpg');

  return (
    <AnimatedTouchableOpacity
      activeOpacity={0.9}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      entering={FadeIn.delay(index * 60)}
      style={[animatedStyle, { width: 110, marginRight: 16 }]}
    >
      <View className={`rounded-2xl overflow-hidden ${isDark ? 'bg-zinc-800/80 border-zinc-700/50' : 'bg-white border-zinc-200/50'} border pb-3 shadow-sm`}>
        <Image 
          source={imageSource} 
          className="w-full h-24 bg-zinc-200" 
          resizeMode="cover"
        />
        <View className="px-2 pt-2">
          <Text className={`font-semibold text-sm ${isDark ? 'text-zinc-100' : 'text-zinc-800'}`} numberOfLines={1}>
            {plant.name}
          </Text>
          <Text className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`} numberOfLines={1}>
            {plant.details?.localName || ' '}
          </Text>
        </View>
      </View>
    </AnimatedTouchableOpacity>
  );
};

export default function MySavedPlants() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const favorites = useLibraryStore((state) => state.favorites);
  
  if (!favorites) {
    return null;
  }

  return (
    <View className="mt-8 mb-4">
      <View className="flex-row items-center justify-between px-6 mb-4">
        <View className="flex-row items-center space-x-2">
          <Ionicons name="star-outline" size={20} color={isDark ? '#a1a1aa' : '#52525b'} />
          <Text className={`text-lg font-bold ${isDark ? 'text-zinc-100' : 'text-zinc-800'}`}>
            My Plants {favorites.length > 0 ? `(${favorites.length})` : ''}
          </Text>
        </View>
        
        {favorites.length > 0 && (
          <TouchableOpacity onPress={() => router.push('/(tabs)/library')} className="flex-row items-center">
            <Text className="text-emerald-600 font-medium mr-1">See All</Text>
            <Ionicons name="arrow-forward" size={16} color="#059669" />
          </TouchableOpacity>
        )}
      </View>

      {favorites.length === 0 ? (
        <Animated.View entering={FadeIn.duration(400)} className="px-6">
          <View className={`rounded-2xl p-5 border ${isDark ? 'bg-zinc-800/50 border-zinc-700/50' : 'bg-white border-zinc-200/50'} items-center justify-center`}>
            <View className={`w-12 h-12 rounded-full items-center justify-center mb-3 ${isDark ? 'bg-zinc-700/50' : 'bg-zinc-100'}`}>
              <Ionicons name="star-outline" size={24} color={isDark ? '#d4d4d8' : '#71717a'} />
            </View>
            <Text className={`text-center mb-4 ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>
              Save plants from the Library to see them here for quick access
            </Text>
            <TouchableOpacity 
              onPress={() => router.push('/(tabs)/library')}
              className="bg-emerald-600 py-2.5 px-5 rounded-full flex-row items-center"
            >
              <Text className="text-white font-medium mr-2">Explore Library</Text>
              <Ionicons name="arrow-forward" size={16} color="white" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      ) : (
        <ScrollView 
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24 }}
        >
          {favorites.map((plant, index) => (
            <PlantCard 
              key={plant.id} 
              plant={plant} 
              index={index} 
              onPress={() => router.push(`/(tabs)/library/${plant.id}`)}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}
