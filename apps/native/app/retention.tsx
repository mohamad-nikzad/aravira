import * as React from 'react';
import { Alert, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowRight, CalendarPlus, Check, Phone, X } from 'lucide-react-native';
import type { FollowUpReason, FollowUpStatus, RetentionItem } from '@repo/salon-core/types';
import { displayPhone } from '@repo/salon-core/phone';
import { toPersianDigits } from '@repo/salon-core/persian-digits';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { Spinner } from '../components/ui/spinner';
import { useAuth } from '../components/auth-provider';
import { retentionApi } from '../lib/api';
import { useAsyncResource } from '../lib/hooks/use-async-resource';
import { useTheme, useThemeStyles, withAlpha } from '../theme';

function reasonLabel(reason: FollowUpReason): string {
  switch (reason) {
    case 'inactive':
      return 'مراجعه قدیمی';
    case 'no-show':
      return 'غیبت';
    case 'new-client':
      return 'بدون نوبت دوم';
    case 'vip':
      return 'ارزشمند';
    case 'manual':
      return 'دستی';
    default:
      return reason;
  }
}

function callPhone(phone: string | null | undefined) {
  if (!phone) return;
  const url = `tel:${phone}`;
  void Linking.canOpenURL(url).then((can) => {
    if (can) Linking.openURL(url);
    else Alert.alert('شماره در دسترس نیست');
  });
}

