import * as React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowRight,
  Banknote,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  Scissors,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react-native';
import type { DashboardData } from '@repo/api-client';
import { APPOINTMENT_STATUS } from '@repo/salon-core/types';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { useAuth } from '../components/auth-provider';
import { dashboardApi } from '../lib/api';
import { useAsyncResource } from '../lib/hooks/use-async-resource';
import { getAppointmentStatusTheme, useTheme, useThemeStyles, withAlpha } from '../theme';

const numFmt = new Intl.NumberFormat('fa-IR');
function formatNumber(n: number) {
  return numFmt.format(n);
}
function formatPrice(n: number) {
  return `${numFmt.format(n)} تومان`;
}

const BAR_COLORS = ['#0d9488', '#22c55e', '#f59e0b', '#8b5cf6', '#f43f5e'];

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const styles = useThemeStyles((t) => ({
    track: {
      width: '100%' as const,
      height: 8,
      borderRadius: t.radius.full,
      backgroundColor: t.colors.muted,
      overflow: 'hidden' as const,
    },
    fill: { height: 8, borderRadius: t.radius.full },
  }));
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${pct}%`, backgroundColor: color }]} />
    </View>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  subtitle,
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  subtitle?: string;
}) {
  const { theme } = useTheme();
  const styles = useThemeStyles((t) => ({
    card: { padding: t.spacing.lg },
    row: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      justifyContent: 'space-between' as const,
      gap: t.spacing.md,
    },
    body: { minWidth: 0, flex: 1, gap: t.spacing.xs },
    title: {
      color: t.colors.mutedForeground,
      fontSize: t.fontSize.xs,
      fontFamily: t.fonts.sansMedium,
    },
    value: {
      color: t.colors.foreground,
      fontSize: t.fontSize.xl,
      fontFamily: t.fonts.sansBold,
    },
    subtitle: {
      color: t.colors.mutedForeground,
      fontSize: t.fontSize.xs,
      fontFamily: t.fonts.sans,
    },
    iconWrap: {
      borderRadius: t.radius.lg,
      backgroundColor: withAlpha(t.colors.primary, 0.1),
      padding: t.spacing.md,
    },
  }));
  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.value}>{value}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        <View style={styles.iconWrap}>
          <Icon size={theme.sizes.iconMd} color={theme.colors.primary} strokeWidth={1.8} />
        </View>
      </View>
    </Card>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useTheme();
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
    headerTitle: {
      color: t.colors.foreground,
      fontSize: t.fontSize.xl,
      fontFamily: t.fonts.sansBold,
    },
    headerHint: {
      color: t.colors.mutedForeground,
      fontSize: t.fontSize.sm,
      fontFamily: t.fonts.sans,
    },
    scroll: { padding: t.spacing.lg, gap: t.spacing.lg },
    grid: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: t.spacing.md,
    },
    statCell: { flexBasis: '47%' as const, flexGrow: 1 },
    card: { gap: t.spacing.md, padding: t.spacing.lg },
    cardHeader: { padding: 0 },
    cardContent: { gap: t.spacing.md, padding: 0 },
    titleRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: t.spacing.xs,
    },
    statusRow: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: t.spacing.sm,
    },
    statusBadge: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: t.spacing.xs,
      paddingHorizontal: t.spacing.md,
      paddingVertical: t.spacing.xs,
      borderRadius: t.radius.full,
      borderWidth: t.sizes.hairline,
    },
    statusCount: { fontFamily: t.fonts.sansBold, fontSize: t.fontSize.sm },
    statusLabel: { fontFamily: t.fonts.sans, fontSize: t.fontSize.sm },
    progressRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      gap: t.spacing.sm,
    },
    progressLabel: {
      color: t.colors.foreground,
      fontSize: t.fontSize.sm,
      fontFamily: t.fonts.sans,
      flex: 1,
    },
    progressCount: {
      color: t.colors.mutedForeground,
      fontSize: t.fontSize.xs,
      fontFamily: t.fonts.sans,
    },
    monthBar: {
      height: 12,
      width: '100%' as const,
      borderRadius: t.radius.full,
      overflow: 'hidden' as const,
      flexDirection: 'row' as const,
      backgroundColor: t.colors.muted,
    },
    monthLegend: {
      marginTop: t.spacing.sm,
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: t.spacing.md,
    },
    legendItem: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: t.spacing.xs,
    },
    legendSwatch: { width: 10, height: 10, borderRadius: 5 },
    legendLabel: {
      color: t.colors.mutedForeground,
      fontSize: t.fontSize.xs,
      fontFamily: t.fonts.sans,
    },
    legendCount: {
      color: t.colors.foreground,
      fontSize: t.fontSize.xs,
      fontFamily: t.fonts.sansMedium,
    },
    skeletonGrid: { gap: t.spacing.md },
  }));

  const key = user?.role === 'manager' ? 'dashboard' : null;
  const { data, loading, error, reload } = useAsyncResource<DashboardData>(key, (signal) =>
    dashboardApi.get({ signal })
  );

  React.useEffect(() => {
    if (!key) return;
    const id = setInterval(reload, 60_000);
    return () => clearInterval(id);
  }, [key, reload]);

  if (!user || user.role !== 'manager') return null;

  const maxServiceCount = Math.max(...(data?.popularServices.map((s) => s.count) ?? []), 1);
  const maxStaffCount = Math.max(...(data?.staffLoad.map((s) => s.count) ?? []), 1);
  const monthTotal = (data?.monthStatusBreakdown ?? []).reduce((s, i) => s + i.count, 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="بازگشت" onPress={() => router.back()} style={styles.backBtn}>
          <ArrowRight size={theme.sizes.iconMd} color={theme.colors.primary} strokeWidth={1.8} />
        </Pressable>
        <View>
          <Text style={styles.headerTitle}>داشبورد</Text>
          <Text style={styles.headerHint}>آمار و گزارش‌های سالن</Text>
        </View>
      </View>

      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.scroll}>
        {!data && (loading || error) ? (
          <View style={styles.skeletonGrid}>
            <View style={styles.grid}>
              {[0, 1, 2, 3].map((i) => (
                <View key={i} style={styles.statCell}>
                  <Skeleton height={88} width="100%" radius={12} />
                </View>
              ))}
            </View>
            <Skeleton height={120} width="100%" radius={12} />
            <Skeleton height={160} width="100%" radius={12} />
          </View>
        ) : data ? (
          <>
            <View style={styles.grid}>
              <View style={styles.statCell}>
                <StatCard
                  title="نوبت‌های امروز"
                  value={formatNumber(data.todayAppointments)}
                  icon={CalendarCheck}
                />
              </View>
              <View style={styles.statCell}>
                <StatCard
                  title="نوبت‌های هفته"
                  value={formatNumber(data.weekAppointments)}
                  icon={CalendarClock}
                />
              </View>
              <View style={styles.statCell}>
                <StatCard
                  title="نوبت‌های ماه"
                  value={formatNumber(data.monthAppointments)}
                  icon={CalendarDays}
                />
              </View>
              <View style={styles.statCell}>
                <StatCard
                  title="درآمد ماه"
                  value={formatPrice(data.monthRevenue)}
                  icon={Banknote}
                  subtitle="نوبت‌های انجام‌شده"
                />
              </View>
              <View style={styles.statCell}>
                <StatCard
                  title="کل مشتریان"
                  value={formatNumber(data.totalClients)}
                  icon={Users}
                  subtitle={
                    data.newClientsThisMonth > 0
                      ? `${formatNumber(data.newClientsThisMonth)} مشتری جدید این ماه`
                      : undefined
                  }
                />
              </View>
              <View style={styles.statCell}>
                <StatCard
                  title="پرسنل فعال"
                  value={formatNumber(data.totalStaff)}
                  icon={UserPlus}
                />
              </View>
            </View>

            {data.todayStatusBreakdown.length > 0 ? (
              <Card style={styles.card}>
                <CardHeader style={styles.cardHeader}>
                  <CardTitle color="mutedForeground" variant="label" weight="medium">
                    وضعیت نوبت‌های امروز
                  </CardTitle>
                </CardHeader>
                <View style={styles.statusRow}>
                  {data.todayStatusBreakdown.map((item) => {
                    const def = APPOINTMENT_STATUS[item.status as keyof typeof APPOINTMENT_STATUS];
                    const themed = getAppointmentStatusTheme(item.status);
                    return (
                      <View
                        key={item.status}
                        style={[
                          styles.statusBadge,
                          { backgroundColor: themed.background, borderColor: themed.border },
                        ]}>
                        <Text style={[styles.statusCount, { color: themed.foreground }]}>
                          {formatNumber(item.count)}
                        </Text>
                        <Text style={[styles.statusLabel, { color: themed.foreground }]}>
                          {def?.label ?? item.status}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </Card>
            ) : null}

            {data.popularServices.length > 0 ? (
              <Card style={styles.card}>
                <CardHeader style={styles.cardHeader}>
                  <View style={styles.titleRow}>
                    <Scissors
                      size={theme.sizes.iconSm}
                      color={theme.colors.mutedForeground}
                      strokeWidth={1.6}
                    />
                    <CardTitle color="mutedForeground" variant="label" weight="medium">
                      پرطرفدارترین خدمات این ماه
                    </CardTitle>
                  </View>
                </CardHeader>
                <CardContent style={styles.cardContent}>
                  {data.popularServices.map((svc, i) => (
                    <View key={svc.name}>
                      <View style={styles.progressRow}>
                        <Text style={styles.progressLabel} numberOfLines={1}>
                          {svc.name}
                        </Text>
                        <Text style={styles.progressCount}>{formatNumber(svc.count)} نوبت</Text>
                      </View>
                      <ProgressBar
                        value={svc.count}
                        max={maxServiceCount}
                        color={BAR_COLORS[i % BAR_COLORS.length]}
                      />
                    </View>
                  ))}
                </CardContent>
              </Card>
            ) : null}

            {data.staffLoad.length > 0 ? (
              <Card style={styles.card}>
                <CardHeader style={styles.cardHeader}>
                  <View style={styles.titleRow}>
                    <TrendingUp
                      size={theme.sizes.iconSm}
                      color={theme.colors.mutedForeground}
                      strokeWidth={1.6}
                    />
                    <CardTitle color="mutedForeground" variant="label" weight="medium">
                      عملکرد پرسنل این ماه
                    </CardTitle>
                  </View>
                </CardHeader>
                <CardContent style={styles.cardContent}>
                  {data.staffLoad.map((s) => (
                    <View key={s.name}>
                      <View style={styles.progressRow}>
                        <Text style={styles.progressLabel} numberOfLines={1}>
                          {s.name}
                        </Text>
                        <Text style={styles.progressCount}>{formatNumber(s.count)} نوبت</Text>
                      </View>
                      <ProgressBar
                        value={s.count}
                        max={maxStaffCount}
                        color={theme.colors.primary}
                      />
                    </View>
                  ))}
                </CardContent>
              </Card>
            ) : null}

            {data.monthStatusBreakdown.length > 0 ? (
              <Card style={styles.card}>
                <CardHeader style={styles.cardHeader}>
                  <CardTitle color="mutedForeground" variant="label" weight="medium">
                    وضعیت کلی نوبت‌های ماه
                  </CardTitle>
                </CardHeader>
                <View style={styles.monthBar}>
                  {data.monthStatusBreakdown.map((item) => {
                    const themed = getAppointmentStatusTheme(item.status);
                    const pct = monthTotal > 0 ? (item.count / monthTotal) * 100 : 0;
                    return (
                      <View
                        key={item.status}
                        style={{ width: `${pct}%`, backgroundColor: themed.foreground }}
                      />
                    );
                  })}
                </View>
                <View style={styles.monthLegend}>
                  {data.monthStatusBreakdown.map((item) => {
                    const def = APPOINTMENT_STATUS[item.status as keyof typeof APPOINTMENT_STATUS];
                    const themed = getAppointmentStatusTheme(item.status);
                    return (
                      <View key={item.status} style={styles.legendItem}>
                        <View
                          style={[styles.legendSwatch, { backgroundColor: themed.foreground }]}
                        />
                        <Text style={styles.legendLabel}>{def?.label ?? item.status}</Text>
                        <Text style={styles.legendCount}>{formatNumber(item.count)}</Text>
                      </View>
                    );
                  })}
                </View>
              </Card>
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
