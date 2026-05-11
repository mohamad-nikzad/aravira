import * as React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CalendarDays, Clock } from 'lucide-react-native';
import type { AppointmentWithDetails, TodayData } from '@repo/salon-core/types';
import { formatJalaliFullDate } from '@repo/salon-core/jalali';
import { formatPersianTime } from '@repo/salon-core/persian-digits';
import { salonCurrentHm } from '@repo/salon-core/salon-local-time';
import { durationMinutesFromRange } from '@repo/salon-core/appointment-time';
import { saloora, semanticLight } from '@repo/brand-tokens/colors';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import {
  ACTIVE_STATUSES,
  AppointmentCard,
  FONTS,
  StatCard,
  formatNumber,
  sortAppointments,
} from './shared';
import { getNextOpenSlot } from './next-open-slot';
import { toPersianDigits } from '@repo/salon-core/persian-digits';

import { tw } from '../../lib/utils';
function summarizeNextOpenSlot(slot: ReturnType<typeof getNextOpenSlot>) {
  if (!slot) return 'بازه آزاد دیگری ندارد';
  const primary = slot.startsNow
    ? `از الان تا ${formatPersianTime(slot.endTime)}`
    : `${formatPersianTime(slot.startTime)} تا ${formatPersianTime(slot.endTime)}`;
  if (slot.additionalRanges === 0) return primary;
  return `${primary} · ${toPersianDigits(slot.additionalRanges)} بازه دیگر`;
}

function bookedMinutesFor(appointments: AppointmentWithDetails[]) {
  return appointments.reduce((sum, a) => sum + durationMinutesFromRange(a.startTime, a.endTime), 0);
}

