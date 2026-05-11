import * as React from 'react';
import { Pressable, Text, View } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { saloora } from '@repo/brand-tokens/colors';
import {
  formatJalaliFullDate,
  JALALI_MONTHS,
  jalaliToGregorianStr,
  parseGregorianToJalali,
} from '@repo/salon-core/jalali';
import { addDaysYmd } from '@repo/salon-core/salon-local-time';
import { FONTS, jalaliMonthGrid, numFmt, weekDays, weekStartYmd } from './helpers';
import type { CalendarView } from './types';

import { tw } from '../../lib/utils';
function formatWeekTitle(weekStartYmdStr: string): string {
  const days = weekDays(weekStartYmdStr);
  const start = parseGregorianToJalali(days[0]);
  const end = parseGregorianToJalali(days[6]);
  if (start.jy === end.jy && start.jm === end.jm) {
    return `${numFmt.format(start.jd)} تا ${numFmt.format(end.jd)} ${JALALI_MONTHS[start.jm - 1]} ${numFmt.format(start.jy)}`;
  }
  if (start.jy === end.jy) {
    return `${numFmt.format(start.jd)} ${JALALI_MONTHS[start.jm - 1]} تا ${numFmt.format(end.jd)} ${JALALI_MONTHS[end.jm - 1]} ${numFmt.format(start.jy)}`;
  }
  return `${numFmt.format(start.jd)} ${JALALI_MONTHS[start.jm - 1]} ${numFmt.format(start.jy)} تا ${numFmt.format(end.jd)} ${JALALI_MONTHS[end.jm - 1]} ${numFmt.format(end.jy)}`;
}

function formatMonthTitle(ymd: string): string {
  const j = parseGregorianToJalali(ymd);
  return `${JALALI_MONTHS[j.jm - 1]} ${numFmt.format(j.jy)}`;
}

function formatDayTitle(ymd: string): string {
  return formatJalaliFullDate(ymd);
}

function formatAgendaTitle(ymd: string): string {
  const j = parseGregorianToJalali(ymd);
  return `از ${numFmt.format(j.jd)} ${JALALI_MONTHS[j.jm - 1]} ${numFmt.format(j.jy)}`;
}

export type CalendarHeaderProps = {
  view: CalendarView;
  cursorYmd: string;
  todayYmd: string;
  onCursorChange: (ymd: string) => void;
};

export function CalendarHeader({ view, cursorYmd, todayYmd, onCursorChange }: CalendarHeaderProps) {
  const title = React.useMemo(() => {
    if (view === 'day') return formatDayTitle(cursorYmd);
    if (view === 'week') return formatWeekTitle(weekStartYmd(cursorYmd));
    if (view === 'month') return formatMonthTitle(cursorYmd);
    return formatAgendaTitle(cursorYmd);
  }, [view, cursorYmd]);

  const subtitle = React.useMemo(() => {
    if (view !== 'month') return null;
    const j = parseGregorianToJalali(cursorYmd);
    const grid = jalaliMonthGrid(j.jy, j.jm);
    const lastInMonth = grid.flat().filter((c) => c.inCurrentMonth);
    return `${numFmt.format(lastInMonth.length)} روز`;
  }, [view, cursorYmd]);

  const stepDays = view === 'day' ? 1 : view === 'week' ? 7 : view === 'agenda' ? 7 : 0;

  const goPrev = () => {
    if (view === 'month') {
      const j = parseGregorianToJalali(cursorYmd);
      const newJm = j.jm === 1 ? 12 : j.jm - 1;
      const newJy = j.jm === 1 ? j.jy - 1 : j.jy;
      onCursorChange(jalaliToGregorianStr(newJy, newJm, 1));
      return;
    }
    onCursorChange(addDaysYmd(cursorYmd, -stepDays));
  };
  const goNext = () => {
    if (view === 'month') {
      const j = parseGregorianToJalali(cursorYmd);
      const newJm = j.jm === 12 ? 1 : j.jm + 1;
      const newJy = j.jm === 12 ? j.jy + 1 : j.jy;
      onCursorChange(jalaliToGregorianStr(newJy, newJm, 1));
      return;
    }
    onCursorChange(addDaysYmd(cursorYmd, stepDays));
  };

  const isToday = cursorYmd === todayYmd;

  return (
    <View style={tw('border-border/50 bg-card border-b px-4 pt-3 pb-3')}>
      <View style={tw('flex-row items-center gap-2')}>
        {/* In RTL: visually, ChevronRight points "back" (older), ChevronLeft points "forward" (newer) */}
        <Pressable
          onPress={goPrev}
          accessibilityLabel="قبلی"
          style={tw('bg-muted/60 active:bg-muted h-9 w-9 items-center justify-center rounded-xl')}>
          <ChevronRight size={18} color={saloora.plum.hex} strokeWidth={1.8} />
        </Pressable>

        <View style={tw('flex-1 items-center')}>
          <Text
            style={[tw('text-foreground text-[15px]'), { fontFamily: FONTS.bold }]}
            numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={[tw('text-muted-foreground mt-0.5 text-[11px]'), { fontFamily: FONTS.reg }]}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        <Pressable
          onPress={goNext}
          accessibilityLabel="بعدی"
          style={tw('bg-muted/60 active:bg-muted h-9 w-9 items-center justify-center rounded-xl')}>
          <ChevronLeft size={18} color={saloora.plum.hex} strokeWidth={1.8} />
        </Pressable>
      </View>

      <View style={tw('mt-2 flex-row items-center justify-center')}>
        <Pressable
          onPress={() => onCursorChange(todayYmd)}
          disabled={isToday}
          style={tw(
            `rounded-full border px-3 py-1 ${
              isToday
                ? 'border-border/60 bg-muted/60'
                : 'border-primary/40 bg-primary/10 active:bg-primary/15'
            }`
          )}>
          <Text
            style={[
              tw(`text-[11px] ${isToday ? 'text-muted-foreground' : 'text-primary'}`),
              { fontFamily: FONTS.semi },
            ]}>
            امروز
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
