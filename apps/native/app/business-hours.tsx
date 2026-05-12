import * as React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ApiError, NetworkError } from '@repo/api-client';
import {
  businessSettingsSchema,
  type BusinessSettingsPayload,
} from '@repo/salon-core/forms/settings';
import { parseLocalizedInt, toPersianDigits } from '@repo/salon-core/persian-digits';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Spinner } from '../components/ui/spinner';
import { TimePicker } from '../components/ui/time-picker';
import { FormRootError } from '../components/ui/form-field';
import { businessSettingsApi } from '../lib/api';
import { useAsyncResource } from '../lib/hooks/use-async-resource';
import { useTheme, useThemeStyles, withAlpha } from '../theme';

export default function BusinessHoursScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { data, loading } = useAsyncResource('business-settings', (signal) =>
    businessSettingsApi.get({ signal })
  );

  const {
    handleSubmit,
    reset,
    setError,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<BusinessSettingsPayload>({
    resolver: zodResolver(businessSettingsSchema),
    defaultValues: {
      workingStart: '09:00',
      workingEnd: '19:00',
      slotDurationMinutes: 30,
    },
  });

  React.useEffect(() => {
    if (data?.settings) reset(data.settings);
  }, [data, reset]);

  const workingStart = watch('workingStart') ?? '09:00';
  const workingEnd = watch('workingEnd') ?? '19:00';
  const slotMin = watch('slotDurationMinutes') ?? 30;

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
    card: { gap: t.spacing.lg, padding: t.spacing.xl },
    row: {
      flexDirection: 'row' as const,
      gap: t.spacing.lg,
    },
    field: { flex: 1, gap: t.spacing.md },
    submitText: {
      fontSize: t.fontSize.base,
      color: t.colors.primaryForeground,
      fontFamily: t.fonts.sansSemiBold,
    },
    error: {
      fontSize: t.fontSize.sm,
      color: t.colors.destructive,
      fontFamily: t.fonts.sans,
    },
  }));

  const onSubmit = handleSubmit(async (values) => {
    try {
      const result = await businessSettingsApi.update(values);
      reset(result.settings);
    } catch (err) {
      const message =
        err instanceof ApiError || err instanceof NetworkError
          ? err.message
          : 'ذخیره ساعات کاری انجام نشد.';
      setError('root', { message });
    }
  });

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
        <Text style={styles.headerTitle}>ساعات کاری</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Card style={styles.card}>
          <View style={styles.row}>
            <View style={styles.field}>
              <Label>شروع</Label>
              <TimePicker
                value={workingStart}
                onChange={(v) => setValue('workingStart', v)}
                label="ساعت شروع"
              />
              {errors.workingStart ? (
                <Text style={styles.error}>{errors.workingStart.message}</Text>
              ) : null}
            </View>
            <View style={styles.field}>
              <Label>پایان</Label>
              <TimePicker
                value={workingEnd}
                onChange={(v) => setValue('workingEnd', v)}
                label="ساعت پایان"
              />
              {errors.workingEnd ? (
                <Text style={styles.error}>{errors.workingEnd.message}</Text>
              ) : null}
            </View>
          </View>

          <View style={styles.field}>
            <Label>فاصله اسلات (دقیقه)</Label>
            <Input
              value={toPersianDigits(slotMin)}
              onChangeText={(text) =>
                setValue('slotDurationMinutes', Math.max(5, parseLocalizedInt(text, slotMin)))
              }
              keyboardType="number-pad"
            />
            {errors.slotDurationMinutes ? (
              <Text style={styles.error}>{errors.slotDurationMinutes.message}</Text>
            ) : null}
          </View>

          <FormRootError message={errors.root?.message} />

          <Button onPress={onSubmit} disabled={isSubmitting || loading}>
            {isSubmitting ? (
              <Spinner color={theme.colors.primaryForeground} />
            ) : (
              <Text style={styles.submitText}>ذخیره ساعات کاری</Text>
            )}
          </Button>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