export function StaffTodayView({
  todayDate,
  tomorrowDate,
  todayData,
  tomorrowData,
  todayLoading,
  tomorrowLoading,
}: {
  todayDate: string;
  tomorrowDate: string;
  todayData?: TodayData;
  tomorrowData?: TodayData;
  todayLoading: boolean;
  tomorrowLoading: boolean;
}) {
  const [clockHm, setClockHm] = React.useState(() => salonCurrentHm());
  React.useEffect(() => {
    const t = setInterval(() => setClockHm(salonCurrentHm()), 60_000);
    return () => clearInterval(t);
  }, []);

  const todayAppointments = React.useMemo(
    () => sortAppointments(todayData?.appointments ?? []),
    [todayData]
  );
  const tomorrowAppointments = React.useMemo(
    () =>
      sortAppointments((tomorrowData?.appointments ?? []).filter((a) => a.status !== 'cancelled')),
    [tomorrowData]
  );
  const activeTodayAppointments = React.useMemo(
    () => todayAppointments.filter((a) => ACTIVE_STATUSES.has(a.status)),
    [todayAppointments]
  );

  const currentAppointment =
    activeTodayAppointments.find((a) => a.startTime <= clockHm && a.endTime > clockHm) ?? null;
  const nextAppointment = activeTodayAppointments.find((a) => a.startTime > clockHm) ?? null;

  const todayOpenRanges = todayData?.openSlots[0]?.ranges ?? [];
  const tomorrowOpenRanges = tomorrowData?.openSlots[0]?.ranges ?? [];
  const nextOpenSlot = React.useMemo(
    () =>
      getNextOpenSlot({
        todayRanges: todayOpenRanges,
        tomorrowRanges: tomorrowOpenRanges,
        clockHm,
      }),
    [clockHm, todayOpenRanges, tomorrowOpenRanges]
  );
  const checkingTomorrowOpenSlots =
    !getNextOpenSlot({
      todayRanges: todayOpenRanges,
      tomorrowRanges: [],
      clockHm,
    }) &&
    tomorrowLoading &&
    !tomorrowData;

  const todayBookedMinutes = bookedMinutesFor(
    todayAppointments.filter((a) => a.status !== 'cancelled')
  );

  const showSkeleton = !todayData && todayLoading;

  return (
    <SafeAreaView
      style={[tw('bg-background flex-1'), { backgroundColor: semanticLight.background.hex }]}
      edges={['top']}>
      <View style={tw('border-border/50 bg-card border-b px-4 py-3')}>
        <View style={tw('flex-row items-center gap-2')}>
          <CalendarDays size={20} color={saloora.plum.hex} strokeWidth={1.8} />
          <View>
            <Text style={[tw('text-foreground text-lg'), { fontFamily: FONTS.bold }]}>
              امروز من
            </Text>
            <Text style={[tw('text-muted-foreground text-xs'), { fontFamily: FONTS.reg }]}>
              {todayData ? formatJalaliFullDate(todayData.date) : formatJalaliFullDate(todayDate)} ·
              اکنون {formatPersianTime(clockHm)}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 16, gap: 16 }}>
        {showSkeleton ? (
          <View style={tw('gap-3')}>
            <View style={tw('flex-row flex-wrap gap-3')}>
              {[0, 1, 2, 3].map((i) => (
                <View key={i} style={{ flexBasis: '47%', flexGrow: 1 }}>
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
              <View style={{ flexBasis: '47%', flexGrow: 1 }}>
                <StatCard
                  label="کل امروز"
                  value={formatNumber(todayAppointments.length)}
                  hint="همه نوبت‌های ثبت شده"
                />
              </View>
              <View style={{ flexBasis: '47%', flexGrow: 1 }}>
                <StatCard
                  label="در جریان"
                  value={formatNumber(activeTodayAppointments.length)}
                  hint="رزرو شده و تایید شده"
                />
              </View>
              <View style={{ flexBasis: '47%', flexGrow: 1 }}>
                <StatCard
                  label="زمان رزرو"
                  value={formatNumber(todayBookedMinutes)}
                  hint="دقیقه کاری امروز"
                />
              </View>
              <View style={{ flexBasis: '47%', flexGrow: 1 }}>
                <StatCard
                  label="فردا"
                  value={formatNumber(tomorrowAppointments.length)}
                  hint={
                    tomorrowData
                      ? formatJalaliFullDate(tomorrowData.date)
                      : formatJalaliFullDate(tomorrowDate)
                  }
                />
              </View>
            </View>

            <Card style={{ gap: 12, padding: 16 }}>
              <View style={tw('flex-row items-center gap-2')}>
                <Clock size={16} color={saloora.plum.hex} strokeWidth={1.8} />
                <Text style={[tw('text-foreground text-sm'), { fontFamily: FONTS.semi }]}>
                  الان و بعدی
                </Text>
              </View>
              <CardContent style={{ gap: 12, padding: 0 }}>
                {currentAppointment ? (
                  <View style={tw('border-primary/30 bg-primary/5 gap-2 rounded-2xl border p-3')}>
                    <View style={tw('flex-row items-center justify-between gap-2')}>
                      <Badge>در حال انجام</Badge>
                      <Text
                        style={[
                          tw('text-muted-foreground text-xs'),
                          { fontFamily: FONTS.reg, writingDirection: 'ltr' },
                        ]}>
                        {formatPersianTime(currentAppointment.startTime)} -{' '}
                        {formatPersianTime(currentAppointment.endTime)}
                      </Text>
                    </View>
                    <Text style={[tw('text-foreground text-sm'), { fontFamily: FONTS.semi }]}>
                      {currentAppointment.client.name}
                    </Text>
                    <Text style={[tw('text-muted-foreground text-xs'), { fontFamily: FONTS.reg }]}>
                      {currentAppointment.service.name}
                    </Text>
                  </View>
                ) : nextAppointment ? (
                  <View style={tw('border-border/60 gap-2 rounded-2xl border p-3')}>
                    <View style={tw('flex-row items-center justify-between gap-2')}>
                      <Badge variant="secondary">بعدی</Badge>
                      <Text
                        style={[
                          tw('text-muted-foreground text-xs'),
                          { fontFamily: FONTS.reg, writingDirection: 'ltr' },
                        ]}>
                        {formatPersianTime(nextAppointment.startTime)} -{' '}
                        {formatPersianTime(nextAppointment.endTime)}
                      </Text>
                    </View>
                    <Text style={[tw('text-foreground text-sm'), { fontFamily: FONTS.semi }]}>
                      {nextAppointment.client.name}
                    </Text>
                    <Text style={[tw('text-muted-foreground text-xs'), { fontFamily: FONTS.reg }]}>
                      {nextAppointment.service.name}
                    </Text>
                  </View>
                ) : (
                  <View
                    style={tw(
                      'border-border/70 items-center rounded-2xl border border-dashed p-4'
                    )}>
                    <Text
                      style={[
                        tw('text-muted-foreground text-center text-sm'),
                        { fontFamily: FONTS.reg },
                      ]}>
                      برای ادامه امروز نوبت فعالی باقی نمانده است.
                    </Text>
                  </View>
                )}

                <View style={tw('bg-muted/60 gap-1 rounded-2xl p-3')}>
                  <View style={tw('flex-row items-center justify-between gap-2')}>
                    <Text style={[tw('text-foreground text-sm'), { fontFamily: FONTS.med }]}>
                      بازه آزاد بعدی
                    </Text>
                    {nextOpenSlot ? (
                      <Badge variant="outline" textStyle={{ fontSize: 10 }}>
                        {nextOpenSlot.dayLabel}
                      </Badge>
                    ) : null}
                  </View>
                  <Text style={[tw('text-muted-foreground text-xs'), { fontFamily: FONTS.reg }]}>
                    {checkingTomorrowOpenSlots
                      ? 'در حال بررسی اولین بازه آزاد...'
                      : summarizeNextOpenSlot(nextOpenSlot)}
                  </Text>
                </View>
              </CardContent>
            </Card>

            <Card style={{ gap: 12, padding: 16 }}>
              <Text style={[tw('text-foreground text-sm'), { fontFamily: FONTS.semi }]}>
                نوبت‌های امروز
              </Text>
              <CardContent style={{ gap: 12, padding: 0 }}>
                {todayAppointments.length === 0 ? (
                  <Text style={[tw('text-muted-foreground text-sm'), { fontFamily: FONTS.reg }]}>
                    برای امروز نوبتی ثبت نشده است.
                  </Text>
                ) : (
                  todayAppointments.map((appointment) => (
                    <AppointmentCard
                      key={appointment.id}
                      appointment={appointment}
                      meta={appointment.status === 'completed' ? 'انجام شده' : 'مشتری امروز'}
                      tone={currentAppointment?.id === appointment.id ? 'highlight' : 'default'}
                    />
                  ))
                )}
              </CardContent>
            </Card>

            <Card style={{ gap: 12, padding: 16 }}>
              <Text style={[tw('text-foreground text-sm'), { fontFamily: FONTS.semi }]}>
                نگاه به فردا
              </Text>
              <CardContent style={{ gap: 12, padding: 0 }}>
                {!tomorrowData && tomorrowLoading ? (
                  <View style={tw('gap-3')}>
                    <View style={tw('border-border/60 gap-2 rounded-2xl border p-3')}>
                      <Skeleton height={16} width={112} />
                      <Skeleton height={12} width={80} />
                      <Skeleton height={12} width={128} />
                    </View>
                    <View style={tw('border-border/60 gap-2 rounded-2xl border p-3')}>
                      <Skeleton height={16} width={96} />
                      <Skeleton height={12} width={96} />
                      <Skeleton height={12} width={112} />
                    </View>
                  </View>
                ) : tomorrowAppointments.length === 0 ? (
                  <Text style={[tw('text-muted-foreground text-sm'), { fontFamily: FONTS.reg }]}>
                    برای فردا هنوز نوبتی ثبت نشده است.
                  </Text>
                ) : (
                  tomorrowAppointments.map((appointment) => (
                    <AppointmentCard
                      key={appointment.id}
                      appointment={appointment}
                      meta="برنامه فردا"
                    />
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
