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

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const imageSource = plant.imageUrl
    ? { uri: plant.imageUrl }
    : require('../../../assets/images/plant-placeholder.jpg');

  return (
    <AnimatedTouchableOpacity
      activeOpacity={0.9}
      onPressIn={() => { scale.value = withSpring(0.94, { damping: 15, stiffness: 300 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 300 }); }}
      onPress={onPress}
      entering={FadeIn.delay(index * 60)}
      style={[animatedStyle, { width: 110, marginRight: 14 }]}
    >
      <View
        style={{
          borderRadius: 18,
          overflow: 'hidden',
          backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FAFEEF',
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(162,207,163,0.5)',
          shadowColor: '#22451C',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 6,
          elevation: 2,
          paddingBottom: 10,
        }}
      >
        <Image
          source={imageSource}
          style={{ width: '100%', height: 90 }}
          resizeMode="cover"
        />
        <View style={{ paddingHorizontal: 8, paddingTop: 8 }}>
          <Text
            numberOfLines={1}
            style={{
              fontFamily: 'Quicksand_600SemiBold',
              fontSize: 13,
              color: isDark ? '#F8FAFC' : '#22451C',
            }}
          >
            {plant.name}
          </Text>
          <Text
            numberOfLines={1}
            style={{
              fontFamily: 'Quicksand_500Medium',
              fontSize: 11,
              marginTop: 2,
              color: isDark ? 'rgba(162,207,163,0.8)' : '#4D8035',
            }}
          >
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

  if (!favorites) return null;

  return (
    <View style={{ marginTop: 8, marginBottom: 16 }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, marginBottom: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons
            name="star-outline"
            size={20}
            color={isDark ? 'rgba(248,250,252,0.5)' : 'rgba(34,69,28,0.5)'}
          />
          <Text
            style={{
              fontFamily: 'Quicksand_700Bold',
              fontSize: 16,
              color: isDark ? 'rgba(248,250,252,0.7)' : 'rgba(34,69,28,0.7)',
            }}
          >
            My Plants{favorites.length > 0 ? ` (${favorites.length})` : ''}
          </Text>
        </View>

        {favorites.length > 0 && (
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/library')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text
              style={{
                fontFamily: 'Quicksand_600SemiBold',
                fontSize: 13,
                color: isDark ? 'rgba(162,207,163,0.9)' : '#4D8035',
              }}
            >
              See All →
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Empty state */}
      {favorites.length === 0 ? (
        <Animated.View entering={FadeIn.duration(400)} style={{ paddingHorizontal: 24 }}>
          <View
            style={{
              borderRadius: 20,
              padding: 20,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FAFEEF',
              borderWidth: 1,
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(162,207,163,0.5)',
            }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
                backgroundColor: isDark ? 'rgba(162,207,163,0.12)' : 'rgba(162,207,163,0.25)',
              }}
            >
              <Ionicons
                name="star-outline"
                size={24}
                color={isDark ? 'rgba(162,207,163,0.9)' : '#4D8035'}
              />
            </View>
            <Text
              style={{
                fontFamily: 'Quicksand_500Medium',
                fontSize: 13,
                textAlign: 'center',
                marginBottom: 16,
                color: isDark ? 'rgba(248,250,252,0.6)' : 'rgba(34,69,28,0.6)',
              }}
            >
              Save plants from the Library to see them here for quick access
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/library')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 10,
                paddingHorizontal: 20,
                borderRadius: 20,
                backgroundColor: isDark ? 'rgba(162,207,163,0.15)' : 'rgba(162,207,163,0.3)',
                gap: 6,
              }}
            >
              <Text
                style={{
                  fontFamily: 'Quicksand_600SemiBold',
                  fontSize: 13,
                  color: isDark ? 'rgba(162,207,163,0.9)' : '#22451C',
                }}
              >
                Explore Library
              </Text>
              <Ionicons
                name="arrow-forward"
                size={14}
                color={isDark ? 'rgba(162,207,163,0.9)' : '#22451C'}
              />
            </TouchableOpacity>
          </View>
        </Animated.View>
      ) : (
        /* Plant cards horizontal scroll */
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
