import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { Redirect, useSegments } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Skeleton } from './ui/skeleton';
import { useAuth } from './auth-provider';
import { useTheme } from '../theme';
import type { Theme } from '../theme/types';

function AppShellSkeleton() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Skeleton height={24} width={80} />
      </View>
      <View style={styles.content}>
        <Skeleton height={40} width="100%" />
        <Skeleton height={112} width="100%" radius={12} />
        <Skeleton height={112} width="100%" radius={12} />
        <Skeleton height={80} width="100%" radius={12} />
      </View>
      <View style={[styles.nav, { paddingBottom: insets.bottom }]}>
        {Array.from({ length: 4 }).map((_, i) => (
          <View key={i} style={styles.navItem}>
            <Skeleton height={28} width={28} radius={8} />
            <Skeleton height={12} width={32} radius={4} />
          </View>
        ))}
      </View>
    </View>
  );
}

const PUBLIC_SEGMENTS = new Set(['login', 'signup']);

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const topSegment = segments[0];
  const inPublicRoute = topSegment ? PUBLIC_SEGMENTS.has(topSegment) : false;

  if (loading) {
    return <AppShellSkeleton />;
  }

  if (!user && !inPublicRoute) {
    return <Redirect href="/login" />;
  }

  if (user && inPublicRoute) {
    return <Redirect href="/today" />;
  }

  return <>{children}</>;
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      backgroundColor: theme.colors.background,
      flex: 1,
    },
    content: {
      flex: 1,
      gap: 12,
      padding: 16,
    },
    header: {
      alignItems: 'center',
      backgroundColor: theme.colors.card,
      borderBottomColor: theme.colors.border,
      borderBottomWidth: 1,
      flexDirection: 'row',
      gap: 16,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    nav: {
      alignItems: 'stretch',
      backgroundColor: theme.colors.card,
      borderTopColor: theme.colors.border,
      borderTopWidth: 1,
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    navItem: {
      alignItems: 'center',
      flex: 1,
      gap: 4,
      justifyContent: 'center',
      minHeight: 56,
      minWidth: 0,
      paddingVertical: 6,
    },
  });
}
