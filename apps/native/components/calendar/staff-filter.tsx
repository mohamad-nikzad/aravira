import * as React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Users } from 'lucide-react-native';
import { staffHex } from './helpers';
import type { CalendarStaff } from './types';
import { useTheme, useThemeStyles, withAlpha } from '../../theme';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '؟';
  if (parts.length === 1) return parts[0].slice(0, 1);
  return parts[0].slice(0, 1) + parts[parts.length - 1].slice(0, 1);
}

export function StaffFilter({
  staff,
  selected,
  onSelect,
}: {
  staff: CalendarStaff[];
  selected: string | null;
  onSelect: (staffId: string | null) => void;
}) {
  const { theme } = useTheme();
  const styles = useThemeStyles((t) => ({
    content: { paddingHorizontal: t.spacing.xl, gap: t.spacing.md },
    chip: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: t.spacing.sm,
      borderRadius: t.radius.full,
      borderWidth: t.sizes.hairline,
      paddingHorizontal: t.spacing.lg,
      paddingVertical: t.spacing.sm,
      minHeight: t.sizes.controlLg - 8,
    },
    chipActive: {
      borderColor: withAlpha(t.colors.primary, 0.6),
      backgroundColor: withAlpha(t.colors.primary, 0.1),
    },
    chipInactive: {
      borderColor: withAlpha(t.colors.border, 0.6),
      backgroundColor: t.colors.card,
    },
    chipText: { fontSize: t.fontSize.base, fontFamily: t.fonts.sansSemiBold },
    chipTextActive: { color: t.colors.primary },
    chipTextInactive: { color: t.colors.mutedForeground },
    staffChip: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: t.spacing.md,
      borderRadius: t.radius.full,
      borderWidth: t.sizes.hairline,
      paddingHorizontal: t.spacing.md,
      paddingVertical: t.spacing.xs,
      minHeight: t.sizes.controlLg - 8,
    },
    staffChipActive: { backgroundColor: withAlpha(t.colors.primary, 0.05) },
    staffChipInactive: { backgroundColor: t.colors.card },
    swatch: {
      height: t.sizes.iconLg,
      width: t.sizes.iconLg,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderRadius: t.radius.full,
    },
    swatchText: {
      fontSize: t.fontSize.xs,
      color: t.colors.primaryForeground,
      fontFamily: t.fonts.sansBold,
    },
    staffName: {
      color: t.colors.foreground,
      paddingRight: t.spacing.xs,
      fontSize: t.fontSize.base,
      maxWidth: 110,
    },
  }));

  if (staff.length === 0) return null;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}>
      <Pressable
        onPress={() => onSelect(null)}
        style={[styles.chip, selected === null ? styles.chipActive : styles.chipInactive]}>
        <Users
          size={theme.sizes.iconSm - 3}
          color={selected === null ? theme.colors.primary : theme.iconColors.muted}
          strokeWidth={1.8}
        />
        <Text
          style={[
            styles.chipText,
            selected === null ? styles.chipTextActive : styles.chipTextInactive,
          ]}>
          همه
        </Text>
      </Pressable>

      {staff.map((s) => {
        const active = selected === s.id;
        const hex = staffHex(s.color);
        return (
          <Pressable
            key={s.id}
            onPress={() => onSelect(active ? null : s.id)}
            style={[
              styles.staffChip,
              active ? styles.staffChipActive : styles.staffChipInactive,
              { borderColor: active ? hex : withAlpha(theme.colors.border, 0.7) },
            ]}>
            <View style={[styles.swatch, { backgroundColor: hex }]}>
              <Text style={styles.swatchText}>{initials(s.name)}</Text>
            </View>
            <Text
              style={[
                styles.staffName,
                { fontFamily: active ? theme.fonts.sansSemiBold : theme.fonts.sansMedium },
              ]}
              numberOfLines={1}>
              {s.name}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
