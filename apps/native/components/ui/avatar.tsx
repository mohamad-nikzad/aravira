import * as React from 'react';
import {
  Text,
  View,
  type StyleProp,
  type TextProps,
  type TextStyle,
  type ViewProps,
  type ViewStyle,
} from 'react-native';

import { tw } from '../../lib/utils';
function Avatar({ style, ...props }: ViewProps) {
  return (
    <View
      style={[
        tw('h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-muted'),
        style,
      ]}
      {...props}
    />
  );
}

function AvatarFallback({
  style,
  textStyle,
  children,
  ...props
}: ViewProps & { textStyle?: StyleProp<TextStyle>; children?: React.ReactNode }) {
  return (
    <View style={[tw('h-full w-full items-center justify-center'), style]} {...props}>
      {typeof children === 'string' ? (
        <Text
          style={[
            tw('text-sm font-medium text-foreground'),
            { fontFamily: 'Vazirmatn_500Medium' },
            textStyle,
          ]}>
          {children}
        </Text>
      ) : (
        children
      )}
    </View>
  );
}

export { Avatar, AvatarFallback };
export type AvatarProps = ViewProps;
export type AvatarFallbackProps = ViewProps & { textStyle?: StyleProp<TextStyle> };
