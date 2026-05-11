import * as React from 'react';
import {
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewProps,
} from 'react-native';
import { useThemeStyles } from '../../theme';

function Avatar({ style, ...props }: ViewProps) {
  const styles = useThemeStyles((theme) => ({
    avatar: {
      height: theme.sizes.avatarMd,
      width: theme.sizes.avatarMd,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.muted,
    },
  }));
  return <View style={[styles.avatar, style]} {...props} />;
}

function AvatarFallback({
  style,
  textStyle,
  children,
  ...props
}: ViewProps & { textStyle?: StyleProp<TextStyle>; children?: React.ReactNode }) {
  const styles = useThemeStyles((theme) => ({
    container: {
      height: '100%' as const,
      width: '100%' as const,
      alignItems: 'center',
      justifyContent: 'center',
    },
    text: {
      fontSize: theme.fontSize.base,
      fontWeight: theme.fontWeights.medium,
      color: theme.colors.foreground,
      fontFamily: theme.fonts.sansMedium,
    },
  }));

  return (
    <View style={[styles.container, style]} {...props}>
      {typeof children === 'string' ? (
        <Text style={[styles.text, textStyle]}>{children}</Text>
      ) : (
        children
      )}
    </View>
  );
}

export { Avatar, AvatarFallback };
export type AvatarProps = ViewProps;
export type AvatarFallbackProps = ViewProps & { textStyle?: StyleProp<TextStyle> };
