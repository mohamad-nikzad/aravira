import * as React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlertTriangle, CalendarDays, Clock, Users } from 'lucide-react-native';
import type { AppointmentWithDetails, TodayData, TodayAttentionItem } from '@repo/salon-core/types';
import { formatJalaliFullDate } from '@repo/salon-core/jalali';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { JalaliDatePicker } from '../ui/jalali-date-picker';
import {
  ACTIVE_STATUSES,
  ATTENTION_LABELS,
  AppointmentCard,
  StatCard,
  formatNumber,
  sortAppointments,
  summarizeOpenRanges,
} from './shared';
import { useTheme, useThemeStyles, withAlpha } from '../../theme';

type GroupedAttentionItem = {
  id: string;
  title: string;
  detail: string;
  clientId?: string;
  priority: number;
  labels: string[];
};

function groupAttentionItems(items: TodayAttentionItem[]) {
  const grouped = new Map<string, GroupedAttentionItem>();
  for (const item of items) {
    const key = item.appointmentId ?? item.clientId ?? item.id;
    const label = ATTENTION_LABELS[item.type];
    const existing = grouped.get(key);
    if (!existing) {
      grouped.set(key, {
        id: key,
        title: item.title,
        detail: item.detail,
        clientId: item.clientId,
        priority: item.priority,
        labels: [label],
      });
      continue;
    }
    if (!existing.labels.includes(label)) existing.labels.push(label);
    if (item.priority < existing.priority) {
      existing.priority = item.priority;
      existing.title = item.title;
      existing.detail = item.detail;
    }
  }
  return [...grouped.values()].sort((a, b) => a.priority - b.priority);
}

