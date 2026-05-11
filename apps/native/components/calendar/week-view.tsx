import * as React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
} from 'react-native';
import { formatPersianTime } from '@repo/salon-core/persian-digits';
import { JALALI_WEEKDAYS_SHORT, parseGregorianToJalali } from '@repo/salon-core/jalali';
import { salonCurrentHm, salonTodayYmd } from '@repo/salon-core/salon-local-time';
import { saloora } from '@repo/brand-tokens/colors';
import { AppointmentBlock } from './appointment-block';
import { AXIS_WIDTH, PX_PER_MINUTE, layoutAppointments, ySnapToHm } from './time-grid';
import {
  FONTS,
  filterByStaff,
  hmToMinutes,
  hourLabels,
  minuteOffsetWithin,
  numFmt,
  weekDays,
  weekStartYmd,
  workingMinutes,
} from './helpers';
import type { CalendarViewProps } from './types';

export function WeekView(props: CalendarViewProps) {
  const {
    cursorYmd,
    appointments,
    hours,
    staffFilter,
    onSelectAppointment,
    onSelectDay,
    onSlotPress,
  } = props;

  const startYmd = React.useMemo(() => weekStartYmd(cursorYmd), [cursorYmd]);
  const days = React.useMemo(() => weekDays(startYmd), [startYmd]);
  const todayYmd = salonTodayYmd();

  // Filtered appointments grouped by day
  const filtered = React.useMemo(
    () => filterByStaff(appointments, staffFilter),
    [appointments, staffFilter]
  );
  const byDay = React.useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const ymd of days) map.set(ymd, []);
    for (const a of filtered) {
      const list = map.get(a.date);
      if (list) list.push(a);
    }
    return map;
  }, [filtered, days]);

  const labels = React.useMemo(() => hourLabels(hours), [hours]);
  const totalHeight = workingMinutes(hours) * PX_PER_MINUTE;
  const startMin = hmToMinutes(hours.workingStart);

  const isCurrentWeek = days.includes(todayYmd);
  const nowOffset = isCurrentWeek ? minuteOffsetWithin(salonCurrentHm(), hours) : null;

  const scrollRef = React.useRef<ScrollView>(null);
  React.useEffect(() => {
    if (!scrollRef.current) return;
    const target =
      nowOffset != null
        ? Math.max(0, nowOffset * PX_PER_MINUTE - 120)
        : 9 * 60 * PX_PER_MINUTE - hmToMinutes(hours.workingStart) * PX_PER_MINUTE;
    const id = setTimeout(() => {
      scrollRef.current?.scrollTo({ y: Math.max(0, target), animated: false });
    }, 60);
    return () => clearTimeout(id);
  }, [startYmd, nowOffset, hours.workingStart]);

  return (
    <View style={{ flex: 1 }}>
      {/* Day header row */}
      <View
        style={{
          flexDirection: 'row',
          paddingTop: 6,
          paddingBottom: 8,
          paddingHorizontal: 12,
          backgroundColor: '#FFFFFF',
          borderBottomWidth: 1,
          borderBottomColor: '#E5D9DB99',
        }}>
        <View style={{ width: AXIS_WIDTH }} />
        {days.map((ymd) => {
          const j = parseGregorianToJalali(ymd);
          const dow = (new Date(ymd + 'T12:00:00').getDay() + 1) % 7;
          const isToday = ymd === todayYmd;
          const isFriday = dow === 6;
          const count = byDay.get(ymd)?.length ?? 0;
          return (
            <Pressable
              key={ymd}
              onPress={() => onSelectDay?.(ymd)}
              style={{ flex: 1, alignItems: 'center', paddingVertical: 4 }}>
              <Text
                style={{
                  fontFamily: FONTS.med,
                  fontSize: 10,
                  color: isFriday ? saloora.rose.hex : saloora.sage.hex,
                }}>
                {JALALI_WEEKDAYS_SHORT[dow]}
              </Text>
              <View
                style={{
                  marginTop: 4,
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isToday ? saloora.plum.hex : 'transparent',
                }}>
                <Text
                  style={{
                    fontFamily: FONTS.bold,
                    fontSize: 12,
                    color: isToday ? '#FFFFFF' : isFriday ? saloora.rose.hex : saloora.plum.hex,
                  }}>
                  {numFmt.format(j.jd)}
                </Text>
              </View>
              <View
                style={{
                  marginTop: 3,
                  height: 4,
                  width: 4,
                  borderRadius: 2,
                  backgroundColor: count > 0 ? saloora.rose.hex : 'transparent',
                }}
              />
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ paddingBottom: 80 }}
        showsVerticalScrollIndicator>
        <View
          style={{
            flexDirection: 'row',
            height: totalHeight,
            paddingHorizontal: 12,
            paddingTop: 6,
          }}>
          {/* Time axis */}
          <View style={{ width: AXIS_WIDTH }}>
            {labels.map((hm) => {
              const offset = (hmToMinutes(hm) - startMin) * PX_PER_MINUTE;
              return (
                <View
                  key={hm}
                  style={{
                    position: 'absolute',
                    top: offset - 7,
                    width: AXIS_WIDTH,
                    alignItems: 'flex-end',
                    paddingRight: 6,
                  }}>
                  <Text
                    style={{
                      fontFamily: FONTS.med,
                      fontSize: 9,
                      color: saloora.sage.hex,
                      writingDirection: 'ltr',
                    }}>
                    {formatPersianTime(hm)}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* 7 day columns */}
          <View style={{ flex: 1, flexDirection: 'row', position: 'relative' }}>
            {/* Hour grid lines spanning all columns */}
            {labels.map((hm) => {
              const offset = (hmToMinutes(hm) - startMin) * PX_PER_MINUTE;
              return (
                <View
                  key={hm}
                  style={{
                    position: 'absolute',
                    top: offset,
                    left: 0,
                    right: 0,
                    height: 1,
                    backgroundColor: '#E5D9DB',
                    opacity: 0.5,
                  }}
                />
              );
            })}

            {/* Now line spanning all columns when current week */}
            {nowOffset != null ? (
              <View
                style={{
                  position: 'absolute',
                  top: nowOffset * PX_PER_MINUTE - 1,
                  left: 0,
                  right: 0,
                  height: 2,
                  backgroundColor: saloora.rose.hex,
                  zIndex: 5,
                  opacity: 0.8,
                }}
              />
            ) : null}

            {days.map((ymd, idx) => {
              const dayList = byDay.get(ymd) ?? [];
              const laidOut = layoutAppointments(dayList, hours);
              const isToday = ymd === todayYmd;
              return (
                <View
                  key={ymd}
                  style={{
                    flex: 1,
                    position: 'relative',
                    height: totalHeight,
                    backgroundColor: isToday ? '#F8EFF066' : 'transparent',
                    borderLeftWidth: idx === days.length - 1 ? 0 : 1,
                    borderLeftColor: '#E5D9DB55',
                  }}>
                  {onSlotPress ? (
                    <View
                      accessibilityLabel="افزودن نوبت در این بازه"
                      onStartShouldSetResponder={() => true}
                      onResponderRelease={(e: GestureResponderEvent) => {
                        const y = e.nativeEvent.locationY;
                        const hm = ySnapToHm(y, hours);
                        if (hm) onSlotPress(ymd, hm);
                      }}
                      style={StyleSheet.absoluteFill}
                    />
                  ) : null}
                  {laidOut.map((it) => (
                    <AppointmentBlock
                      key={it.appointment.id}
                      appointment={it.appointment}
                      topPx={it.topPx}
                      heightPx={it.heightPx}
                      leftPercent={it.leftPercent + 2}
                      widthPercent={Math.max(0, it.widthPercent - 4)}
                      onPress={() => onSelectAppointment(it.appointment)}
                      compact
                    />
                  ))}
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
