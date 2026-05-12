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
          ...(elevated ? theme.elevation.sm : theme.elevation.none),
        },
        style,
      ]}
      {...props}
    />
  );
}

export { Surface };
