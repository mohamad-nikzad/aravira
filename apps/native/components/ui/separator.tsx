import * as React from 'react';
import { View, type ViewProps } from 'react-native';

import { useTheme } from '../../theme';

export type SeparatorProps = ViewProps & {
  orientation?: 'horizontal' | 'vertical';
};

function Separator({ orientation = 'horizontal', style, ...props }: SeparatorProps) {
  const { theme } = useTheme();

  return (
    <View
      accessibilityRole="none"
      style={[
        { backgroundColor: theme.colors.border },
        orientation === 'horizontal' ? { height: 1, width: '100%' } : { height: '100%', width: 1 },
        style,
      ]}
      {...props}
    />
  );
}

export { Separator };
