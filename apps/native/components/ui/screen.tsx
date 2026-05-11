import * as React from 'react';
import { ScrollView, type ScrollViewProps, type ViewProps } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { useTheme } from '../../theme';

export type ScreenProps = ViewProps & {
  edges?: Edge[];
};

function Screen({ edges = ['top'], style, ...props }: ScreenProps) {
  const { theme } = useTheme();

  return (
    <SafeAreaView
      edges={edges}
      style={[{ backgroundColor: theme.colors.background, flex: 1 }, style]}
      {...props}
    />
  );
}

export type ScreenScrollProps = ScrollViewProps & {
  edges?: Edge[];
};

function ScreenScroll({
  edges = ['top'],
  contentContainerStyle,
  style,
  ...props
}: ScreenScrollProps) {
  const { theme } = useTheme();

  return (
    <SafeAreaView edges={edges} style={{ backgroundColor: theme.colors.background, flex: 1 }}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[{ padding: 16 }, contentContainerStyle]}
        style={[{ backgroundColor: theme.colors.background }, style]}
        {...props}
      />
    </SafeAreaView>
  );
}

export { Screen, ScreenScroll };
