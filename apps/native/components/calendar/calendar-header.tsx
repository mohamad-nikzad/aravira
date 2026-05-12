import * as React from 'react';
import { Pressable, Text, View } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import {
  formatJalaliFullDate,
  JALALI_MONTHS,
  jalaliToGregorianStr,
  parseGregorianToJalali,
} from '@repo/salon-core/jalali';
import { addDaysYmd } from '@repo/salon-core/salon-local-time';
import { jalaliMonthGrid, numFmt, weekDays, weekStartYmd } from './helpers';
import type { CalendarView } from './types';
import { useTheme, useThemeStyles, withAlpha } from '../../theme';

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
  const { theme } = useTheme();
  const styles = useThemeStyles((t) => ({
    container: {
      borderBottomColor: withAlpha(t.colors.border, 0.5),
      backgroundColor: t.colors.card,
      borderBottomWidth: t.sizes.hairline,
      paddingHorizontal: t.spacing.xl,
      paddingTop: t.spacing.lg,
      paddingBottom: t.spacing.lg,
    },
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: t.spacing.md,
    },
    navButton: {
      backgroundColor: withAlpha(t.colors.muted, 0.6),
      height: t.sizes.controlLg,
      width: t.sizes.controlLg,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderRadius: t.radius.lg,
    },
    titleWrap: { flex: 1, alignItems: 'center' as const },
    title: {
      color: t.colors.foreground,
      fontSize: t.fontSize.lg,
      fontFamily: t.fonts.sansBold,
    },
    subtitle: {
      color: t.colors.mutedForeground,
      marginTop: t.spacing.xs / 2,
      fontSize: t.fontSize.sm,
      fontFamily: t.fonts.sans,
    },
    todayRow: {
      marginTop: t.spacing.md,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    todayChip: {
      borderRadius: t.radius.full,
      borderWidth: t.sizes.hairline,
      paddingHorizontal: t.spacing.lg,
      paddingVertical: t.spacing.sm,
      minHeight: t.sizes.controlLg - 12,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    todayChipDisabled: {
      borderColor: withAlpha(t.colors.border, 0.6),
      backgroundColor: withAlpha(t.colors.muted, 0.6),
    },
    todayChipEnabled: {
      borderColor: withAlpha(t.colors.primary, 0.4),
      backgroundColor: withAlpha(t.colors.primary, 0.1),
    },
    todayLabel: { fontSize: t.fontSize.sm, fontFamily: t.fonts.sansSemiBold },
    todayLabelDisabled: { color: t.colors.mutedForeground },
    todayLabelEnabled: { color: t.colors.primary },
  }));

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
    <View style={styles.container}>
      <View style={styles.row}>
        <Pressable
          onPress={goPrev}
          accessibilityRole="button"
          accessibilityLabel="قبلی"
          hitSlop={6}
          style={styles.navButton}>
          <ChevronRight
            size={theme.sizes.iconSm + 2}
            color={theme.colors.foreground}
            strokeWidth={1.8}
          />
        </Pressable>

        <View style={styles.titleWrap}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>

        <Pressable
          onPress={goNext}
          accessibilityRole="button"
          accessibilityLabel="بعدی"
          hitSlop={6}
          style={styles.navButton}>
          <ChevronLeft
            size={theme.sizes.iconSm + 2}
            color={theme.colors.foreground}
            strokeWidth={1.8}
          />
        </Pressable>
      </View>

      <View style={styles.todayRow}>
        <Pressable
          onPress={() => onCursorChange(todayYmd)}
          disabled={isToday}
          accessibilityRole="button"
          accessibilityLabel="رفتن به امروز"
          accessibilityState={{ disabled: isToday }}
          hitSlop={8}
          style={[styles.todayChip, isToday ? styles.todayChipDisabled : styles.todayChipEnabled]}>
          <Text
            style={[
              styles.todayLabel,
              isToday ? styles.todayLabelDisabled : styles.todayLabelEnabled,
            ]}>
            امروز
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
