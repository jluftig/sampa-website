import {
  IBMPlexMono_500Medium,
} from '@expo-google-fonts/ibm-plex-mono';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';

import { BiometricGate } from '@/components/biometric-gate';
import { Colors } from '@/constants/theme';
import { AuthProvider } from '@/lib/AuthContext';
import { FavoritesProvider } from '@/lib/favorites';
import { persistOptions, queryClient, useQueryFocusManager } from '@/lib/query';

SplashScreen.preventAutoHideAsync();

// React Navigation themes tinted with the SAMPA palette (headers, backgrounds).
const NavLight = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.light.tint,
    background: Colors.light.background,
    card: Colors.light.backgroundElement,
    text: Colors.light.text,
    border: Colors.light.border,
  },
};

const NavDark = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.dark.tint,
    background: Colors.dark.background,
    card: Colors.dark.backgroundElement,
    text: Colors.dark.text,
    border: Colors.dark.border,
  },
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  useQueryFocusManager();

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
    IBMPlexMono_500Medium,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <AuthProvider>
      <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
        <FavoritesProvider>
          <ThemeProvider value={colorScheme === 'dark' ? NavDark : NavLight}>
            <BiometricGate>
              <Stack screenOptions={{ headerShown: false }}>
                {/* title feeds the back-button label on pushed screens (else "(tabs)" leaks) */}
                <Stack.Screen name="(tabs)" options={{ title: 'Back' }} />
                <Stack.Screen
                  name="news/[slug]"
                  options={{ headerShown: true, title: '', headerBackTitle: 'Back' }}
                />
                <Stack.Screen
                  name="keywords/[slug]"
                  options={{ headerShown: true, title: '', headerBackTitle: 'Back' }}
                />
                <Stack.Screen
                  name="search"
                  options={{ headerShown: true, title: 'Search', headerBackTitle: 'Back' }}
                />
                <Stack.Screen
                  name="profile"
                  options={{ headerShown: true, title: 'Edit profile', headerBackTitle: 'Back' }}
                />
              </Stack>
            </BiometricGate>
            <StatusBar style="auto" />
          </ThemeProvider>
        </FavoritesProvider>
      </PersistQueryClientProvider>
    </AuthProvider>
  );
}
