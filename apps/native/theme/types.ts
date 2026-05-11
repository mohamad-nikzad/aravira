import type { ImageStyle, TextStyle, ViewStyle } from 'react-native';
import type { CalendarColorId } from '@repo/salon-core';

export type ThemeMode = 'light' | 'dark';

export type IconColorRole =
  | 'default'
  | 'muted'
  | 'primary'
  | 'destructive'
  | 'onPrimary'
  | 'onAccent';

export type ThemeColorName =
  | 'background'
  | 'foreground'
  | 'card'
  | 'cardForeground'
  | 'popover'
  | 'popoverForeground'
  | 'primary'
  | 'primaryForeground'
  | 'secondary'
  | 'secondaryForeground'
  | 'muted'
  | 'mutedForeground'
  | 'accent'
  | 'accentForeground'
  | 'destructive'
  | 'destructiveForeground'
  | 'border'
  | 'input'
  | 'ring';

export type AppointmentStatusId = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';

export type ThemeColorMap = Record<ThemeColorName, string>;

export type ThemeStateStyles = {
  pressed: ViewStyle;
  disabled: ViewStyle;
  loading: ViewStyle;
};

export type Theme = {
  mode: ThemeMode;
  colors: ThemeColorMap;
  brand: {
    plum: string;
    rose: string;
    blush: string;
    mist: string;
    paper: string;
    sage: string;
  };
  radius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    base: number;
  };
  fonts: {
    sans: string;
    sansMedium: string;
    sansSemiBold: string;
    sansBold: string;
    sansExtraBold: string;
    mono: string;
  };
  iconColors: Record<IconColorRole, string>;
  statusBarStyle: 'light' | 'dark';
  navigationTheme: {
    dark: boolean;
    colors: {
      primary: string;
      background: string;
      card: string;
      text: string;
      border: string;
      notification: string;
    };
  };
  states: ThemeStateStyles;
};

export type ThemedStyle = ViewStyle | TextStyle | ImageStyle;
export type ThemedStyleSheet<T> = Record<keyof T, ThemedStyle>;

export type CalendarColorTheme = {
  id: CalendarColorId;
  labelFa: string;
  swatch: string;
  background: string;
  foreground: string;
  border: string;
};

export type AppointmentStatusTheme = {
  background: string;
  foreground: string;
  border: string;
};
