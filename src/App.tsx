import { Fraunces_600SemiBold, Fraunces_700Bold } from '@expo-google-fonts/fraunces';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { DefaultTheme, NavigationContainer, type Theme } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text as RNText, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useAuthListener } from '@/hooks/useAuthListener';
import { RootNavigator } from '@/navigation/RootNavigator';
import { envError } from '@/services/env';
import { queryClient } from '@/services/queryClient';
import { useAuthStore } from '@/store/authStore';
import { colors } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {
  /* already hidden (e.g. fast refresh) */
});

const navigationTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    notification: colors.primary,
  },
};

function AppShell() {
  useAuthListener();
  const authReady = useAuthStore((s) => s.initialized);
  const [fontsLoaded, fontError] = useFonts({
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const ready = (fontsLoaded || !!fontError) && authReady;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  return (
    <NavigationContainer theme={navigationTheme}>
      <StatusBar style="dark" />
      <RootNavigator />
    </NavigationContainer>
  );
}

/** Shown instead of the app when required env vars are missing, so setup mistakes are obvious. */
function MissingConfig({ message }: { message: string }) {
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);
  return (
    <ScrollView contentContainerStyle={styles.config}>
      <RNText style={styles.configTitle}>Glam & Glow needs configuration</RNText>
      <RNText style={styles.configBody}>{message}</RNText>
      <RNText style={styles.configBody}>
        Copy .env.example to .env, fill in your Supabase URL and anon key, then restart with `npx expo start -c`. See
        docs/DEPLOYMENT.md.
      </RNText>
    </ScrollView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      {envError ? (
        <MissingConfig message={envError} />
      ) : (
        <QueryClientProvider client={queryClient}>
          <View style={styles.root}>
            <AppShell />
          </View>
        </QueryClientProvider>
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  config: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 12, backgroundColor: colors.background },
  configTitle: { fontSize: 22, fontWeight: '700', color: colors.primary },
  configBody: { fontSize: 15, lineHeight: 22, color: colors.text },
});
