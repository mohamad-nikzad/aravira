import * as React from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Check, ChevronDown } from 'lucide-react-native';
import { useTheme, useThemeStyles, withAlpha } from '../../theme';
import { AppText } from './app-text';

export type SelectOption = {
  value: string;
  label: string;
  detail?: string;
  disabled?: boolean;
};

export type SelectGroup = {
  label?: string;
  options: SelectOption[];
};

export type SelectProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  title?: string;
  options?: SelectOption[];
  groups?: SelectGroup[];
  disabled?: boolean;
};

export function Select({
  value,
  onChange,
  placeholder = 'انتخاب کنید',
  title,
  options,
  groups,
  disabled,
}: SelectProps) {
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
    triggerDisabled: { opacity: t.states.disabled.opacity },
    triggerText: {
      fontSize: t.fontSize.base,
      flex: 1,
      writingDirection: 'rtl' as const,
    },
    triggerTextSelected: { color: t.colors.foreground },
    triggerTextPlaceholder: { color: t.colors.mutedForeground },
    backdrop: {
      flex: 1,
      justifyContent: 'flex-end' as const,
      backgroundColor: withAlpha('#000000', 0.4),
    },
    sheet: {
      borderTopLeftRadius: t.radius.xl,
      borderTopRightRadius: t.radius.xl,
      backgroundColor: t.colors.card,
      paddingBottom: t.spacing['3xl'],
      paddingTop: t.spacing.xl,
      maxHeight: '80%' as const,
    },
    titleWrap: {
      paddingHorizontal: t.spacing.xl,
      paddingBottom: t.spacing.lg,
    },
    title: {
      fontSize: t.fontSize.lg,
      color: t.colors.foreground,
      fontFamily: t.fonts.sansBold,
    },
    list: { maxHeight: 480 },
    listInner: {
      paddingHorizontal: t.spacing.md,
      paddingBottom: t.spacing.md,
    },
    groupLabel: {
      fontSize: t.fontSize.sm,
      color: t.colors.mutedForeground,
      fontFamily: t.fonts.sansMedium,
      paddingHorizontal: t.spacing.lg,
      paddingTop: t.spacing.lg,
      paddingBottom: t.spacing.xs,
    },
  }));

  const allOptions = React.useMemo(() => {
    if (groups) return groups.flatMap((g) => g.options);
    return options ?? [];
  }, [options, groups]);

  const selected = allOptions.find((o) => o.value === value);
  const displayText = selected?.label ?? placeholder;

  return (
    <>
      <Pressable
        onPress={() => !disabled && setOpen(true)}
        disabled={disabled}
        style={[styles.trigger, disabled && styles.triggerDisabled]}>
        <AppText
          style={[
            styles.triggerText,
            selected ? styles.triggerTextSelected : styles.triggerTextPlaceholder,
          ]}
          numberOfLines={1}>
          {displayText}
        </AppText>
        <ChevronDown size={theme.sizes.iconSm} color={theme.iconColors.muted} strokeWidth={1.6} />
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable onPress={() => setOpen(false)} style={styles.backdrop}>
          <Pressable onPress={(e) => e.stopPropagation()} style={styles.sheet}>
            {title ? (
              <View style={styles.titleWrap}>
                <Text style={styles.title}>{title}</Text>
              </View>
            ) : null}

            <ScrollView style={styles.list}>
              <View style={styles.listInner}>
                {groups
                  ? groups.map((g, gi) => (
                      <View key={gi}>
                        {g.label ? <Text style={styles.groupLabel}>{g.label}</Text> : null}
                        {g.options.map((opt) => (
                          <OptionRow
                            key={opt.value}
                            option={opt}
                            selected={opt.value === value}
                            onPress={() => {
                              if (opt.disabled) return;
                              onChange(opt.value);
                              setOpen(false);
                            }}
                          />
                        ))}
                      </View>
                    ))
                  : (options ?? []).map((opt) => (
                      <OptionRow
                        key={opt.value}
                        option={opt}
                        selected={opt.value === value}
                        onPress={() => {
                          if (opt.disabled) return;
                          onChange(opt.value);
                          setOpen(false);
                        }}
                      />
                    ))}
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function OptionRow({
  option,
  selected,
  onPress,
}: {
  option: SelectOption;
  selected: boolean;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  const styles = useThemeStyles((t) => ({
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingHorizontal: t.spacing.lg,
      paddingVertical: t.spacing.lg,
      borderRadius: t.radius.md,
      gap: t.spacing.md,
    },
    checkPlaceholder: { width: t.sizes.iconSm },
    contentWrap: { flex: 1 },
    label: {
      fontFamily: t.fonts.sansMedium,
      fontSize: t.fontSize.md,
      color: t.colors.foreground,
    },
    detail: {
      fontFamily: t.fonts.sans,
      fontSize: t.fontSize.sm,
      color: t.colors.mutedForeground,
      marginTop: t.spacing.xs / 2,
    },
  }));

  return (
    <Pressable
      onPress={onPress}
      disabled={option.disabled}
      style={({ pressed }) => [
        styles.row,
        {
          opacity: option.disabled
            ? theme.states.disabled.opacity
            : pressed
              ? theme.states.pressed.opacity
              : 1,
          backgroundColor: selected ? withAlpha(theme.colors.accent, 0.25) : 'transparent',
        },
      ]}>
      {selected ? (
        <Check size={theme.sizes.iconSm} color={theme.colors.primary} strokeWidth={2} />
      ) : (
        <View style={styles.checkPlaceholder} />
      )}
      <View style={styles.contentWrap}>
        <Text style={styles.label} numberOfLines={2}>
          {option.label}
        </Text>
        {option.detail ? <Text style={styles.detail}>{option.detail}</Text> : null}
      </View>
    </Pressable>
  );
}
