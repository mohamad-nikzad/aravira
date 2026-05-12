import * as React from 'react';
import { Linking, Platform, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrowRight, Bell, Settings as SettingsIcon } from 'lucide-react-native';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useAuth } from '../components/auth-provider';
import { useTheme, useThemeStyles, withAlpha } from '../theme';

const PUSH_PREF_KEY = 'native:push-enabled';

export default function PushSettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [enabled, setEnabled] = React.useState(false);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    void AsyncStorage.getItem(PUSH_PREF_KEY).then((value) => {
      if (cancelled) return;
      setEnabled(value === '1');
      setHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const styles = useThemeStyles((t) => ({
    safe: { backgroundColor: t.colors.background, flex: 1 },
    header: {
      borderBottomColor: withAlpha(t.colors.border, 0.5),
      backgroundColor: t.colors.card,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: t.spacing.lg,
      borderBottomWidth: t.sizes.hairline,
      paddingHorizontal: t.spacing.lg,
      paddingVertical: t.spacing.lg,
    },
    backBtn: {
      height: t.sizes.avatarMd,
      width: t.sizes.avatarMd,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderRadius: t.radius.xl,
    },
    title: { color: t.colors.foreground, fontSize: t.fontSize.xl, fontFamily: t.fonts.sansBold },
    hint: {
      color: t.colors.mutedForeground,
      fontSize: t.fontSize.sm,
      fontFamily: t.fonts.sans,
    },
    scroll: { padding: t.spacing.lg, gap: t.spacing.lg },
    card: { gap: t.spacing.md, padding: t.spacing.lg },
    cardHeaderPad: { padding: 0 },
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      gap: t.spacing.md,
    },
    rowBody: { flex: 1, gap: t.spacing.xs },
    label: {
      color: t.colors.foreground,
      fontSize: t.fontSize.base,
      fontFamily: t.fonts.sansMedium,
    },
    description: {
      color: t.colors.mutedForeground,
      fontSize: t.fontSize.sm,
      fontFamily: t.fonts.sans,
    },
    osRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: t.spacing.md,
      paddingVertical: t.spacing.md,
    },
    osText: {
      color: t.colors.foreground,
      fontFamily: t.fonts.sansMedium,
      fontSize: t.fontSize.base,
    },
  }));

  const handleToggle = async (next: boolean) => {
    setEnabled(next);
    try {
      await AsyncStorage.setItem(PUSH_PREF_KEY, next ? '1' : '0');
    } catch {
      /* persist best-effort */
    }
  };

  const openOsSettings = () => {
    if (Platform.OS === 'ios') {
      void Linking.openURL('app-settings:');
    } else {
      void Linking.openSettings();
    }
  };

  if (!user) return null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="بازگشت" onPress={() => router.back()} style={styles.backBtn}>
          <ArrowRight size={theme.sizes.iconMd} color={theme.colors.primary} strokeWidth={1.8} />
        </Pressable>
        <View>
          <Text style={styles.title}>اعلان‌ها</Text>
          <Text style={styles.hint}>دریافت اعلان نوبت‌های جدید روی این دستگاه</Text>
        </View>
      </View>

      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.scroll}>
        <Card style={styles.card}>
          <CardHeader style={styles.cardHeaderPad}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Bell
                size={theme.sizes.iconSm}
                color={theme.colors.mutedForeground}
                strokeWidth={1.6}
              />
              <CardTitle color="mutedForeground" variant="label" weight="medium">
                اعلان‌های نوبت
              </CardTitle>
            </View>
          </CardHeader>
          <CardContent style={{ padding: 0, gap: 12 }}>
            <View style={styles.row}>
              <View style={styles.rowBody}>
                <Text style={styles.label}>اعلان نوبت‌های جدید</Text>
                <Text style={styles.description}>
                  وقتی نوبت جدیدی ثبت می‌شود، روی این دستگاه به شما اطلاع دهیم.
                </Text>
              </View>
              <Switch value={enabled} onValueChange={handleToggle} disabled={!hydrated} />
            </View>
          </CardContent>
        </Card>

        <Card style={styles.card}>
          <Pressable accessibilityRole="button" onPress={openOsSettings} style={styles.osRow}>
            <SettingsIcon
              size={theme.sizes.iconSm + 2}
              color={theme.iconColors.muted}
              strokeWidth={1.8}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.osText}>تنظیمات سیستم</Text>
              <Text style={styles.description}>
                برای فعال‌سازی نهایی اعلان‌ها، دسترسی Notification را در تنظیمات دستگاه بررسی کنید.
              </Text>
            </View>
          </Pressable>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
