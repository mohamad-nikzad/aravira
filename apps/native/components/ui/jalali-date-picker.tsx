import * as React from 'react';
import { Pressable, Text, View } from 'react-native';
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
import { AppSheet } from './app-sheet';
import { ModalHeader } from './modal-header';
import { Button } from './button';
import { useTheme, useThemeStyles } from '../../theme';

const numFmt = new Intl.NumberFormat('fa-IR');

export type JalaliDatePickerProps = {
  value: string;
  onChange: (gregorian: string) => void;
};

export function JalaliDatePicker({ value, onChange }: JalaliDatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const { theme } = useTheme();
  const styles = useThemeStyles((t) => ({
    trigger: {
      height: t.sizes.controlMd,
      width: '100%' as const,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      borderRadius: t.radius.sm,
      borderWidth: t.sizes.hairline,
      borderColor: t.colors.input,
      backgroundColor: 'transparent',
      paddingHorizontal: t.spacing.lg,
    },
    triggerText: { fontSize: t.fontSize.base, fontFamily: t.fonts.sans },
    triggerTextValue: { color: t.colors.foreground },
    triggerTextPlaceholder: { color: t.colors.mutedForeground },
    body: { paddingHorizontal: t.spacing.xl, paddingBottom: t.spacing.md },
    navRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
    },
    navButton: {
      height: t.sizes.avatarMd,
      width: t.sizes.avatarMd,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderRadius: t.radius.sm,
    },
    monthLabel: {
      fontSize: t.fontSize.lg,
      color: t.colors.foreground,
      fontFamily: t.fonts.sansSemiBold,
    },
    weekdayRow: { flexDirection: 'row' as const, marginTop: t.spacing.md },
    weekdayCell: { flex: 1, paddingVertical: t.spacing.xs },
    weekdayText: {
      textAlign: 'center' as const,
      fontSize: t.fontSize.sm,
      color: t.colors.mutedForeground,
      fontFamily: t.fonts.sansMedium,
    },
    weeks: { gap: t.spacing.xs, marginTop: t.spacing.xs },
    weekRow: { flexDirection: 'row' as const, gap: t.spacing.xs },
    dayCell: {
      flex: 1,
      aspectRatio: 1,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderRadius: t.radius.lg,
    },
    dayCellToday: { backgroundColor: t.colors.accent },
    dayCellSelected: { backgroundColor: t.colors.primary },
    dayText: {
      fontSize: t.fontSize.base,
      fontFamily: t.fonts.sansMedium,
      color: t.colors.foreground,
    },
    dayTextSelected: { color: t.colors.primaryForeground },
    footer: { paddingHorizontal: t.spacing.xl, paddingTop: t.spacing.md },
    footerButtonText: {
      fontSize: t.fontSize.base,
      color: t.colors.foreground,
      fontFamily: t.fonts.sansMedium,
    },
  }));

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
        accessibilityRole="button"
        accessibilityLabel="انتخاب تاریخ"
        style={styles.trigger}>
        <Text
          style={[
            styles.triggerText,
            value ? styles.triggerTextValue : styles.triggerTextPlaceholder,
          ]}>
          {displayText}
        </Text>
        <CalendarIcon size={theme.sizes.iconSm} color={theme.iconColors.muted} strokeWidth={1.6} />
      </Pressable>

      <AppSheet visible={open} onClose={() => setOpen(false)}>
        <ModalHeader
          title="انتخاب تاریخ"
          subtitle="روز مورد نظر را انتخاب کنید"
          onClose={() => setOpen(false)}
          borderless
        />

        <View style={styles.body}>
          <View style={styles.navRow}>
            <Pressable onPress={goNext} style={styles.navButton}>
              <ChevronRight size={theme.sizes.iconMd} color={theme.colors.foreground} />
            </Pressable>
            <Text style={styles.monthLabel}>
              {JALALI_MONTHS[viewMonth - 1]} {numFmt.format(viewYear)}
            </Text>
            <Pressable onPress={goPrev} style={styles.navButton}>
              <ChevronLeft size={theme.sizes.iconMd} color={theme.colors.foreground} />
            </Pressable>
          </View>

          <View style={styles.weekdayRow}>
            {JALALI_WEEKDAYS_SHORT.map((wd) => (
              <View key={wd} style={styles.weekdayCell}>
                <Text style={styles.weekdayText}>{wd}</Text>
              </View>
            ))}
          </View>

          <View style={styles.weeks}>
            {weeks.map((week, wi) => (
              <View key={wi} style={styles.weekRow}>
                {week.map((day, di) => {
                  if (day === null) {
                    return <View key={di} style={styles.dayCell} />;
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
                      style={[
                        styles.dayCell,
                        isToday && !isSelected ? styles.dayCellToday : null,
                        isSelected ? styles.dayCellSelected : null,
                      ]}>
                      <Text style={[styles.dayText, isSelected ? styles.dayTextSelected : null]}>
                        {numFmt.format(day)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.footer}>
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
            <Text style={styles.footerButtonText}>امروز</Text>
          </Button>
        </View>
      </AppSheet>
    </>
  );
}
