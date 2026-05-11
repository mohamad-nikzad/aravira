import * as React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlertTriangle, CalendarDays, Clock, Users } from 'lucide-react-native';
import type { AppointmentWithDetails, TodayData, TodayAttentionItem } from '@repo/salon-core/types';
import { formatJalaliFullDate } from '@repo/salon-core/jalali';
import { saloora, semanticLight } from '@repo/brand-tokens/colors';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { JalaliDatePicker } from '../ui/jalali-date-picker';
import {
  ACTIVE_STATUSES,
  ATTENTION_LABELS,
  AppointmentCard,
  FONTS,
  StatCard,
  formatNumber,
  sortAppointments,
  summarizeOpenRanges,
} from './shared';

import { tw } from '../../lib/utils';
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
    <SafeAreaView
      style={[tw('bg-background flex-1'), { backgroundColor: semanticLight.background.hex }]}
      edges={['top']}>
      <View style={tw('border-border/50 bg-card border-b px-4 py-3')}>
        <View style={tw('flex-row items-center gap-2')}>
          <CalendarDays size={20} color={saloora.plum.hex} strokeWidth={1.8} />
          <View>
            <Text style={[tw('text-foreground text-lg'), { fontFamily: FONTS.bold }]}>امروز</Text>
            <Text style={[tw('text-muted-foreground text-xs'), { fontFamily: FONTS.reg }]}>
              {data ? formatJalaliFullDate(data.date) : 'نمای سریع سالن و نوبت‌ها'}
            </Text>
          </View>
        </View>
        <View style={tw('mt-3')}>
          <JalaliDatePicker value={date} onChange={setDate} />
        </View>
      </View>

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 16, gap: 16 }}>
        {showSkeleton ? (
          <View style={tw('gap-3')}>
            <View style={tw('flex-row flex-wrap gap-3')}>
              {[0, 1, 2, 3].map((i) => (
                <View key={i} style={tw('min-w-[45%] flex-1')}>
                  <Skeleton height={80} width="100%" radius={12} />
                </View>
              ))}
            </View>
            <Skeleton height={128} width="100%" radius={12} />
            <Skeleton height={192} width="100%" radius={12} />
          </View>
        ) : (
          <>
            <View style={tw('flex-row flex-wrap gap-3')}>
              {quickStats.map((item) => (
                <View key={item.label} style={{ flexBasis: '47%', flexGrow: 1 }}>
                  <StatCard label={item.label} value={item.value} hint={item.hint} />
                </View>
              ))}
            </View>

            {attentionItems.length > 0 ? (
              <Card
                style={{
                  backgroundColor: '#fffbeb',
                  borderColor: '#fde68a',
                  gap: 12,
                  padding: 16,
                }}>
                <View style={tw('flex-row items-center gap-2')}>
                  <AlertTriangle size={16} color="#b45309" strokeWidth={1.8} />
                  <Text style={[tw('text-foreground text-sm'), { fontFamily: FONTS.semi }]}>
                    نیاز به توجه
                  </Text>
                </View>
                <View style={tw('gap-2')}>
                  {attentionItems.map((item) => (
                    <View
                      key={item.id}
                      style={tw('border-border/50 bg-card/85 gap-1 rounded-2xl border p-3')}>
                      <View style={tw('flex-row items-start justify-between gap-3')}>
                        <View style={tw('min-w-0 flex-1 gap-1')}>
                          <Text style={[tw('text-foreground text-sm'), { fontFamily: FONTS.semi }]}>
                            {item.title}
                          </Text>
                          <Text
                            style={[
                              tw('text-muted-foreground text-xs'),
                              { fontFamily: FONTS.reg },
                            ]}>
                            {item.detail}
                          </Text>
                        </View>
                        <View style={tw('flex-row flex-wrap justify-end gap-1')}>
                          {item.labels.map((label) => (
                            <Badge key={label} variant="secondary" textStyle={{ fontSize: 10 }}>
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

            <Card style={{ gap: 12, padding: 16 }}>
              <View style={tw('flex-row items-center gap-2')}>
                <Clock size={16} color={saloora.plum.hex} strokeWidth={1.8} />
                <Text style={[tw('text-foreground text-sm'), { fontFamily: FONTS.semi }]}>
                  صف فعال امروز
                </Text>
              </View>
              <View style={tw('gap-3')}>
                {activeAppointments.length === 0 ? (
                  <View
                    style={tw(
                      'border-border/70 items-center rounded-2xl border border-dashed p-4'
                    )}>
                    <Text style={[tw('text-muted-foreground text-sm'), { fontFamily: FONTS.reg }]}>
                      نوبت فعال برای این روز وجود ندارد.
                    </Text>
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

            <Card style={{ gap: 12, padding: 16 }}>
              <View style={tw('flex-row items-center gap-2')}>
                <Users size={16} color={saloora.plum.hex} strokeWidth={1.8} />
                <Text style={[tw('text-foreground text-sm'), { fontFamily: FONTS.semi }]}>
                  خلاصه تیم
                </Text>
              </View>
              <CardContent style={{ gap: 8, padding: 0 }}>
                {teamRows.length === 0 ? (
                  <Text style={[tw('text-muted-foreground text-sm'), { fontFamily: FONTS.reg }]}>
                    اطلاعاتی برای نمایش وجود ندارد.
                  </Text>
                ) : (
                  teamRows.map((row) => (
                    <View
                      key={row.staffId}
                      style={tw(
                        'border-border/60 flex-row items-center justify-between gap-3 rounded-2xl border p-3'
                      )}>
                      <View style={tw('min-w-0 flex-1 gap-1')}>
                        <Text
                          style={[tw('text-foreground text-sm'), { fontFamily: FONTS.semi }]}
                          numberOfLines={1}>
                          {row.staffName}
                        </Text>
                        <Text
                          style={[tw('text-muted-foreground text-xs'), { fontFamily: FONTS.reg }]}>
                          {formatNumber(row.appointmentCount)} نوبت ·{' '}
                          {formatNumber(row.bookedMinutes)} دقیقه
                        </Text>
                      </View>
                      <View style={{ maxWidth: '52%' }}>
                        <Badge variant="outline" textStyle={{ fontSize: 10, textAlign: 'right' }}>
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
