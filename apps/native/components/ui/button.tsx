import * as React from 'react';
import { Pressable, type PressableProps, type ViewStyle } from 'react-native';

import { useTheme } from '../../theme';
import type { ThemeColorName } from '../../theme/types';
import { AppText } from './app-text';

type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon' | 'icon-sm' | 'icon-lg';

const buttonSizeStyles: Record<ButtonSize, ViewStyle> = {
  default: { minHeight: 36, paddingHorizontal: 16 },
  sm: { minHeight: 32, paddingHorizontal: 12 },
  lg: { minHeight: 40, paddingHorizontal: 24 },
  icon: { height: 36, width: 36 },
  'icon-sm': { height: 32, width: 32 },
  'icon-lg': { height: 40, width: 40 },
};

export type ButtonProps = PressableProps & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children?: React.ReactNode;
};

function Button({
  variant = 'default',
  size = 'default',
  children,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const { theme } = useTheme();
  const variantStyle = {
    default: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
    destructive: {
      backgroundColor: theme.colors.destructive,
      borderColor: theme.colors.destructive,
    },
    outline: { backgroundColor: theme.colors.background, borderColor: theme.colors.border },
    secondary: { backgroundColor: theme.colors.secondary, borderColor: theme.colors.secondary },
    ghost: { backgroundColor: 'transparent', borderColor: 'transparent' },
    link: { backgroundColor: 'transparent', borderColor: 'transparent' },
  }[variant];
  const textColors: Record<ButtonVariant, ThemeColorName> = {
    default: 'primaryForeground',
    destructive: 'destructiveForeground',
    outline: 'foreground',
    secondary: 'secondaryForeground',
    ghost: 'foreground',
    link: 'primary',
  };
  const textColor = textColors[variant];

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={(state) => [
        {
          alignItems: 'center',
          borderRadius: theme.radius.md,
          borderWidth: variant === 'outline' ? 1 : 0,
          flexDirection: 'row',
          gap: 8,
          justifyContent: 'center',
        },
        buttonSizeStyles[size],
        variantStyle,
        state.pressed && theme.states.pressed,
        disabled && theme.states.disabled,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...props}>
      {typeof children === 'string' ? (
        <AppText
          color={textColor}
          variant="label"
          weight="medium"
          style={variant === 'link' && { textDecorationLine: 'underline' }}>
          {children}
        </AppText>
      ) : (
        children
      )}
    </Pressable>
  );
}

export { Button };