export default function RetentionScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { theme } = useTheme();
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const key = user?.role === 'manager' ? 'retention' : null;
  const { data, error, loading, reload } = useAsyncResource<{ items: RetentionItem[] }>(
    key,
    (signal) => retentionApi.list({ signal })
  );

  const styles = useThemeStyles((t) => ({
    safe: { backgroundColor: t.colors.background, flex: 1 },
    header: {
      borderBottomColor: withAlpha(t.colors.border, 0.5),
      backgroundColor: t.colors.card,
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      gap: t.spacing.lg,
      borderBottomWidth: t.sizes.hairline,
      paddingHorizontal: t.spacing.lg,
      paddingVertical: t.spacing.lg,
    },
    backButton: {
      height: t.sizes.avatarMd,
      width: t.sizes.avatarMd,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderRadius: t.radius.full,
    },
    headerBody: { flex: 1, gap: t.spacing.xs, minWidth: 0 },
    headerTitle: {
      color: t.colors.foreground,
      fontSize: t.fontSize.xl,
      fontFamily: t.fonts.sansBold,
    },
    headerHint: {
      color: t.colors.mutedForeground,
      fontSize: t.fontSize.xs,
      fontFamily: t.fonts.sans,
      lineHeight: 18,
    },
    scroll: { padding: t.spacing.xl, gap: t.spacing.lg },
    empty: {
      paddingVertical: t.spacing['4xl'],
      alignItems: 'center' as const,
    },
    emptyText: { color: t.colors.mutedForeground, fontFamily: t.fonts.sans },
    errorBox: {
      padding: t.spacing.lg,
      borderRadius: t.radius.md,
      backgroundColor: withAlpha(t.colors.destructive, 0.08),
    },
    errorText: { color: t.colors.destructive, fontFamily: t.fonts.sans },
    card: { gap: t.spacing.md, padding: t.spacing.lg },
    cardHeaderRow: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      justifyContent: 'space-between' as const,
      gap: t.spacing.md,
    },
    name: {
      color: t.colors.foreground,
      fontSize: t.fontSize.base,
      fontFamily: t.fonts.sansSemiBold,
    },
    phone: {
      color: t.colors.mutedForeground,
      fontSize: t.fontSize.xs,
      fontFamily: t.fonts.sans,
      flexDirection: 'row' as const,
    },
    suggested: {
      color: t.colors.mutedForeground,
      fontSize: t.fontSize.sm,
      fontFamily: t.fonts.sans,
    },
    statsGrid: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: t.spacing.md,
    },
    statCell: { minWidth: 80, gap: t.spacing.xs / 2 },
    statHint: {
      color: t.colors.mutedForeground,
      fontSize: 10,
      fontFamily: t.fonts.sans,
    },
    statValue: {
      color: t.colors.foreground,
      fontSize: t.fontSize.sm,
      fontFamily: t.fonts.sansMedium,
    },
    actionsRow: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: t.spacing.sm,
      alignItems: 'center' as const,
    },
    smallBtn: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: t.spacing.xs,
    },
    btnLabel: { fontSize: t.fontSize.sm, fontFamily: t.fonts.sansMedium },
    profileLink: {
      color: t.colors.primary,
      fontFamily: t.fonts.sansMedium,
      fontSize: t.fontSize.sm,
      paddingHorizontal: t.spacing.sm,
    },
  }));

  const updateStatus = async (id: string, status: FollowUpStatus) => {
    setBusyId(id);
    try {
      await retentionApi.updateStatus(id, status);
      reload();
    } catch {
      Alert.alert('به‌روزرسانی پیگیری انجام نشد.');
    } finally {
      setBusyId(null);
    }
  };

  if (!user || user.role !== 'manager') return null;

  const items = data?.items ?? [];

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
        <View style={styles.headerBody}>
          <Text style={styles.headerTitle}>پیگیری مشتریان</Text>
          <Text style={styles.headerHint}>
            لیست بر اساس داده واقعی نوبت‌ها ساخته می‌شود؛ پیام خودکار ارسال نمی‌شود.
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} contentInsetAdjustmentBehavior="automatic">
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>دریافت صف پیگیری انجام نشد.</Text>
          </View>
        ) : null}

        {loading && !data ? (
          <>
            <Skeleton height={140} radius={12} />
            <Skeleton height={140} radius={12} />
          </>
        ) : items.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>موردی در صف نیست.</Text>
          </View>
        ) : (
          items.map((item) => {
            const busy = busyId === item.id;
            return (
              <Card key={item.id} style={styles.card}>
                <CardContent style={{ gap: theme.spacing.md, padding: 0 }}>
                  <View style={styles.cardHeaderRow}>
                    <View style={{ minWidth: 0, flex: 1, gap: theme.spacing.xs }}>
                      <Text style={styles.name}>{item.client.name}</Text>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: theme.spacing.xs,
                        }}>
                        <Phone
                          size={12}
                          color={theme.iconColors.muted}
                          strokeWidth={1.6}
                        />
                        <Text style={styles.phone as never}>{displayPhone(item.client.phone)}</Text>
                      </View>
                    </View>
                    <Badge variant="outline">{reasonLabel(item.reason)}</Badge>
                  </View>

                  <Text style={styles.suggested}>{item.suggestedReason}</Text>

                  <View style={styles.statsGrid}>
                    <View style={styles.statCell}>
                      <Text style={styles.statHint}>آخرین مراجعه</Text>
                      <Text style={styles.statValue}>
                        {item.lastVisitDate ? toPersianDigits(item.lastVisitDate) : '—'}
                      </Text>
                    </View>
                    <View style={styles.statCell}>
                      <Text style={styles.statHint}>آخرین خدمت</Text>
                      <Text style={styles.statValue}>{item.lastServiceName ?? '—'}</Text>
                    </View>
                    <View style={styles.statCell}>
                      <Text style={styles.statHint}>مراجعات</Text>
                      <Text style={styles.statValue}>{toPersianDigits(item.completedCount)}</Text>
                    </View>
                    <View style={styles.statCell}>
                      <Text style={styles.statHint}>غیبت</Text>
                      <Text style={styles.statValue}>{toPersianDigits(item.noShowCount)}</Text>
                    </View>
                  </View>

                  <View style={styles.actionsRow}>
                    {item.client.phone ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onPress={() => callPhone(item.client.phone)}
                        style={styles.smallBtn}>
                        <Phone
                          size={theme.sizes.iconSm}
                          color={theme.colors.foreground}
                          strokeWidth={1.8}
                        />
                        <Text style={[styles.btnLabel, { color: theme.colors.foreground }]}>
                          تماس
                        </Text>
                      </Button>
                    ) : null}
                    <Button
                      size="sm"
                      variant="secondary"
                      onPress={() =>
                        router.push({
                          pathname: '/(tabs)/calendar',
                          params: { clientId: item.client.id },
                        } as never)
                      }
                      style={styles.smallBtn}>
                      <CalendarPlus
                        size={theme.sizes.iconSm}
                        color={theme.colors.secondaryForeground}
                        strokeWidth={1.8}
                      />
                      <Text
                        style={[styles.btnLabel, { color: theme.colors.secondaryForeground }]}>
                        نوبت
                      </Text>
                    </Button>
                    <Button
                      size="sm"
                      disabled={busy}
                      onPress={() => void updateStatus(item.id, 'reviewed')}
                      style={styles.smallBtn}>
                      {busy ? (
                        <Spinner color={theme.colors.primaryForeground} />
                      ) : (
                        <>
                          <Check
                            size={theme.sizes.iconSm}
                            color={theme.colors.primaryForeground}
                            strokeWidth={1.8}
                          />
                          <Text style={[styles.btnLabel, { color: theme.colors.primaryForeground }]}>
                            بررسی شد
                          </Text>
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busy}
                      onPress={() => void updateStatus(item.id, 'dismissed')}
                      style={styles.smallBtn}>
                      <X
                        size={theme.sizes.iconSm}
                        color={theme.colors.mutedForeground}
                        strokeWidth={1.8}
                      />
                      <Text style={[styles.btnLabel, { color: theme.colors.mutedForeground }]}>
                        رد
                      </Text>
                    </Button>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() =>
                        router.push(`/clients/${item.client.id}` as never)
                      }>
                      <Text style={styles.profileLink}>پروفایل</Text>
                    </Pressable>
                  </View>
                </CardContent>
              </Card>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
