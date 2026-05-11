import * as React from 'react';
import { View, type ViewProps } from 'react-native';

import { useTheme } from '../../theme';

export type SurfaceProps = ViewProps & {
  elevated?: boolean;
};

function Surface({ elevated = false, style, ...props }: SurfaceProps) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.xl,
          borderWidth: 1,
          shadowColor: theme.colors.foreground,
          shadowOpacity: elevated ? 0.08 : 0,
          shadowRadius: elevated ? 14 : 0,
          shadowOffset: { width: 0, height: elevated ? 6 : 0 },
          elevation: elevated ? 2 : 0,
        },
        style,
      ]}
      {...props}
    />
  );
}

export { Surface };
