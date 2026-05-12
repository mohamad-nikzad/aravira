import * as React from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../../theme';

export type IconButtonProps = Omit<PressableProps, 'style' | 'children'> & {
  /** Required accessible label — icon buttons have no visible text. */
  accessibilityLabel: string;
  /** Visual size of the control. Below 44pt, hitSlop pads the touch target. */
  size?: number;
  /** Optional background variant for the visual frame. */
  variant?: 'plain' | 'muted' | 'tinted';
  /** Optional border radius override. */
  radius?: number;
  /** Optional extra style. */
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

const MIN_TOUCH_TARGET = 44;

export function IconButton({
  accessibilityLabel,
  accessibilityHint,
  accessibilityState,
  size = 44,
  variant = 'plain',
  radius,
  disabled,
  style,
  children,
  ...rest
}: IconButtonProps) {
  const { theme } = useTheme();
  const padding = Math.max(0, Math.ceil((MIN_TOUCH_TARGET - size) / 2));
  const background =
    variant === 'plain'
      ? 'transparent'
      : variant === 'muted'
        ? theme.colors.muted
        : theme.colors.accent;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled, ...accessibilityState }}
      hitSlop={padding > 0 ? padding : undefined}
      disabled={disabled}
      style={({ pressed }) => [
        {
          height: size,
          width: size,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: background,
          borderRadius: radius ?? theme.radius.full,
        },
        pressed ? theme.states.pressed : null,
        disabled ? theme.states.disabled : null,
        style,
      ]}
      {...rest}>
      {children}
    </Pressable>
  );
}
