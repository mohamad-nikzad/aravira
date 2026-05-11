import * as React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Calendar, CalendarDays, Menu, Settings, Users } from 'lucide-react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import type { LucideIcon } from 'lucide-react-native';
import { AppText } from './ui';
import { useTheme } from '../theme';
import type { Theme } from '../theme/types';

type NavItem = {
  name: string;
  label: string;
  icon: LucideIcon;
};

const managerItems: readonly NavItem[] = [
  { name: 'today', label: 'امروز', icon: CalendarDays },
  { name: 'calendar', label: 'تقویم', icon: Calendar },
  { name: 'clients', label: 'مشتریان', icon: Users },
  { name: 'settings', label: 'بیشتر', icon: Menu },
] as const;

// TODO(phase-3): swap to staff variant when auth role is wired up.
const staffItems: readonly NavItem[] = [
  { name: 'today', label: 'امروز', icon: CalendarDays },
  { name: 'calendar', label: 'تقویم', icon: Calendar },
  { name: 'settings', label: 'تنظیمات', icon: Settings },
] as const;

export function BottomNav({
  state,
  navigation,
  role = 'manager',
}: BottomTabBarProps & { role?: 'manager' | 'staff' }) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const items = role === 'manager' ? managerItems : staffItems;
  const activeRoute = state.routes[state.index]?.name;

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom }]}>
      <View style={styles.inner}>
        {items.map((item) => {
          const isActive = activeRoute === item.name;
          const Icon = item.icon;
          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: state.routes.find((r) => r.name === item.name)?.key ?? item.name,
              canPreventDefault: true,
            });
            if (!isActive && !event.defaultPrevented) {
              navigation.navigate(item.name as never);
            }
          };

          return (
            <Pressable
              key={item.name}
              onPress={onPress}
              accessibilityRole="button"
              accessibilityState={isActive ? { selected: true } : {}}
              accessibilityLabel={item.label}
              style={({ pressed }) => [styles.item, pressed && theme.states.pressed]}>
              <View style={[styles.iconFrame, isActive && styles.iconFrameActive]}>
                <Icon
                  size={20}
                  color={isActive ? theme.iconColors.primary : theme.iconColors.muted}
                  strokeWidth={isActive ? 2.2 : 1.7}
                />
              </View>
              <AppText
                numberOfLines={1}
                variant="caption"
                weight="medium"
                color={isActive ? 'primary' : 'mutedForeground'}
                align="center"
                style={styles.label}>
                {item.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    root: {
      backgroundColor: theme.colors.card,
      borderTopColor: theme.colors.border,
      borderTopWidth: 1,
      flexShrink: 0,
    },
    inner: {
      alignItems: 'stretch',
      alignSelf: 'center',
      flexDirection: 'row',
      justifyContent: 'space-around',
      maxWidth: 512,
      width: '100%',
    },
    iconFrame: {
      alignItems: 'center',
      borderRadius: theme.radius.md,
      height: 32,
      justifyContent: 'center',
      width: 32,
    },
    iconFrameActive: {
      backgroundColor: theme.colors.accent,
    },
    item: {
      alignItems: 'center',
      flex: 1,
      gap: 2,
      justifyContent: 'center',
      minHeight: 56,
      minWidth: 0,
      paddingVertical: 6,
      position: 'relative',
    },
    label: {
      paddingHorizontal: 4,
    },
  });
}
