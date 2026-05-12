import * as React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme, useThemeStyles, withAlpha } from '../../theme';
import type { CalendarView } from './types';

const VIEWS: readonly { key: CalendarView; label: string }[] = [
  { key: 'day', label: 'روز' },
  { key: 'week', label: 'هفته' },
  { key: 'month', label: 'ماه' },
  { key: 'agenda', label: 'لیست' },
];

export function ViewSwitcher({
  value,
  onChange,
}: {
  value: CalendarView;
  onChange: (view: CalendarView) => void;
}) {
  const { theme } = useTheme();
  const styles = useThemeStyles((t) => ({
    container: {
      backgroundColor: withAlpha(t.colors.muted, 0.7),
      flexDirection: 'row' as const,
      borderRadius: t.radius.xl,
      padding: t.spacing.xs,
    },
    item: {
      flex: 1,
      minHeight: t.sizes.controlLg - 8,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderRadius: t.radius.lg,
      paddingHorizontal: t.spacing.md,
      paddingVertical: t.spacing.sm,
    },
    itemActive: { backgroundColor: t.colors.card },
    label: { fontSize: t.fontSize.base },
    labelActive: { color: t.colors.primary, fontFamily: t.fonts.sansSemiBold },
    labelInactive: { color: t.colors.mutedForeground, fontFamily: t.fonts.sansMedium },
  }));

  return (
    <View style={styles.container}>
      {VIEWS.map((v) => {
        const active = v.key === value;
        return (
          <Pressable
            key={v.key}
            onPress={() => onChange(v.key)}
            accessibilityRole="button"
            accessibilityLabel={v.label}
            accessibilityState={{ selected: active }}
            style={({ pressed }) => [
              styles.item,
              active ? styles.itemActive : null,
              pressed && !active ? { opacity: theme.states.pressed.opacity } : null,
            ]}>
            <Text style={[styles.label, active ? styles.labelActive : styles.labelInactive]}>
              {v.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
