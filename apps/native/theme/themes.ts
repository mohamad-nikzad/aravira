import { nativeTokens } from '@repo/brand-tokens/generated/native';
import { resolveCalendarColor } from '@repo/salon-core';
import type {
  AppointmentStatusId,
  AppointmentStatusTheme,
  CalendarColorTheme,
  Theme,
  ThemeColorMap,
  ThemeMode,
} from './types';
import { withAlpha } from './utils';

const tokens = nativeTokens;

const spacing = {
  none: 0,
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  '4xl': 32,
  '5xl': 48,
  '6xl': 64,
} as const;

const fontSize = {
  xs: 10,
  sm: 11,
  base: 12,
  md: 13,
  lg: 15,
  xl: 17,
  '2xl': 20,
  '3xl': 24,
} as const;

const sizes = {
  iconSm: 16,
  iconMd: 20,
  iconLg: 24,
  avatarSm: 32,
  avatarMd: 40,
  controlSm: 32,
  controlMd: 36,
  controlLg: 44,
  hairline: 1,
} as const;

const fontWeights = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

function createTheme(mode: ThemeMode): Theme {
  const colors = tokens.colors[mode] as ThemeColorMap;

  return {
    mode,
    colors,
    brand: tokens.colors.brand,
    radius: { ...tokens.radius, full: 999 },
    spacing,
    fontSize,
    sizes,
    fontWeights,
    fonts: tokens.fontFamily,
    iconColors: {
      default: colors.foreground,
      muted: colors.mutedForeground,
      primary: colors.primary,
      destructive: colors.destructive,
      onPrimary: colors.primaryForeground,
      onAccent: colors.accentForeground,
    },
    statusBarStyle: mode === 'dark' ? 'light' : 'dark',
    navigationTheme: {
      dark: mode === 'dark',
      colors: {
        primary: colors.primary,
        background: colors.background,
        card: colors.card,
        text: colors.foreground,
        border: colors.border,
        notification: colors.destructive,
      },
    },
    states: {
      pressed: { opacity: 0.82 },
      disabled: { opacity: 0.46 },
      loading: { opacity: 0.72 },
    },
  };
}

export const lightTheme = createTheme('light');
export const darkTheme = createTheme('dark');

export function getTheme(mode: ThemeMode): Theme {
  return mode === 'dark' ? darkTheme : lightTheme;
}

export function getAppointmentStatusTheme(
  status: AppointmentStatusId | string | null | undefined
): AppointmentStatusTheme {
  const resolvedStatus = isAppointmentStatusId(status) ? status : 'scheduled';
  const palette = tokens.colors.appointmentStatus[resolvedStatus];

  return {
    background: palette.background,
    foreground: palette.foreground,
    border: palette.border,
  };
}

export function getCalendarColorTheme(
  theme: Theme,
  value: string | null | undefined
): CalendarColorTheme {
  const id = resolveCalendarColor(value);
  const option = tokens.colors.calendar[id];
  const swatch = option[theme.mode];

  return {
    id,
    labelFa: option.labelFa,
    swatch,
    background: withAlpha(swatch, theme.mode === 'dark' ? 0.22 : 0.16),
    foreground: swatch,
    border: withAlpha(swatch, theme.mode === 'dark' ? 0.72 : 0.5),
  };
}

function isAppointmentStatusId(
  status: AppointmentStatusId | string | null | undefined
): status is AppointmentStatusId {
  return (
    status === 'scheduled' ||
    status === 'confirmed' ||
    status === 'completed' ||
    status === 'cancelled' ||
    status === 'no-show'
  );
}
