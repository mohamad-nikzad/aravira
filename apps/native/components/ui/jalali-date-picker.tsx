import * as React from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react-native';
import {
  JALALI_MONTHS,
  JALALI_WEEKDAYS_SHORT,
  parseGregorianToJalali,
  jalaliToGregorianStr,
  jalaliMonthLength,
  jalaliMonthStartDow,
  formatJalaliDate,
  toJalali,
} from '@repo/salon-core/jalali';
import { saloora } from '@repo/brand-tokens/colors';
import { Button } from './button';

import { tw } from '../../lib/utils';
const numFmt = new Intl.NumberFormat('fa-IR');

export type JalaliDatePickerProps = {
  value: string;
  onChange: (gregorian: string) => void;
  className?: string;
};

export function JalaliDatePicker({ value, onChange, className }: JalaliDatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const selected = React.useMemo(() => (value ? parseGregorianToJalali(value) : null), [value]);
  const todayJalali = React.useMemo(() => {
    const now = new Date();
    return toJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
  }, []);

  const [viewYear, setViewYear] = React.useState(() => selected?.jy ?? todayJalali.jy);
  const [viewMonth, setViewMonth] = React.useState(() => selected?.jm ?? todayJalali.jm);

  const handleOpen = React.useCallback(() => {
    const target = selected ?? todayJalali;
    setViewYear(target.jy);
    setViewMonth(target.jm);
    setOpen(true);
  }, [selected, todayJalali]);

  const goPrev = () =>
    setViewMonth((m) => {
      if (m === 1) {
        setViewYear((y) => y - 1);
        return 12;
      }
      return m - 1;
    });
  const goNext = () =>
    setViewMonth((m) => {
      if (m === 12) {
        setViewYear((y) => y + 1);
        return 1;
      }
      return m + 1;
    });

  const daysInMonth = jalaliMonthLength(viewYear, viewMonth);
  const startDow = jalaliMonthStartDow(viewYear, viewMonth);
  const weeks: (number | null)[][] = React.useMemo(() => {
    const cells: (number | null)[] = [];
    for (let i = 0; i < startDow; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    const rows: (number | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
    return rows;
  }, [startDow, daysInMonth]);

  const handleDayClick = (day: number) => {
    onChange(jalaliToGregorianStr(viewYear, viewMonth, day));
    setOpen(false);
  };

  const displayText = value ? formatJalaliDate(value) : 'انتخاب تاریخ';

  return (
    <>
      <Pressable
        onPress={handleOpen}
        style={tw(
          'h-9 w-full flex-row items-center justify-between rounded-md border border-input bg-transparent px-3',
          className
        )}>
        <Text
          style={[
            tw('text-sm', value ? 'text-foreground' : 'text-muted-foreground'),
            { fontFamily: 'Vazirmatn_400Regular' },
          ]}>
          {displayText}
        </Text>
        <CalendarIcon size={16} color={saloora.sage.hex} strokeWidth={1.6} />
      </Pressable>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <Pressable onPress={() => setOpen(false)} style={tw('flex-1 justify-end bg-black/40')}>
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={tw('rounded-t-2xl bg-card pb-6 pt-4')}>
            <View style={tw('px-4 pb-3')}>
              <Text style={[tw('text-base text-foreground'), { fontFamily: 'Vazirmatn_700Bold' }]}>
                انتخاب تاریخ
              </Text>
              <Text
                style={[
                  tw('text-xs text-muted-foreground'),
                  { fontFamily: 'Vazirmatn_400Regular' },
                ]}>
                روز مورد نظر را انتخاب کنید
              </Text>
            </View>

            <View style={tw('px-4 pb-2')}>
              <View style={tw('flex-row items-center justify-between')}>
                <Pressable
                  onPress={goNext}
                  style={tw('h-10 w-10 items-center justify-center rounded-md')}>
                  <ChevronRight size={20} color={saloora.plum.hex} />
                </Pressable>
                <Text
                  style={[
                    tw('text-base text-foreground'),
                    { fontFamily: 'Vazirmatn_600SemiBold' },
                  ]}>
                  {JALALI_MONTHS[viewMonth - 1]} {numFmt.format(viewYear)}
                </Text>
                <Pressable
                  onPress={goPrev}
                  style={tw('h-10 w-10 items-center justify-center rounded-md')}>
                  <ChevronLeft size={20} color={saloora.plum.hex} />
                </Pressable>
              </View>

              <View style={tw('flex-row mt-2')}>
                {JALALI_WEEKDAYS_SHORT.map((wd) => (
                  <View key={wd} style={tw('flex-1 py-1')}>
                    <Text
                      style={[
                        tw('text-center text-xs text-muted-foreground'),
                        { fontFamily: 'Vazirmatn_500Medium' },
                      ]}>
                      {wd}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={tw('gap-1 mt-1')}>
                {weeks.map((week, wi) => (
                  <View key={wi} style={tw('flex-row gap-1')}>
                    {week.map((day, di) => {
                      if (day === null) {
                        return <View key={di} style={tw('flex-1 aspect-square')} />;
                      }
                      const isToday =
                        viewYear === todayJalali.jy &&
                        viewMonth === todayJalali.jm &&
                        day === todayJalali.jd;
                      const isSelected =
                        selected &&
                        viewYear === selected.jy &&
                        viewMonth === selected.jm &&
                        day === selected.jd;
                      return (
                        <Pressable
                          key={di}
                          onPress={() => handleDayClick(day)}
                          style={tw(
                            'flex-1 aspect-square items-center justify-center rounded-xl',
                            isToday && !isSelected && 'bg-accent',
                            isSelected && 'bg-primary'
                          )}>
                          <Text
                            style={[
                              tw(
                                'text-sm',
                                isSelected ? 'text-primary-foreground' : 'text-foreground'
                              ),
                              { fontFamily: 'Vazirmatn_500Medium' },
                            ]}>
                            {numFmt.format(day)}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ))}
              </View>
            </View>

            <View style={tw('px-4 pt-2')}>
              <Button
                variant="outline"
                onPress={() => {
                  const now = new Date();
                  const y = now.getFullYear();
                  const m = now.getMonth() + 1;
                  const d = now.getDate();
                  onChange(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
                  setOpen(false);
                }}>
                <Text
                  style={[tw('text-sm text-foreground'), { fontFamily: 'Vazirmatn_500Medium' }]}>
                  امروز
                </Text>
              </Button>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
