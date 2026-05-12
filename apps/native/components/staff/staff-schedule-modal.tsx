import * as React from 'react';
import { Modal, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { X } from 'lucide-react-native';
import type { BusinessHours, User } from '@repo/salon-core/types';
import { formatPersianTime } from '@repo/salon-core/persian-digits';
import { ApiError, NetworkError } from '@repo/api-client';
import { Button } from '../ui/button';
import { Spinner } from '../ui/spinner';
import { TimePicker } from '../ui/time-picker';
import { staffApi } from '../../lib/api';
import { useTheme, useThemeStyles, withAlpha } from '../../theme';

type ScheduleRow = {
  dayOfWeek: number;
  active: boolean;
  workingStart: string;
  workingEnd: string;
};

const days = [
  { dayOfWeek: 6, label: 'شنبه' },
  { dayOfWeek: 0, label: 'یکشنبه' },
  { dayOfWeek: 1, label: 'دوشنبه' },
  { dayOfWeek: 2, label: 'سه‌شنبه' },
  { dayOfWeek: 3, label: 'چهارشنبه' },
  { dayOfWeek: 4, label: 'پنجشنبه' },
  { dayOfWeek: 5, label: 'جمعه' },
] as const;

function defaultRows(hours?: BusinessHours | null): ScheduleRow[] {
  return days.map((d) => ({
    dayOfWeek: d.dayOfWeek,
    active: d.dayOfWeek !== 5,
    workingStart: hours?.workingStart ?? '09:00',
    workingEnd: hours?.workingEnd ?? '19:00',
  }));
}

export type StaffScheduleModalProps = {
  open: boolean;
  staff: User | null;
  onClose: () => void;
  onSaved: () => void;
};

export function StaffScheduleModal({ open, staff, onClose, onSaved }: StaffScheduleModalProps) {
  const { theme } = useTheme();
  const [rows, setRows] = React.useState<ScheduleRow[]>(() => defaultRows());
  const [salonHours, setSalonHours] = React.useState<BusinessHours | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open || !staff) return;
    let cancelled = false;
    setLoading(true);
    setRows(defaultRows());
    setErrorMessage(null);
    staffApi
      .getSchedule(staff.id)
      .then((bundle) => {
        if (cancelled) return;
        setSalonHours(bundle.businessHours);
        const map = new Map(bundle.schedule.map((r) => [r.dayOfWeek, r]));
        setRows(
          defaultRows(bundle.businessHours).map((row) => {
            const saved = map.get(row.dayOfWeek);
            return saved
              ? {
                  dayOfWeek: saved.dayOfWeek,
                  active: saved.active,
                  workingStart: saved.workingStart,
                  workingEnd: saved.workingEnd,
                }
              : row;
          })
        );
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, staff]);

  const styles = useThemeStyles((t) => ({
    backdrop: {
      flex: 1,
      backgroundColor: withAlpha(t.colors.foreground, 0.45),
      justifyContent: 'flex-end' as const,
    },
    sheet: {
      backgroundColor: t.colors.card,
      borderTopLeftRadius: t.radius.xl,
      borderTopRightRadius: t.radius.xl,
      maxHeight: '90%',
    },
    header: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      borderBottomColor: withAlpha(t.colors.border, 0.5),
      borderBottomWidth: t.sizes.hairline,
      paddingHorizontal: t.spacing.xl,
      paddingVertical: t.spacing.lg,
    },
    title: {
      color: t.colors.foreground,
      fontSize: t.fontSize.lg,
      fontFamily: t.fonts.sansBold,
    },
    closeBtn: { padding: t.spacing.sm },
    body: { padding: t.spacing.xl, gap: t.spacing.md },
    salonRow: {
      borderColor: t.colors.border,
      borderWidth: t.sizes.hairline,
      borderRadius: t.radius.lg,
      padding: t.spacing.lg,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
    },
    salonLabel: {
      color: t.colors.foreground,
      fontSize: t.fontSize.sm,
      fontFamily: t.fonts.sansMedium,
    },
    salonHint: {
      color: t.colors.mutedForeground,
      fontSize: t.fontSize.xs,
      fontFamily: t.fonts.sans,
      writingDirection: 'ltr' as const,
    },
    useAllText: {
      color: t.colors.foreground,
      fontFamily: t.fonts.sansMedium,
      fontSize: t.fontSize.sm,
    },
    dayCard: {
      borderColor: t.colors.border,
      borderWidth: t.sizes.hairline,
      borderRadius: t.radius.lg,
      padding: t.spacing.lg,
      gap: t.spacing.md,
    },
    dayHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      gap: t.spacing.md,
    },
    dayLabel: {
      color: t.colors.foreground,
      fontSize: t.fontSize.sm,
      fontFamily: t.fonts.sansMedium,
    },
    dayHint: {
      color: t.colors.mutedForeground,
      fontSize: t.fontSize.xs,
      fontFamily: t.fonts.sans,
    },
    timeGrid: { flexDirection: 'row' as const, gap: t.spacing.md },
    timeCell: { flex: 1, gap: t.spacing.xs },
    timeLabel: {
      color: t.colors.mutedForeground,
      fontSize: t.fontSize.xs,
      fontFamily: t.fonts.sans,
    },
    error: {
      color: t.colors.destructive,
      fontFamily: t.fonts.sansMedium,
      fontSize: t.fontSize.sm,
    },
    submitText: {
      color: t.colors.primaryForeground,
      fontFamily: t.fonts.sansSemiBold,
      fontSize: t.fontSize.base,
    },
  }));

  const updateRow = (idx: number, patch: Partial<ScheduleRow>) => {
    setRows((cur) => cur.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  };

  const useSalonForAll = () => {
    if (!salonHours) return;
    setRows((cur) =>
      cur.map((row) => ({
        ...row,
        workingStart: salonHours.workingStart,
        workingEnd: salonHours.workingEnd,
      }))
    );
  };

  const handleSave = async () => {
    if (!staff) return;
    setErrorMessage(null);
    setSaving(true);
    try {
      await staffApi.updateSchedule(staff.id, { schedule: rows });
      onSaved();
    } catch (err) {
      const message =
        err instanceof ApiError || err instanceof NetworkError
          ? err.message
          : 'ذخیره برنامه کاری انجام نشد.';
      setErrorMessage(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>برنامه کاری {staff?.name ?? ''}</Text>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.closeBtn}>
              <X size={theme.sizes.iconSm + 2} color={theme.colors.foreground} strokeWidth={1.8} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.body}>
            <View style={styles.salonRow}>
              <View>
                <Text style={styles.salonLabel}>ساعت سالن</Text>
                <Text style={styles.salonHint}>
                  {formatPersianTime(salonHours?.workingStart ?? '09:00')} -{' '}
                  {formatPersianTime(salonHours?.workingEnd ?? '19:00')}
                </Text>
              </View>
              <Button variant="outline" onPress={useSalonForAll} disabled={!salonHours}>
                <Text style={styles.useAllText}>استفاده برای همه</Text>
              </Button>
            </View>

            {loading ? <Spinner color={theme.colors.primary} /> : null}

            {rows.map((row, idx) => {
              const label = days.find((d) => d.dayOfWeek === row.dayOfWeek)?.label;
              return (
                <View key={row.dayOfWeek} style={styles.dayCard}>
                  <View style={styles.dayHeader}>
                    <View>
                      <Text style={styles.dayLabel}>{label}</Text>
                      <Text style={styles.dayHint}>
                        {row.active ? 'قابل رزرو' : 'تعطیل برای این پرسنل'}
                      </Text>
                    </View>
                    <Switch
                      value={row.active}
                      onValueChange={(v) => updateRow(idx, { active: v })}
                    />
                  </View>

                  <View style={styles.timeGrid}>
                    <View style={styles.timeCell}>
                      <Text style={styles.timeLabel}>شروع</Text>
                      <TimePicker
                        value={row.workingStart}
                        onChange={(v) => updateRow(idx, { workingStart: v })}
                        label={`${label} شروع`}
                      />
                    </View>
                    <View style={styles.timeCell}>
                      <Text style={styles.timeLabel}>پایان</Text>
                      <TimePicker
                        value={row.workingEnd}
                        onChange={(v) => updateRow(idx, { workingEnd: v })}
                        label={`${label} پایان`}
                      />
                    </View>
                  </View>
                </View>
              );
            })}

            {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

            <Button onPress={handleSave} disabled={saving || loading}>
              {saving ? (
                <Spinner color={theme.colors.primaryForeground} />
              ) : (
                <Text style={styles.submitText}>ذخیره برنامه کاری</Text>
              )}
            </Button>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
