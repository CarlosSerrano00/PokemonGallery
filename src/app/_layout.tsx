import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { AppQueryProvider } from '@/query/query-provider';
import { useTheme } from '@/hooks/use-theme';
import { logEvent } from '@/utils/logger';

SplashScreen.preventAutoHideAsync().catch(() => {
  // The splash screen may already be hidden during a fast refresh.
});

export default function RootLayout() {
  const theme = useTheme();
  const scheme = useColorScheme();

  useEffect(() => {
    logEvent('app:start', {
      platform: process.env.EXPO_OS,
      timestamp: new Date().toISOString(),
    });
    SplashScreen.hideAsync().catch(() => {
      // Never block app start because of the splash screen.
    });
  }, []);

  return (
    <AppQueryProvider>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.background },
        }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="pokemon/[id]" />
        <Stack.Screen
          name="collection/new"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="collection/[id]"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
      </Stack>
    </AppQueryProvider>
  );
}
