import * as React from 'react';
import { ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { AppText, Card, CardContent, CardDescription, CardTitle } from './ui';
import { Screen } from './ui/screen';
import { useTheme } from '../theme';
import type { Theme } from '../theme/types';

export function ScreenShell({
  title,
  emptyTitle,
  emptyDescription,
  icon,
  children,
}: {
  title: string;
  emptyTitle: string;
  emptyDescription: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <Screen edges={['top']}>
      <View style={styles.header}>
        <AppText variant="title" weight="bold">
          {title}
        </AppText>
      </View>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.contentContainer}>
        <AppEmptyState title={emptyTitle} description={emptyDescription} icon={icon} />
        {children}
      </ScrollView>
    </Screen>
  );
}

export function AppEmptyState({
  title,
  description,
  icon,
  style,
}: {
  title: string;
  description: string;
  icon?: React.ReactNode;
  style?: ViewStyle;
}) {
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <Card style={style}>
      <CardContent style={styles.stateContent}>
        {icon}
        <CardTitle>{title}</CardTitle>
        <CardDescription align="center">{description}</CardDescription>
      </CardContent>
    </Card>
  );
}

export function AppErrorState({
  title,
  description,
  style,
}: {
  title: string;
  description: string;
  style?: ViewStyle;
}) {
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <Card style={style}>
      <CardContent style={styles.stateContent}>
        <CardTitle color="destructive">{title}</CardTitle>
        <CardDescription align="center" color="destructive">
          {description}
        </CardDescription>
      </CardContent>
    </Card>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    contentContainer: {
      gap: 16,
      padding: 16,
    },
    header: {
      alignItems: 'center',
      backgroundColor: theme.colors.card,
      borderBottomColor: theme.colors.border,
      borderBottomWidth: 1,
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    stateContent: {
      alignItems: 'center',
      gap: 12,
      paddingVertical: 40,
    },
  });
}
