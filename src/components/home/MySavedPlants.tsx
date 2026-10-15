import { useTheme } from "@/src/theme/useTheme";
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, useAnimatedStyle, withSpring, useSharedValue } from 'react-native-reanimated';
import { useLibraryStore } from '@/src/store/useLibraryStore';
import { MedicinalPlant } from '@/src/types';
import { useTranslation } from '@/src/i18n/useTranslation';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const PlantCard = ({ plant, index, onPress }: { plant: MedicinalPlant; index: number; onPress: () => void }) => {
  const theme = useTheme();


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
          backgroundColor: theme.surface,
          borderWidth: 1,
          borderColor: theme.border,
          shadowColor: theme.shadow,
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
              color: theme.textPrimary,
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
              color: theme.accent,
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
  const theme = useTheme();
  const router = useRouter();


  const favorites = useLibraryStore((state) => state.favorites);
  const { t } = useTranslation();

  if (!favorites) return null;

  return (
    <View style={{ marginTop: 8, marginBottom: 16 }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, marginBottom: 14 }}>
        <Text
          style={{
            fontSize: 22,
            fontFamily: 'serif',
            fontStyle: 'italic',
            fontWeight: '500',
            letterSpacing: 0.4,
            color: theme.textPrimary,
          }}
        >
          {t('home_saved_title')}{favorites.length > 0 ? ` (${favorites.length})` : ''}
        </Text>

        {favorites.length > 0 && (
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/library')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text
              style={{
                fontFamily: 'Quicksand_600SemiBold',
                fontSize: 13,
                color: theme.accent,
              }}
            >
              {t('home_see_all')} →
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
              backgroundColor: theme.surface,
              borderWidth: 1,
              borderColor: theme.border,
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
                backgroundColor: theme.accentSubtle,
              }}
            >
              <Ionicons
                name="star-outline"
                size={24}
                color={theme.accent}
              />
            </View>
            <Text
              style={{
                fontFamily: 'Quicksand_500Medium',
                fontSize: 13,
                textAlign: 'center',
                marginBottom: 16,
                color: theme.textSecondary,
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
                backgroundColor: theme.accentSubtle,
                gap: 6,
              }}
            >
              <Text
                style={{
                  fontFamily: 'Quicksand_600SemiBold',
                  fontSize: 13,
                  color: theme.accent,
                }}
              >
                Explore Library
              </Text>
              <Ionicons
                name="arrow-forward"
                size={14}
                color={theme.accent}
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
