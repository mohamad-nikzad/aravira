import * as React from 'react';
import { ActivityIndicator, type ActivityIndicatorProps } from 'react-native';

export type SpinnerProps = ActivityIndicatorProps & {
  className?: string;
};

function Spinner({ size = 'small', color = '#6B3A4A', ...props }: SpinnerProps) {
  return <ActivityIndicator size={size} color={color} {...props} />;
}

export { Spinner };
