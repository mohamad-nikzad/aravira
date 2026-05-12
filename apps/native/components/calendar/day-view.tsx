import * as React from 'react';
import { ScrollView, StyleSheet, Text, View, type GestureResponderEvent } from 'react-native';
import { formatPersianTime, toPersianDigits } from '@repo/salon-core/persian-digits';
import { salonCurrentHm, salonTodayYmd } from '@repo/salon-core/salon-local-time';
import { useTheme, withAlpha } from '../../theme';
import { AppointmentBlock } from './appointment-block';
import { AXIS_WIDTH, PX_PER_MINUTE, layoutAppointments, ySnapToHm } from './time-grid';
import {
  FONTS,
  filterByStaff,
  hmToMinutes,
  hourLabels,
  minuteOffsetWithin,
  workingMinutes,
} from './helpers';
import type { CalendarViewProps } from './types';

export function DayView(props: CalendarViewProps) {
  const { cursorYmd, appointments, hours, staffFilter, onSelectAppointment, onSlotPress } = props;
  const { theme } = useTheme();

  const dayList = React.useMemo(
    () =>
      filterByStaff(
        appointments.filter((a) => a.date === cursorYmd),
        staffFilter
      ),
    [appointments, cursorYmd, staffFilter]
  );

  const laidOut = React.useMemo(() => layoutAppointments(dayList, hours), [dayList, hours]);

  const labels = React.useMemo(() => hourLabels(hours), [hours]);
  const totalHeight = workingMinutes(hours) * PX_PER_MINUTE;
  const startMin = hmToMinutes(hours.workingStart);

  const isToday = cursorYmd === salonTodayYmd();
  const nowOffset = isToday ? minuteOffsetWithin(salonCurrentHm(), hours) : null;

  // Auto-scroll to a useful position on mount/cursor-change
  const scrollRef = React.useRef<ScrollView>(null);
  React.useEffect(() => {
    if (!scrollRef.current) return;
    const target = (() => {
      if (nowOffset != null) return Math.max(0, nowOffset * PX_PER_MINUTE - 120);
      const first = laidOut[0];
      if (first) return Math.max(0, first.topPx - 60);
      return 0;
    })();
    const id = setTimeout(() => {
      scrollRef.current?.scrollTo({ y: target, animated: false });
    }, 60);
    return () => clearTimeout(id);
  }, [cursorYmd, nowOffset, laidOut]);

  return (
    <ScrollView
      ref={scrollRef}
      contentContainerStyle={{ paddingBottom: 80 }}
      showsVerticalScrollIndicator>
      <View
        style={{
          flexDirection: 'row',
          height: totalHeight,
          paddingHorizontal: 12,
          paddingTop: 8,
        }}>
        {/* Time axis (visually on the right under RTL) */}
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
                  paddingRight: 8,
                }}>
                <Text
                  style={{
                    fontFamily: FONTS.med,
                    fontSize: 10,
                    color: theme.colors.mutedForeground,
                    writingDirection: 'ltr',
                  }}>
                  {formatPersianTime(hm)}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Grid + events */}
        <View style={{ flex: 1, position: 'relative' }}>
          {/* Hour lines */}
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
                  backgroundColor: withAlpha(
                    theme.colors.border,
                    theme.mode === 'dark' ? 0.8 : 0.6
                  ),
                }}
              />
            );
          })}
          {/* Half-hour ticks (subtle) */}
          {labels.map((hm) => {
            const offset = (hmToMinutes(hm) - startMin) * PX_PER_MINUTE + 30 * PX_PER_MINUTE;
            if (offset >= totalHeight) return null;
            return (
              <View
                key={`half-${hm}`}
                style={{
                  position: 'absolute',
                  top: offset,
                  left: 0,
                  right: 0,
                  height: 1,
                  backgroundColor: withAlpha(
                    theme.colors.muted,
                    theme.mode === 'dark' ? 0.45 : 0.75
                  ),
                }}
              />
            );
          })}

          {/* Now line */}
          {nowOffset != null ? (
            <View
              style={{
                position: 'absolute',
                top: nowOffset * PX_PER_MINUTE - 1,
                left: -4,
                right: 0,
                height: 2,
                backgroundColor: theme.colors.ring,
                zIndex: 5,
              }}>
              <View
                style={{
                  position: 'absolute',
                  right: -4,
                  top: -3,
                  width: 8,
                  height: 8,
                  borderRadius: theme.radius.full,
                  backgroundColor: theme.colors.ring,
                }}
              />
            </View>
          ) : null}

          {/* Appointments */}
          <View style={{ position: 'relative', height: totalHeight, paddingHorizontal: 4 }}>
            {onSlotPress ? (
              <View
                accessibilityLabel="افزودن نوبت در این بازه"
                onStartShouldSetResponder={() => true}
                onResponderRelease={(e: GestureResponderEvent) => {
                  const y = e.nativeEvent.locationY;
                  const hm = ySnapToHm(y, hours);
                  if (hm) onSlotPress(cursorYmd, hm);
                }}
                style={StyleSheet.absoluteFill}
              />
            ) : null}
            {laidOut.length === 0 ? (
              <DayEmptyState />
            ) : (
              laidOut.map((it) => (
                <AppointmentBlock
                  key={it.appointment.id}
                  appointment={it.appointment}
                  topPx={it.topPx}
                  heightPx={it.heightPx}
                  leftPercent={it.leftPercent + 1}
                  widthPercent={Math.max(0, it.widthPercent - 2)}
                  onPress={() => onSelectAppointment(it.appointment)}
                />
              ))
            )}
          </View>
        </View>
      </View>
      <CountFooter count={dayList.length} />
    </ScrollView>
  );
}

function DayEmptyState() {
  const { theme } = useTheme();

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 80,
        left: 0,
        right: 0,
        alignItems: 'center',
      }}>
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderRadius: theme.radius.xl,
          backgroundColor: withAlpha(theme.colors.card, theme.mode === 'dark' ? 0.7 : 0.6),
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderStyle: 'dashed',
        }}>
        <Text style={{ fontFamily: FONTS.med, fontSize: 12, color: theme.colors.mutedForeground }}>
          نوبتی برای این روز ثبت نشده
        </Text>
      </View>
    </View>
  );
}

function CountFooter({ count }: { count: number }) {
  const { theme } = useTheme();

  return (
    <View
      style={{
        alignItems: 'center',
        paddingVertical: 16,
      }}>
      <Text style={{ fontFamily: FONTS.reg, fontSize: 11, color: theme.colors.mutedForeground }}>
        {count === 0 ? 'بدون نوبت' : `${toPersianDigits(count)} نوبت در این روز`}
      </Text>
    </View>
  );
}
