import * as React from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowRight,
  Bell,
  Check,
  Clock3,
  Globe,
  MapPin,
  RotateCcw,
  Scissors,
  Users,
} from 'lucide-react-native';
import { ApiError, NetworkError } from '@repo/api-client';
import type { OnboardingAction, OnboardingStatus } from '@repo/api-client';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { Spinner } from '../components/ui/spinner';
import { onboardingApi } from '../lib/api';
import { useAsyncResource } from '../lib/hooks/use-async-resource';
import { useTheme, useThemeStyles, withAlpha } from '../theme';

type StepKey = keyof OnboardingStatus['steps'];

type StepDef = {
  key: StepKey;
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  required: boolean;
  cta?: { label: string; route: string };
};

const STEPS: StepDef[] = [
  {
    key: 'businessHoursSet',
    title: 'ساعات کاری',
    description: 'ساعت شروع، پایان و بازه نوبت‌ها را مشخص کنید.',
    icon: Clock3,
    required: false,
    cta: { label: 'تنظیم ساعات کاری', route: '/business-hours' },
  },
  {
    key: 'servicesAdded',
    title: 'اولین خدمت',
    description: 'حداقل یک خدمت برای رزرو و تقویم لازم است.',
    icon: Scissors,
    required: true,
    cta: { label: 'افزودن خدمت', route: '/(tabs)/settings' },
  },
  {
    key: 'staffAdded',
    title: 'اولین پرسنل',
    description: 'حداقل یک پرسنل برای اختصاص نوبت لازم است.',
    icon: Users,
    required: true,
    cta: { label: 'مدیریت پرسنل', route: '/staff' },
  },
  {
    key: 'presenceSet',
    title: 'آدرس و شبکه‌های اجتماعی',
    description: 'آدرس، نقشه و راه‌های تماس را وارد کنید تا مشتری‌ها سالن را پیدا کنند.',
    icon: MapPin,
    required: false,
    cta: { label: 'تنظیم حضور سالن', route: '/(tabs)/settings' },
  },
  {
    key: 'publicPageConfigured',
    title: 'صفحه عمومی',
    description: 'صفحه رزرو آنلاین سالن را فعال کنید.',
    icon: Globe,
    required: false,
    cta: { label: 'تنظیم صفحه عمومی', route: '/(tabs)/settings' },
  },
  {
    key: 'notificationsConfigured',
    title: 'اعلان‌ها',
    description: 'کانال دریافت اعلان نوبت‌ها را تنظیم کنید.',
    icon: Bell,
    required: false,
    cta: { label: 'تنظیم اعلان‌ها', route: '/(tabs)/settings' },
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { data, loading, reload } = useAsyncResource('onboarding', (signal) =>
    onboardingApi.get({ signal })
  );
  const [pending, setPending] = React.useState<OnboardingAction | null>(null);

  const onboarding = data?.onboarding;

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
    headerTitle: {
      color: t.colors.foreground,
      fontSize: t.fontSize.xl,
      fontFamily: t.fonts.sansBold,
    },
    backButton: {
      height: t.sizes.avatarMd,
      width: t.sizes.avatarMd,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderRadius: t.radius.full,
    },
    scroll: { padding: t.spacing.xl, gap: t.spacing.xl },
    statusCard: { gap: t.spacing.lg, padding: t.spacing.xl },
    statusTitle: {
      color: t.colors.foreground,
      fontSize: t.fontSize.lg,
      fontFamily: t.fonts.sansBold,
    },
    statusBody: {
      color: t.colors.mutedForeground,
      fontSize: t.fontSize.sm,
      fontFamily: t.fonts.sans,
      lineHeight: 22,
    },
    stepCard: { gap: t.spacing.md, padding: t.spacing.xl },
    stepHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: t.spacing.md,
    },
    stepIcon: {
      width: 36,
      height: 36,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderRadius: t.radius.md,
    },
    stepBody: { flex: 1, minWidth: 0 },
    stepTitleRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: t.spacing.sm,
    },
    stepTitle: {
      color: t.colors.foreground,
      fontSize: t.fontSize.base,
      fontFamily: t.fonts.sansBold,
    },
    stepDesc: {
      color: t.colors.mutedForeground,
      fontSize: t.fontSize.sm,
      fontFamily: t.fonts.sans,
      marginTop: t.spacing.xs,
    },
    badge: { paddingHorizontal: t.spacing.sm, paddingVertical: 0 },
    btnText: {
      color: t.colors.primaryForeground,
      fontSize: t.fontSize.sm,
      fontFamily: t.fonts.sansSemiBold,
    },
    btnTextOutline: {
      color: t.colors.foreground,
      fontSize: t.fontSize.sm,
      fontFamily: t.fonts.sansSemiBold,
    },
    completedBanner: {
      backgroundColor: withAlpha(theme.colors.primary, 0.1),
      gap: t.spacing.md,
      padding: t.spacing.xl,
      borderRadius: t.radius.lg,
    },
  }));

  const runAction = React.useCallback(
    async (action: OnboardingAction) => {
      setPending(action);
      try {
        await onboardingApi.update(action);
        reload();
      } catch (err) {
        const message =
          err instanceof ApiError || err instanceof NetworkError
            ? err.message
            : 'انجام عملیات ممکن نشد.';
        Alert.alert('خطا', message);
      } finally {
        setPending(null);
      }
    },
    [reload]
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="بازگشت"
          onPress={() => router.back()}
          style={styles.backButton}>
          <ArrowRight
            size={theme.sizes.iconSm + 2}
            color={theme.colors.foreground}
            strokeWidth={1.8}
          />
        </Pressable>
        <Text style={styles.headerTitle}>راه‌اندازی سالن</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {loading && !data ? (
          <>
            <Skeleton height={120} width="100%" radius={16} />
            <Skeleton height={80} width="100%" radius={16} />
            <Skeleton height={80} width="100%" radius={16} />
          </>
        ) : !onboarding ? (
          <Text style={styles.statusBody}>اطلاعات راه‌اندازی بارگیری نشد.</Text>
        ) : (
          <>
            <Card style={styles.statusCard}>
              <Text style={styles.statusTitle}>{onboarding.salon?.name ?? 'سالن شما'}</Text>
              <Text style={styles.statusBody}>
                مراحل زیر را تکمیل کنید تا سالن آماده دریافت نوبت شود. می‌توانید بعد از تکمیل هر
                زمان آن را دوباره باز کنید.
              </Text>
              {onboarding.completedAt ? (
                <View style={styles.completedBanner}>
                  <Text style={styles.statusTitle}>راه‌اندازی تکمیل شده</Text>
                  <Button
                    variant="outline"
                    onPress={() => runAction('reopen')}
                    disabled={pending !== null}>
                    {pending === 'reopen' ? (
                      <Spinner color={theme.colors.foreground} />
                    ) : (
                      <View style={styles.stepHeader}>
                        <RotateCcw
                          size={theme.sizes.iconSm}
                          color={theme.colors.foreground}
                          strokeWidth={1.8}
                        />
                        <Text style={styles.btnTextOutline}>باز کردن دوباره</Text>
                      </View>
                    )}
                  </Button>
                </View>
              ) : null}
            </Card>

            {STEPS.map((step) => {
              const Icon = step.icon;
              const done = onboarding.steps[step.key];
              return (
                <Card key={step.key} style={styles.stepCard}>
                  <View style={styles.stepHeader}>
                    <View
                      style={[
                        styles.stepIcon,
                        {
                          backgroundColor: done
                            ? withAlpha(theme.colors.primary, 0.12)
                            : withAlpha(theme.colors.mutedForeground, 0.1),
                        },
                      ]}>
                      {done ? (
                        <Check
                          size={theme.sizes.iconSm}
                          color={theme.colors.primary}
                          strokeWidth={2}
                        />
                      ) : (
                        <Icon
                          size={theme.sizes.iconSm}
                          color={theme.colors.foreground}
                          strokeWidth={1.8}
                        />
                      )}
                    </View>
                    <View style={styles.stepBody}>
                      <View style={styles.stepTitleRow}>
                        <Text style={styles.stepTitle}>{step.title}</Text>
                        {step.required && !done ? (
                          <Badge variant="destructive" style={styles.badge}>
                            ضروری
                          </Badge>
                        ) : null}
                      </View>
                      <Text style={styles.stepDesc}>{step.description}</Text>
                    </View>
                  </View>

                  {step.cta ? (
                    <Button variant="outline" onPress={() => router.push(step.cta!.route as never)}>
                      <Text style={styles.btnTextOutline}>{step.cta.label}</Text>
                    </Button>
                  ) : null}
                </Card>
              );
            })}

            {!onboarding.completedAt ? (
              <Button onPress={() => runAction('complete')} disabled={pending !== null}>
                {pending === 'complete' ? (
                  <Spinner color={theme.colors.primaryForeground} />
                ) : (
                  <Text style={styles.btnText}>تکمیل راه‌اندازی</Text>
                )}
              </Button>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