export function ManagerTodayView({
  date,
  setDate,
  data,
  isLoading,
}: {
  date: string;
  setDate: (date: string) => void;
  data?: TodayData;
  isLoading: boolean;
}) {
  const { theme } = useTheme();
  const styles = useThemeStyles((t) => ({
    safe: { backgroundColor: t.colors.background, flex: 1 },
    header: {
      borderBottomColor: withAlpha(t.colors.border, 0.5),
      backgroundColor: t.colors.card,
      borderBottomWidth: t.sizes.hairline,
      paddingHorizontal: t.spacing.xl,
      paddingVertical: t.spacing.lg,
    },
    headerRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: t.spacing.md,
    },
    headerTitle: {
      color: t.colors.foreground,
      fontSize: t.fontSize.xl,
      fontFamily: t.fonts.sansBold,
    },
    headerSubtitle: {
      color: t.colors.mutedForeground,
      fontSize: t.fontSize.sm,
      fontFamily: t.fonts.sans,
    },
    datePickerWrap: { marginTop: t.spacing.lg },
    scroll: { padding: t.spacing.xl, gap: t.spacing.xl },
    skelGap: { gap: t.spacing.lg },
    statRow: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: t.spacing.lg },
    statCell: { flexBasis: '47%' as const, flexGrow: 1 },
    statSkelCell: { minWidth: '45%' as const, flex: 1 },
    attentionCard: {
      backgroundColor: withAlpha(t.colors.accent, 0.4),
      borderColor: t.colors.ring,
      gap: t.spacing.lg,
      padding: t.spacing.xl,
    },
    sectionTitleRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: t.spacing.md,
    },
    sectionTitle: {
      color: t.colors.foreground,
      fontSize: t.fontSize.base,
      fontFamily: t.fonts.sansSemiBold,
    },
    attentionList: { gap: t.spacing.md },
    attentionItem: {
      borderColor: withAlpha(t.colors.border, 0.5),
      backgroundColor: withAlpha(t.colors.card, 0.85),
      gap: t.spacing.xs,
      borderRadius: t.radius.xl,
      borderWidth: t.sizes.hairline,
      padding: t.spacing.lg,
    },
    attentionRow: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      justifyContent: 'space-between' as const,
      gap: t.spacing.lg,
    },
    attentionBody: { minWidth: 0, flex: 1, gap: t.spacing.xs },
    attentionTitle: {
      color: t.colors.foreground,
      fontSize: t.fontSize.base,
      fontFamily: t.fonts.sansSemiBold,
    },
    attentionDetail: {
      color: t.colors.mutedForeground,
      fontSize: t.fontSize.sm,
      fontFamily: t.fonts.sans,
    },
    badgeRow: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      justifyContent: 'flex-end' as const,
      gap: t.spacing.xs,
    },
    badgeText: { fontSize: t.fontSize.xs },
    sectionCard: { gap: t.spacing.lg, padding: t.spacing.xl },
    list: { gap: t.spacing.lg },
    empty: {
      borderColor: withAlpha(t.colors.border, 0.7),
      alignItems: 'center' as const,
      borderRadius: t.radius.xl,
      borderWidth: t.sizes.hairline,
      borderStyle: 'dashed' as const,
      padding: t.spacing.xl,
    },
    emptyText: {
      color: t.colors.mutedForeground,
      fontSize: t.fontSize.base,
      fontFamily: t.fonts.sans,
    },
    teamContent: { gap: t.spacing.md, padding: 0 },
    teamEmpty: {
      color: t.colors.mutedForeground,
      fontSize: t.fontSize.base,
      fontFamily: t.fonts.sans,
    },
    teamRow: {
      borderColor: withAlpha(t.colors.border, 0.6),
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      gap: t.spacing.lg,
      borderRadius: t.radius.xl,
      borderWidth: t.sizes.hairline,
      padding: t.spacing.lg,
    },
    teamBody: { minWidth: 0, flex: 1, gap: t.spacing.xs },
    teamName: {
      color: t.colors.foreground,
      fontSize: t.fontSize.base,
      fontFamily: t.fonts.sansSemiBold,
    },
    teamMeta: {
      color: t.colors.mutedForeground,
      fontSize: t.fontSize.sm,
      fontFamily: t.fonts.sans,
    },
    teamBadgeWrap: { maxWidth: '52%' as const },
    teamBadgeText: { fontSize: t.fontSize.xs },
  }));

  const activeAppointments = React.useMemo(
    () =>
      data
        ? sortAppointments(
            data.appointments.filter((a: AppointmentWithDetails) => ACTIVE_STATUSES.has(a.status))
          )
        : [],
    [data]
  );

  const attentionItems = React.useMemo(
    () => (data ? groupAttentionItems(data.attentionItems).slice(0, 5) : []),
    [data]
  );

  const teamRows = React.useMemo(() => {
    if (!data) return [];
    return data.staffLoad.map((row) => ({
      ...row,
      openSlotSummary: summarizeOpenRanges(
        data.openSlots.find((slot) => slot.staffId === row.staffId)?.ranges ?? []
      ),
    }));
  }, [data]);

  const totalAppointments = data
    ? Object.values(data.counts).reduce((sum, count) => sum + count, 0)
    : 0;

  const quickStats = [
    {
      label: 'کل نوبت‌ها',
      value: formatNumber(totalAppointments),
      hint: data ? formatJalaliFullDate(data.date) : '',
    },
    {
      label: 'در صف امروز',
      value: formatNumber(activeAppointments.length),
      hint: 'رزرو شده و تایید شده',
    },
    {
      label: 'انجام شده',
      value: formatNumber(data?.counts.completed ?? 0),
      hint: 'ثبت نتیجه شده',
    },
    {
      label: 'لغو یا غیبت',
      value: formatNumber((data?.counts.cancelled ?? 0) + (data?.counts['no-show'] ?? 0)),
      hint: 'برای پیگیری سریع',
    },
  ];

  const showSkeleton = !data && isLoading;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <CalendarDays size={theme.sizes.iconMd} color={theme.colors.primary} strokeWidth={1.8} />
          <View>
            <Text style={styles.headerTitle}>امروز</Text>
            <Text style={styles.headerSubtitle}>
              {data ? formatJalaliFullDate(data.date) : 'نمای سریع سالن و نوبت‌ها'}
            </Text>
          </View>
        </View>
        <View style={styles.datePickerWrap}>
          <JalaliDatePicker value={date} onChange={setDate} />
        </View>
      </View>

      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.scroll}>
        {showSkeleton ? (
          <View style={styles.skelGap}>
            <View style={styles.statRow}>
              {[0, 1, 2, 3].map((i) => (
                <View key={i} style={styles.statSkelCell}>
                  <Skeleton height={80} width="100%" radius={12} />
                </View>
              ))}
            </View>
            <Skeleton height={128} width="100%" radius={12} />
            <Skeleton height={192} width="100%" radius={12} />
          </View>
        ) : (
          <>
            <View style={styles.statRow}>
              {quickStats.map((item) => (
                <View key={item.label} style={styles.statCell}>
                  <StatCard label={item.label} value={item.value} hint={item.hint} />
                </View>
              ))}
            </View>

            {attentionItems.length > 0 ? (
              <Card style={styles.attentionCard}>
                <View style={styles.sectionTitleRow}>
                  <AlertTriangle
                    size={theme.sizes.iconSm}
                    color={theme.colors.accentForeground}
                    strokeWidth={1.8}
                  />
                  <Text style={styles.sectionTitle}>نیاز به توجه</Text>
                </View>
                <View style={styles.attentionList}>
                  {attentionItems.map((item) => (
                    <View key={item.id} style={styles.attentionItem}>
                      <View style={styles.attentionRow}>
                        <View style={styles.attentionBody}>
                          <Text style={styles.attentionTitle}>{item.title}</Text>
                          <Text style={styles.attentionDetail}>{item.detail}</Text>
                        </View>
                        <View style={styles.badgeRow}>
                          {item.labels.map((label) => (
                            <Badge key={label} variant="secondary" textStyle={styles.badgeText}>
                              {label}
                            </Badge>
                          ))}
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </Card>
            ) : null}

            <Card style={styles.sectionCard}>
              <View style={styles.sectionTitleRow}>
                <Clock size={theme.sizes.iconSm} color={theme.colors.primary} strokeWidth={1.8} />
                <Text style={styles.sectionTitle}>صف فعال امروز</Text>
              </View>
              <View style={styles.list}>
                {activeAppointments.length === 0 ? (
                  <View style={styles.empty}>
                    <Text style={styles.emptyText}>نوبت فعال برای این روز وجود ندارد.</Text>
                  </View>
                ) : (
                  activeAppointments.map((appointment) => (
                    <AppointmentCard
                      key={appointment.id}
                      appointment={appointment}
                      meta={appointment.staff.name}
                    />
                  ))
                )}
              </View>
            </Card>

            <Card style={styles.sectionCard}>
              <View style={styles.sectionTitleRow}>
                <Users size={theme.sizes.iconSm} color={theme.colors.primary} strokeWidth={1.8} />
                <Text style={styles.sectionTitle}>خلاصه تیم</Text>
              </View>
              <CardContent style={styles.teamContent}>
                {teamRows.length === 0 ? (
                  <Text style={styles.teamEmpty}>اطلاعاتی برای نمایش وجود ندارد.</Text>
                ) : (
                  teamRows.map((row) => (
                    <View key={row.staffId} style={styles.teamRow}>
                      <View style={styles.teamBody}>
                        <Text style={styles.teamName} numberOfLines={1}>
                          {row.staffName}
                        </Text>
                        <Text style={styles.teamMeta}>
                          {formatNumber(row.appointmentCount)} نوبت ·{' '}
                          {formatNumber(row.bookedMinutes)} دقیقه
                        </Text>
                      </View>
                      <View style={styles.teamBadgeWrap}>
                        <Badge variant="outline" textStyle={styles.teamBadgeText}>
                          {row.openSlotSummary}
                        </Badge>
                      </View>
                    </View>
                  ))
                )}
              </CardContent>
            </Card>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
