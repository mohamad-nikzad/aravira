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
    xxs: number;
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    '2xl': number;
    '3xl': number;
    '4xl': number;
    base: number;
    full: number;
  };
  spacing: {
    none: 0;
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    '2xl': number;
    '3xl': number;
    '4xl': number;
    '5xl': number;
    '6xl': number;
  };
  fontSize: {
    xs: number;
    sm: number;
    base: number;
    md: number;
    lg: number;
    xl: number;
    '2xl': number;
    '3xl': number;
  };
  sizes: {
    iconSm: number;
    iconMd: number;
    iconLg: number;
    avatarSm: number;
    avatarMd: number;
    controlSm: number;
    controlMd: number;
    controlLg: number;
    hairline: number;
  };
  fontWeights: {
    regular: '400';
    medium: '500';
    semibold: '600';
    bold: '700';
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
  scrim: string;
  shadowColor: string;
  charts: readonly string[];
  elevation: {
    none: ViewStyle;
    sm: ViewStyle;
    md: ViewStyle;
    lg: ViewStyle;
  };
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
