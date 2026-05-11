import * as React from 'react';
import { ActivityIndicator, type ActivityIndicatorProps } from 'react-native';
import { useTheme } from '../../theme';

export type SpinnerProps = ActivityIndicatorProps;

function Spinner({ size = 'small', color, ...props }: SpinnerProps) {
  const { theme } = useTheme();
  return <ActivityIndicator size={size} color={color ?? theme.colors.primary} {...props} />;
}

export { Spinner };
