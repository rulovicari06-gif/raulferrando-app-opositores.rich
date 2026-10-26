import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { rescheduleNotifications } from '@/lib/notifications';
import { hydrate, useData, useHydrated } from '@/lib/store';

SplashScreen.preventAutoHideAsync();

/** Reprograma los avisos cuando cambia algo que afecta al plan. */
function NotificationSync() {
  const profile = useData((d) => d.profile);
  const subjects = useData((d) => d.subjects);
  const topics = useData((d) => d.topics);

  useEffect(() => {
    if (!profile) return;
    const timer = setTimeout(() => {
      rescheduleNotifications({ profile, subjects, topics }).catch(() => {});
    }, 1500);
    return () => clearTimeout(timer);
  }, [profile, subjects, topics]);

  return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const hydrated = useHydrated();

  useEffect(() => {
    hydrate();
  }, []);

  useEffect(() => {
    if (hydrated) SplashScreen.hideAsync();
  }, [hydrated]);

  if (!hydrated) return null;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <NotificationSync />
      <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal' }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="asignatura/[id]" options={{ title: 'Asignatura' }} />
        <Stack.Screen name="tema/[id]" options={{ title: 'Tema' }} />
        <Stack.Screen name="bloque/[id]" options={{ title: 'Bloque de estudio' }} />
        <Stack.Screen name="test/[id]" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
        <Stack.Screen name="ajustes" options={{ title: 'Ajustes' }} />
      </Stack>
    </ThemeProvider>
  );
}
