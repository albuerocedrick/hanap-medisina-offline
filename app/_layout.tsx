import { useFonts } from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { Onboarding } from '@/src/components/onboarding/Onboarding';
import { useOnboardingStore } from '@/src/store/useOnboardingStore';
import {
  Quicksand_400Regular,
  Quicksand_500Medium,
  Quicksand_600SemiBold,
  Quicksand_700Bold,
} from '@expo-google-fonts/quicksand';

// Ensure your global CSS is imported for NativeWind to work
import "../global.css"; 

// Prevent the splash screen from auto-hiding before fonts are loaded
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const completed = useOnboardingStore(s => s.completed);
  const [hydrated, setHydrated] = useState(useOnboardingStore.persist.hasHydrated());
  useEffect(() => {
    const unsubscribe = useOnboardingStore.persist.onFinishHydration(() => setHydrated(true));
    setHydrated(useOnboardingStore.persist.hasHydrated());
    return unsubscribe;
  }, []);
  const [fontsLoaded, error] = useFonts({
    'Quicksand_400Regular': Quicksand_400Regular,
    'Quicksand_500Medium': Quicksand_500Medium,
    'Quicksand_600SemiBold': Quicksand_600SemiBold,
    'Quicksand_700Bold': Quicksand_700Bold,
  });

  // Catch and throw any font loading errors
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  // Hide the splash screen once fonts are fully ready
  useEffect(() => {
    if (fontsLoaded && hydrated) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, hydrated]);

  // Do not render the app until fonts are loaded
  if (!fontsLoaded || !hydrated) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {!completed ? <Onboarding /> : <Stack screenOptions={{ headerShown: false }}>
        {/* Tabs Group */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        
        {/* All Symptoms screen — slides in from bottom as modal */}
        <Stack.Screen name="symptoms" options={{ headerShown: false, presentation: "card" }} />
        <Stack.Screen name="quick-remedies" options={{ headerShown: false, presentation: "card" }} />

        {/* 404 Fallback */}
        <Stack.Screen name="+not-found" options={{ presentation: 'modal' }} />
      </Stack>}
    </GestureHandlerRootView>
  );
}
