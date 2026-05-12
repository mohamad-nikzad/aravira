import * as React from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';

import { useTheme } from '../../theme';

export type InputProps = TextInputProps & {
  error?: boolean;
  rightAdornment?: React.ReactNode;
};

const Input = React.forwardRef<TextInput, InputProps>(function Input(
  { placeholderTextColor, style, error, rightAdornment, onFocus, onBlur, editable, ...props },
  ref
) {
  const { theme } = useTheme();
  const [focused, setFocused] = React.useState(false);

  const borderColor = error
    ? theme.colors.destructive
    : focused
      ? theme.colors.primary
      : theme.colors.input;

  const input = (
    <TextInput
      ref={ref}
      editable={editable}
      placeholderTextColor={placeholderTextColor ?? theme.colors.mutedForeground}
      onFocus={(event) => {
        setFocused(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setFocused(false);
        onBlur?.(event);
      }}
      style={[
        {
          backgroundColor: theme.colors.background,
          borderColor,
          borderRadius: theme.radius.md,
          borderWidth: 1,
          color: theme.colors.foreground,
          fontFamily: theme.fonts.sans,
          fontSize: 14,
          height: 44,
          includeFontPadding: false,
          lineHeight: 20,
          paddingHorizontal: 12,
          paddingLeft: rightAdornment ? 44 : 12,
          writingDirection: 'rtl',
          width: '100%',
          opacity: editable === false ? theme.states.disabled.opacity : 1,
        },
        style,
      ]}
      {...props}
    />
  );

  if (!rightAdornment) return input;

  return (
    <View style={{ position: 'relative', width: '100%' }}>
      {input}
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          left: 4,
          top: 0,
          bottom: 0,
          justifyContent: 'center',
        }}>
        {rightAdornment}
      </View>
    </View>
  );
});

export { Input };
