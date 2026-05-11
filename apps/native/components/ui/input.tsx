import * as React from 'react';
import { TextInput, type TextInputProps } from 'react-native';

import { useTheme } from '../../theme';

export type InputProps = TextInputProps;

function Input({ placeholderTextColor, style, ...props }: InputProps) {
  const { theme } = useTheme();

  return (
    <TextInput
      placeholderTextColor={placeholderTextColor ?? theme.colors.mutedForeground}
      style={[
        {
          backgroundColor: theme.colors.background,
          borderColor: theme.colors.input,
          borderRadius: theme.radius.md,
          borderWidth: 1,
          color: theme.colors.foreground,
          fontFamily: theme.fonts.sans,
          fontSize: 14,
          height: 44,
          includeFontPadding: false,
          lineHeight: 20,
          paddingHorizontal: 12,
          writingDirection: 'rtl',
          width: '100%',
        },
        style,
      ]}
      {...props}
    />
  );
}

export { Input };
