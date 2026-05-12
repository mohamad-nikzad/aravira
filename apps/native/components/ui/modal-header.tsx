import * as React from 'react';
import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { X } from 'lucide-react-native';
import { useTheme, useThemeStyles } from '../../theme';

export type ModalHeaderProps = {
  title?: string;
  subtitle?: string;
  onClose?: () => void;
  closeLabel?: string;
  right?: React.ReactNode;
  left?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  borderless?: boolean;
};

export function ModalHeader({
  title,
  subtitle,
  onClose,
  closeLabel = 'بستن',
  right,
  left,
  style,
  borderless,
}: ModalHeaderProps) {
  const { theme } = useTheme();
  const styles = useThemeStyles((t) => ({
    container: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      gap: t.spacing.md,
      paddingHorizontal: t.spacing.xl,
      paddingVertical: t.spacing.lg,
      borderBottomWidth: t.sizes.hairline,
      borderBottomColor: t.colors.border,
    },
    containerBorderless: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      gap: t.spacing.md,
      paddingHorizontal: t.spacing.xl,
      paddingBottom: t.spacing.lg,
    },
    titleWrap: { flex: 1, minWidth: 0 },
    title: {
      fontSize: t.fontSize.lg,
      color: t.colors.foreground,
      fontFamily: t.fonts.sansBold,
    },
    subtitle: {
      marginTop: t.spacing.xs / 2,
      fontSize: t.fontSize.sm,
      color: t.colors.mutedForeground,
      fontFamily: t.fonts.sans,
    },
    closeBtn: {
      minHeight: t.sizes.controlLg,
      minWidth: t.sizes.controlLg,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderRadius: t.radius.full,
      backgroundColor: t.colors.muted,
    },
  }));

  return (
    <View style={[borderless ? styles.containerBorderless : styles.container, style]}>
      {left ?? <View />}
      <View style={styles.titleWrap}>
        {title ? (
          <Text numberOfLines={1} style={styles.title}>
            {title}
          </Text>
        ) : null}
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right ??
        (onClose ? (
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={closeLabel}
            hitSlop={8}
            style={({ pressed }) => [styles.closeBtn, pressed ? theme.states.pressed : null]}>
            <X size={theme.sizes.iconSm} color={theme.colors.foreground} strokeWidth={2} />
          </Pressable>
        ) : null)}
    </View>
  );
}
