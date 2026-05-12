import * as React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { JALALI_WEEKDAYS_SHORT, parseGregorianToJalali } from '@repo/salon-core/jalali';
import { salonTodayYmd } from '@repo/salon-core/salon-local-time';
import { useTheme, withAlpha } from '../../theme';
import {
  FONTS,
  appointmentsByDay,
  filterByStaff,
  jalaliMonthGrid,
  numFmt,
  staffHex,
} from './helpers';
import type { CalendarViewProps } from './types';

export function MonthView(props: CalendarViewProps) {
  const { cursorYmd, appointments, staffFilter, onSelectDay } = props;
  const { theme } = useTheme();

  const j = React.useMemo(() => parseGregorianToJalali(cursorYmd), [cursorYmd]);
  const grid = React.useMemo(() => jalaliMonthGrid(j.jy, j.jm), [j.jy, j.jm]);
  const filtered = React.useMemo(
    () => filterByStaff(appointments, staffFilter),
    [appointments, staffFilter]
  );
  const dayMap = React.useMemo(() => appointmentsByDay(filtered), [filtered]);
  const todayYmd = salonTodayYmd();

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 60, paddingHorizontal: 12, paddingTop: 8 }}>
      {/* Weekday header */}
      <View style={{ flexDirection: 'row', marginBottom: 6 }}>
        {JALALI_WEEKDAYS_SHORT.map((wd, i) => (
          <View key={wd} style={{ flex: 1, alignItems: 'center', paddingVertical: 6 }}>
            <Text
              style={{
                fontFamily: FONTS.semi,
                fontSize: 11,
                color: i === 6 ? theme.colors.ring : theme.colors.mutedForeground,
              }}>
              {wd}
            </Text>
          </View>
        ))}
      </View>

      <View style={{ borderRadius: 16, overflow: 'hidden', backgroundColor: theme.colors.card }}>
        {grid.map((row, ri) => (
          <View key={ri} style={{ flexDirection: 'row' }}>
            {row.map((cell, ci) => {
              const isToday = cell.ymd === todayYmd;
              const isCursor = cell.ymd === cursorYmd;
              const isFriday = ci === 6;
              const dayItems = dayMap.get(cell.ymd) ?? [];
              const distinctStaff: string[] = [];
              for (const a of dayItems) {
                if (!distinctStaff.includes(a.staff.color)) {
                  distinctStaff.push(a.staff.color);
                }
                if (distinctStaff.length >= 4) break;
              }
              const dayTextColor = !cell.inCurrentMonth
                ? withAlpha(theme.colors.mutedForeground, theme.mode === 'dark' ? 0.45 : 0.5)
                : isFriday
                  ? theme.colors.ring
                  : theme.colors.foreground;

              return (
                <Pressable
                  key={ci}
                  onPress={() => onSelectDay?.(cell.ymd)}
                  style={({ pressed }) => ({
                    flex: 1,
                    minHeight: 76,
                    paddingVertical: 6,
                    paddingHorizontal: 4,
                    borderTopWidth: ri === 0 ? 0 : 1,
                    borderTopColor: withAlpha(theme.colors.border, 0.75),
                    borderLeftWidth: ci === row.length - 1 ? 0 : 1,
                    borderLeftColor: withAlpha(theme.colors.border, 0.75),
                    backgroundColor: pressed
                      ? theme.colors.muted
                      : isCursor
                        ? withAlpha(theme.colors.accent, theme.mode === 'dark' ? 0.35 : 0.4)
                        : 'transparent',
                    alignItems: 'center',
                  })}>
                  <View
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 13,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isToday ? theme.colors.primary : 'transparent',
                    }}>
                    <Text
                      style={{
                        fontFamily: cell.inCurrentMonth ? FONTS.semi : FONTS.reg,
                        fontSize: 13,
                        color: isToday ? theme.colors.primaryForeground : dayTextColor,
                      }}>
                      {numFmt.format(cell.jd)}
                    </Text>
                  </View>

                  {/* Staff color dots */}
                  <View
                    style={{
                      flexDirection: 'row',
                      gap: 3,
                      marginTop: 6,
                      minHeight: 6,
                      opacity: cell.inCurrentMonth ? 1 : 0.4,
                    }}>
                    {distinctStaff.map((color) => (
                      <View
                        key={color}
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: 2.5,
                          backgroundColor: staffHex(color),
                        }}
                      />
                    ))}
                  </View>

                  {/* Count */}
                  {dayItems.length > 0 ? (
                    <Text
                      style={{
                        fontFamily: FONTS.med,
                        fontSize: 9,
                        color: cell.inCurrentMonth
                          ? theme.colors.mutedForeground
                          : withAlpha(theme.colors.mutedForeground, 0.5),
                        marginTop: 3,
                      }}>
                      {numFmt.format(dayItems.length)} نوبت
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      {/* Hint */}
      <View style={{ marginTop: 12, alignItems: 'center' }}>
        <Text style={{ fontFamily: FONTS.reg, fontSize: 11, color: theme.colors.mutedForeground }}>
          روی هر روز بزنید تا برنامه آن روز را ببینید
        </Text>
      </View>
    </ScrollView>
  );
}
