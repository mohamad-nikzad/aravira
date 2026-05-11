import * as React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { JALALI_WEEKDAYS_SHORT, parseGregorianToJalali } from '@repo/salon-core/jalali';
import { salonTodayYmd } from '@repo/salon-core/salon-local-time';
import { saloora } from '@repo/brand-tokens/colors';
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
                color: i === 6 ? saloora.rose.hex : saloora.sage.hex,
              }}>
              {wd}
            </Text>
          </View>
        ))}
      </View>

      <View style={{ borderRadius: 16, overflow: 'hidden', backgroundColor: '#FFFFFF' }}>
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
                ? '#C7BAB9'
                : isFriday
                  ? saloora.rose.hex
                  : saloora.plum.hex;

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
                    borderTopColor: '#F0E5E7',
                    borderLeftWidth: ci === row.length - 1 ? 0 : 1,
                    borderLeftColor: '#F0E5E7',
                    backgroundColor: pressed ? '#F4EFE7' : isCursor ? '#ECD3D766' : 'transparent',
                    alignItems: 'center',
                  })}>
                  <View
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 13,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isToday ? saloora.plum.hex : 'transparent',
                    }}>
                    <Text
                      style={{
                        fontFamily: cell.inCurrentMonth ? FONTS.semi : FONTS.reg,
                        fontSize: 13,
                        color: isToday ? '#FFFFFF' : dayTextColor,
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
                        color: cell.inCurrentMonth ? saloora.sage.hex : '#C7BAB9',
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
        <Text style={{ fontFamily: FONTS.reg, fontSize: 11, color: saloora.sage.hex }}>
          روی هر روز بزنید تا برنامه آن روز را ببینید
        </Text>
      </View>
    </ScrollView>
  );
}
