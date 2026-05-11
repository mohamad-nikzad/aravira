import * as React from 'react';
import { StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  darkTheme,
  getAppointmentStatusTheme,
  getCalendarColorTheme,
  getTheme,
  lightTheme,
} from './themes';
import type {
  AppointmentStatusId,
  AppointmentStatusTheme,
  CalendarColorTheme,
  Theme,
  ThemedStyleSheet,
  ThemeMode,
} from './types';

export const THEME_STORAGE_KEY = 'aravira-theme';

type ThemeContextValue = {
  mode: ThemeMode;
  theme: Theme;
  isThemeReady: boolean;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
  appointmentStatus: (
    status: AppointmentStatusId | string | null | undefined
  ) => AppointmentStatusTheme;
  calendarColor: (value: string | null | undefined) => CalendarColorTheme;
};

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = React.useState<ThemeMode>('light');
  const [isThemeReady, setIsThemeReady] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;

    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((storedMode) => {
        if (!mounted) return;
        setMode(storedMode === 'dark' ? 'dark' : 'light');
      })
      .catch(() => {
        if (!mounted) return;
        setMode('light');
      })
      .finally(() => {
        if (mounted) setIsThemeReady(true);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const theme = mode === 'dark' ? darkTheme : lightTheme;

  const setThemeMode = React.useCallback(async (nextMode: ThemeMode) => {
    setMode(nextMode);
    await AsyncStorage.setItem(THEME_STORAGE_KEY, nextMode);
  }, []);

  const toggleTheme = React.useCallback(async () => {
    const nextMode = mode === 'dark' ? 'light' : 'dark';
    await setThemeMode(nextMode);
  }, [mode, setThemeMode]);

  const value = React.useMemo<ThemeContextValue>(
    () => ({
      mode,
      theme,
      isThemeReady,
      setThemeMode,
      toggleTheme,
      appointmentStatus: getAppointmentStatusTheme,
      calendarColor: (colorValue) => getCalendarColorTheme(theme, colorValue),
    }),
    [isThemeReady, mode, setThemeMode, theme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = React.useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }

  return context;
}

export function useThemeStyles<T extends ThemedStyleSheet<T>>(
  createStyles: (theme: Theme) => T
): T {
  const { theme } = useTheme();

  return React.useMemo(() => StyleSheet.create(createStyles(theme)) as T, [createStyles, theme]);
}

export { darkTheme, getTheme, lightTheme };
