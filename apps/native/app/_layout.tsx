import * as React from 'react';
import { I18nManager, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from '../components/auth-provider';
import { AuthGate } from '../components/auth-gate';
import { ThemeProvider, lightTheme, useTheme } from '../theme';
import type { Theme } from '../theme/types';
import {
  useFonts,
  Vazirmatn_400Regular,
  Vazirmatn_500Medium,
  Vazirmatn_600SemiBold,
  Vazirmatn_700Bold,
  Vazirmatn_800ExtraBold,
} from '@expo-google-fonts/vazirmatn';

if (!I18nManager.isRTL) {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
}

SplashScreen.preventAutoHideAsync().catch(() => {});

export function ErrorBoundary({ error }: { error: Error }) {
  const styles = React.useMemo(() => createFallbackStyles(lightTheme), []);

  React.useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <View style={styles.fallback}>
      <Text selectable style={styles.fallbackTitle}>
        خطای راه‌اندازی
      </Text>
      <Text selectable style={styles.fallbackDescription}>
        {error.message}
      </Text>
    </View>
  );
}

export default function RootLayout() {
  const [fontLoadTimedOut, setFontLoadTimedOut] = React.useState(false);
  const [loaded, error] = useFonts({
    Vazirmatn_400Regular,
    Vazirmatn_500Medium,
    Vazirmatn_600SemiBold,
    Vazirmatn_700Bold,
    Vazirmatn_800ExtraBold,
  });

  React.useEffect(() => {
    const timeout = setTimeout(() => setFontLoadTimedOut(true), 2500);
    return () => clearTimeout(timeout);
  }, []);

  if (!loaded && !error && !fontLoadTimedOut) {
    return <View style={createFallbackStyles(lightTheme).fallback} />;
  }

  return (
    <ThemeProvider>
      <RootLayoutContent />
    </ThemeProvider>
  );
}

function RootLayoutContent() {
  const { isThemeReady, theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  React.useEffect(() => {
    if (isThemeReady) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isThemeReady]);

  if (!isThemeReady) {
    return <View style={styles.container} />;
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <StatusBar style={theme.statusBarStyle} />
        <AuthProvider>
          <AuthGate>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: {
                  backgroundColor: theme.navigationTheme.colors.background,
                },
              }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="staff" />
              <Stack.Screen name="business-hours" />
              <Stack.Screen name="onboarding" />
              <Stack.Screen name="retention" />
              <Stack.Screen name="notifications" />
              <Stack.Screen name="push-settings" />
              <Stack.Screen name="clients/[id]" />
              <Stack.Screen name="login" />
              <Stack.Screen name="signup" />
              <Stack.Screen name="+not-found" />
            </Stack>
          </AuthGate>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function createFallbackStyles(theme: typeof lightTheme) {
  return StyleSheet.create({
    fallback: {
      backgroundColor: theme.colors.background,
      flex: 1,
      gap: 12,
      justifyContent: 'center',
      padding: 24,
    },
    fallbackDescription: {
      color: theme.colors.destructive,
      fontFamily: theme.fonts.sans,
      fontSize: 13,
      lineHeight: 20,
      textAlign: 'center',
      writingDirection: 'rtl',
    },
    fallbackTitle: {
      color: theme.colors.destructive,
      fontFamily: theme.fonts.sansBold,
      fontSize: 18,
      lineHeight: 28,
      textAlign: 'center',
      writingDirection: 'rtl',
    },
  });
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      backgroundColor: theme.colors.background,
      flex: 1,
    },
  });
}
