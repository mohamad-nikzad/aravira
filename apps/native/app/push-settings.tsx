import * as React from 'react';
import { Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowRight, Bell, BellRing, MessageSquareOff } from 'lucide-react-native';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useAuth } from '../components/auth-provider';
import { notificationPreferencesApi } from '../lib/api';
import { useAsyncResource } from '../lib/hooks/use-async-resource';
import { useTheme, useThemeStyles, withAlpha } from '../theme';

export default function PushSettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [savingKey, setSavingKey] = React.useState<'appointment' | 'local' | null>(null);
  const prefsResource = useAsyncResource(
    user ? `notification-preferences:${user.id}` : null,
    (signal) => notificationPreferencesApi.get({ signal }),
    [user?.id]
  );
  const preferences = prefsResource.data?.preferences;

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
      paddingVertical: t.spacing.xs,
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
    disabledPill: {
      borderColor: withAlpha(t.colors.border, 0.8),
      borderRadius: t.radius.full,
      borderWidth: t.sizes.hairline,
      paddingHorizontal: t.spacing.md,
      paddingVertical: t.spacing.xs,
    },
    disabledPillText: {
      color: t.colors.mutedForeground,
      fontFamily: t.fonts.sansMedium,
      fontSize: t.fontSize.xs,
    },
    inlineTitle: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: t.spacing.sm,
    },
  }));

  const updatePreference = async (
    key: 'appointmentAlertsEnabled' | 'localAlertsEnabled',
    next: boolean
  ) => {
    setSavingKey(key === 'appointmentAlertsEnabled' ? 'appointment' : 'local');
    try {
      await notificationPreferencesApi.update({ [key]: next });
      prefsResource.reload();
    } catch {
      prefsResource.reload();
    } finally {
      setSavingKey(null);
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
          <Text style={styles.hint}>تنظیم کانال‌های واقعی اعلان برای حساب شما</Text>
        </View>
      </View>

      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.scroll}>
        <Card style={styles.card}>
          <CardHeader style={styles.cardHeaderPad}>
            <View style={styles.inlineTitle}>
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
                  نوبت‌های جدید در صندوق اعلان‌ها ذخیره و برای شما نمایش داده شوند.
                </Text>
              </View>
              <Switch
                value={Boolean(preferences?.appointmentAlertsEnabled)}
                onValueChange={(next) => {
                  void updatePreference('appointmentAlertsEnabled', next);
                }}
                disabled={prefsResource.loading || savingKey === 'appointment'}
              />
            </View>
            <View style={styles.row}>
              <View style={styles.rowBody}>
                <Text style={styles.label}>اعلان محلی دستگاه</Text>
                <Text style={styles.description}>
                  پس از همگام‌سازی، اعلان‌های خوانده‌نشده می‌توانند روی همین دستگاه هشدار بدهند.
                </Text>
              </View>
              <Switch
                value={Boolean(preferences?.localAlertsEnabled)}
                onValueChange={(next) => {
                  void updatePreference('localAlertsEnabled', next);
                }}
                disabled={prefsResource.loading || savingKey === 'local'}
              />
            </View>
          </CardContent>
        </Card>

        <Card style={styles.card}>
          <CardHeader style={styles.cardHeaderPad}>
            <View style={styles.inlineTitle}>
              <BellRing
                size={theme.sizes.iconSm}
                color={theme.colors.mutedForeground}
                strokeWidth={1.6}
              />
              <CardTitle color="mutedForeground" variant="label" weight="medium">
                کانال‌ها
              </CardTitle>
            </View>
          </CardHeader>
          <CardContent style={{ padding: 0, gap: 12 }}>
            <View style={styles.row}>
              <View style={styles.rowBody}>
                <Text style={styles.label}>اعلان داخل برنامه</Text>
                <Text style={styles.description}>
                  همیشه فعال است و اعلان‌ها را در صندوق نگه می‌دارد.
                </Text>
              </View>
              <View style={styles.disabledPill}>
                <Text style={styles.disabledPillText}>فعال</Text>
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.rowBody}>
                <View style={styles.inlineTitle}>
                  <MessageSquareOff
                    size={theme.sizes.iconSm}
                    color={theme.iconColors.muted}
                    strokeWidth={1.8}
                  />
                  <Text style={styles.label}>پیامک</Text>
                </View>
                <Text style={styles.description}>پس از انتخاب ارائه‌دهنده پیامک فعال می‌شود.</Text>
              </View>
              <View style={styles.disabledPill}>
                <Text style={styles.disabledPillText}>به‌زودی</Text>
              </View>
            </View>
          </CardContent>
        </Card>

        <Card style={styles.card}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/notifications' as never)}
            style={styles.row}>
            <View style={styles.rowBody}>
              <Text style={styles.label}>صندوق اعلان‌ها</Text>
              <Text style={styles.description}>اعلان‌های خوانده‌نشده و اخیر را ببینید.</Text>
            </View>
            <ArrowRight
              size={theme.sizes.iconSm + 2}
              color={theme.iconColors.muted}
              strokeWidth={1.8}
            />
          </Pressable>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
