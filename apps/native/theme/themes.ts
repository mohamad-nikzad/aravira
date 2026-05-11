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

function createTheme(mode: ThemeMode): Theme {
  const colors = tokens.colors[mode] as ThemeColorMap;

  return {
    mode,
    colors,
    brand: tokens.colors.brand,
    radius: tokens.radius,
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
