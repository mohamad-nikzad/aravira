import * as React from 'react';
import { Animated, type DimensionValue, type ViewProps } from 'react-native';

import { useTheme } from '../../theme';

export type SkeletonProps = ViewProps & {
  height?: DimensionValue;
  width?: DimensionValue;
  radius?: number;
};

function Skeleton({ height, radius, style, width, ...props }: SkeletonProps) {
  const { theme } = useTheme();
  const opacity = React.useRef(new Animated.Value(0.5)).current;

  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.5,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          backgroundColor: theme.colors.accent,
          borderRadius: radius ?? theme.radius.md,
          height,
          opacity,
          width,
        },
        style,
      ]}
      {...props}
    />
  );
}

export { Skeleton };
