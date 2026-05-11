import * as React from 'react';
import { Text, type TextProps } from 'react-native';
import { useThemeStyles } from '../../theme';

function Label({ style, ...props }: TextProps) {
  const styles = useThemeStyles((theme) => ({
    label: {
      fontSize: theme.fontSize.base,
      fontWeight: theme.fontWeights.medium,
      color: theme.colors.foreground,
      fontFamily: theme.fonts.sansMedium,
    },
  }));

  return <Text style={[styles.label, style]} {...props} />;
}

export { Label };
