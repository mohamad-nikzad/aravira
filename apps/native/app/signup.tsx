import * as React from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { ExternalLink } from 'lucide-react-native';
import { Button } from '../components/ui/button';
import { useTheme, useThemeStyles, withAlpha } from '../theme';

function resolveWebUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_WEB_BASE_URL;
  if (fromEnv && fromEnv.length > 0) return fromEnv;
  const fromConfig = Constants.expoConfig?.extra as
    | { webBaseUrl?: string; apiBaseUrl?: string }
    | undefined;
  if (fromConfig?.webBaseUrl) return fromConfig.webBaseUrl;
  if (fromConfig?.apiBaseUrl) return fromConfig.apiBaseUrl;
  return 'https://aravira-saloon.vercel.app';
}

export default function SignupScreen() {
  const { theme } = useTheme();
  const signupUrl = `${resolveWebUrl().replace(/\/+$/, '')}/signup`;
  const styles = useThemeStyles((t) => ({
    safe: { flex: 1, backgroundColor: t.colors.background },
    scrollContent: { padding: t.spacing['3xl'], gap: t.spacing['3xl'] },
    brand: { alignItems: 'center' as const, gap: t.spacing.lg },
    logo: { width: 72, height: 72, borderRadius: t.radius.xl },
    brandTitle: {
      fontSize: t.fontSize['2xl'],
      color: t.colors.foreground,
      fontFamily: t.fonts.sansBold,
    },
    card: {
      gap: t.spacing.lg,
      borderRadius: t.radius.xl,
      borderWidth: t.sizes.hairline,
      borderColor: withAlpha(t.colors.border, 0.6),
      backgroundColor: t.colors.card,
      padding: t.spacing['2xl'],
    },
    cardTitle: {
      fontSize: t.fontSize.lg,
      color: t.colors.foreground,
      fontFamily: t.fonts.sansSemiBold,
    },
    cardBody: {
      fontSize: t.fontSize.base,
      color: t.colors.mutedForeground,
      fontFamily: t.fonts.sans,
      lineHeight: 22,
    },
    btnContent: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: t.spacing.md,
    },
    btnText: {
      fontSize: t.fontSize.base,
      color: t.colors.primaryForeground,
      fontFamily: t.fonts.sansSemiBold,
    },
    footer: { alignItems: 'center' as const },
    footerLink: {
      fontSize: t.fontSize.base,
      fontFamily: t.fonts.sansSemiBold,
      color: t.colors.primary,
    },
  }));

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.brand}>
          <Image
            source={require('../assets/images/saloora-mark-clean.png')}
            style={styles.logo}
            contentFit="contain"
          />
          <Text style={styles.brandTitle}>ساخت سالن جدید</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>راه‌اندازی سالن از طریق وب</Text>
          <Text style={styles.cardBody}>
            برای ایجاد سالن جدید، انتخاب نام، و افزودن خدمات و کارکنان از داشبورد وب سالورا استفاده
            کنید. پس از ساخت سالن، می‌توانید از همین برنامه وارد شوید.
          </Text>

          <Button onPress={() => Linking.openURL(signupUrl)}>
            <View style={styles.btnContent}>
              <ExternalLink
                size={theme.sizes.iconSm}
                color={theme.colors.primaryForeground}
                strokeWidth={2}
              />
              <Text style={styles.btnText}>باز کردن داشبورد وب</Text>
            </View>
          </Button>
        </View>

        <View style={styles.footer}>
          <Link href="/login" asChild>
            <Pressable accessibilityRole="link">
              <Text style={styles.footerLink}>بازگشت به ورود</Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
