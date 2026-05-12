import * as React from 'react';
import { Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Bell,
  ChevronLeft,
  Clock3,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Moon,
  Sun,
  UserRoundSearch,
  Users,
} from 'lucide-react-native';
import { displayPhone } from '@repo/salon-core/phone';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { useAuth } from '../../components/auth-provider';
import { ServicesCard } from '../../components/services/services-card';
import { useTheme, useThemeStyles, withAlpha } from '../../theme';

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2);
}

type ManagerLink = {
  label: string;
  hint: string;
  route: string;
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
};

const MANAGER_LINKS: ManagerLink[] = [
  {
    label: 'داشبورد و آمار',
    hint: 'گزارش‌های روزانه و عملکرد',
    route: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'پیگیری مشتریان',
    hint: 'مشتریانی که نیاز به پیگیری دارند',
    route: '/retention',
    icon: UserRoundSearch,
  },
  {
    label: 'پرسنل و نقش‌ها',
    hint: 'مدیریت پرسنل، خدمات و ساعت کاری',
    route: '/staff',
    icon: Users,
  },
  {
    label: 'راه‌اندازی سالن',
    hint: 'مراحل آماده‌سازی سالن',
    route: '/onboarding',
    icon: ListChecks,
  },
  {
    label: 'ساعات کاری',
    hint: 'تنظیم ساعت شروع، پایان و فاصله نوبت‌ها',
    route: '/business-hours',
    icon: Clock3,
  },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme, mode, toggleTheme } = useTheme();
  const isManager = user?.role === 'manager';
  const isDark = mode === 'dark';

  const styles = useThemeStyles((t) => ({
    safe: { backgroundColor: t.colors.background, flex: 1 },
    header: {
      borderBottomColor: withAlpha(t.colors.border, 0.5),
      backgroundColor: t.colors.card,
      borderBottomWidth: t.sizes.hairline,
      paddingHorizontal: t.spacing.xl,
      paddingVertical: t.spacing.lg,
    },
    headerTitle: {
      color: t.colors.foreground,
      fontSize: t.fontSize.xl,
      fontFamily: t.fonts.sansBold,
    },
    headerHint: {
      color: t.colors.mutedForeground,
      fontSize: t.fontSize.sm,
      fontFamily: t.fonts.sans,
      marginTop: t.spacing.xs,
    },
    scroll: { padding: t.spacing.xl, gap: t.spacing.xl },
    card: { gap: t.spacing.lg, padding: t.spacing.xl },
    cardHeaderPadding: { padding: 0 },
    cardContent: { gap: t.spacing.md, padding: 0 },
    profileRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: t.spacing.lg,
    },
    profileBody: { flex: 1, minWidth: 0, gap: t.spacing.xs },
    profileName: {
      color: t.colors.foreground,
      fontSize: t.fontSize.base,
      fontFamily: t.fonts.sansSemiBold,
    },
    profilePhone: {
      color: t.colors.mutedForeground,
      fontSize: t.fontSize.sm,
      fontFamily: t.fonts.sans,
    },
    roleBadge: { alignSelf: 'flex-start' as const, paddingHorizontal: t.spacing.sm },
    rowBetween: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
    },
    label: {
      color: t.colors.foreground,
      fontSize: t.fontSize.base,
      fontFamily: t.fonts.sansMedium,
    },
    muted: {
      color: t.colors.mutedForeground,
      fontSize: t.fontSize.base,
      fontFamily: t.fonts.sans,
    },
    logoutRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: t.spacing.lg,
      paddingVertical: t.spacing.md,
    },
    logoutLabel: {
      color: t.colors.destructive,
      fontSize: t.fontSize.base,
      fontFamily: t.fonts.sansMedium,
    },
    navRow: {
      borderColor: withAlpha(t.colors.border, 0.5),
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      gap: t.spacing.lg,
      borderRadius: t.radius.lg,
      borderWidth: t.sizes.hairline,
      paddingHorizontal: t.spacing.lg,
      paddingVertical: t.spacing.lg,
    },
    navLeft: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: t.spacing.lg,
    },
    navHint: {
      color: t.colors.mutedForeground,
      fontSize: t.fontSize.sm,
      fontFamily: t.fonts.sans,
    },
    themeRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      gap: t.spacing.lg,
    },
    themeLeft: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: t.spacing.md,
    },
    footer: {
      alignItems: 'center' as const,
      paddingTop: t.spacing.xl,
      paddingBottom: t.spacing.md,
    },
    footerLabel: {
      color: t.colors.mutedForeground,
      fontSize: t.fontSize.sm,
      fontFamily: t.fonts.sansMedium,
    },
    footerVersion: {
      color: t.colors.mutedForeground,
      fontSize: t.fontSize.xs,
      fontFamily: t.fonts.sans,
    },
  }));

  if (!user) return null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{isManager ? 'بیشتر' : 'تنظیمات'}</Text>
        {isManager ? <Text style={styles.headerHint}>مدیریت، گزارش‌ها و تنظیمات سالن</Text> : null}
      </View>

      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.scroll}>
        <Card style={styles.card}>
          <View style={styles.profileRow}>
            <Avatar>
              <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            <View style={styles.profileBody}>
              <Text style={styles.profileName} numberOfLines={1}>
                {user.name}
              </Text>
              <Text style={styles.profilePhone} numberOfLines={1}>
                {displayPhone(user.phone)}
              </Text>
              <Badge variant="secondary" style={styles.roleBadge}>
                {isManager ? 'مدیر' : 'پرسنل'}
              </Badge>
            </View>
          </View>
        </Card>

        {isManager ? (
          <Card style={styles.card}>
            <CardHeader style={styles.cardHeaderPadding}>
              <CardTitle color="mutedForeground" variant="label" weight="medium">
                مدیریت
              </CardTitle>
            </CardHeader>
            <CardContent style={styles.cardContent}>
              {MANAGER_LINKS.map((link) => {
                const Icon = link.icon;
                return (
                  <Pressable
                    key={link.route}
                    accessibilityRole="button"
                    onPress={() => router.push(link.route as never)}
                    style={styles.navRow}>
                    <View style={styles.navLeft}>
                      <Icon
                        size={theme.sizes.iconSm + 2}
                        color={theme.colors.primary}
                        strokeWidth={1.8}
                      />
                      <View>
                        <Text style={styles.label}>{link.label}</Text>
                        <Text style={styles.navHint}>{link.hint}</Text>
                      </View>
                    </View>
                    <ChevronLeft
                      size={theme.sizes.iconSm + 2}
                      color={theme.iconColors.muted}
                      strokeWidth={1.6}
                    />
                  </Pressable>
                );
              })}
            </CardContent>
          </Card>
        ) : null}

        {isManager ? <ServicesCard /> : null}

        <Card style={styles.card}>
          <CardHeader style={styles.cardHeaderPadding}>
            <CardTitle color="mutedForeground" variant="label" weight="medium">
              اعلان‌ها
            </CardTitle>
          </CardHeader>
          <CardContent style={styles.cardContent}>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/push-settings' as never)}
              style={styles.navRow}>
              <View style={styles.navLeft}>
                <Bell
                  size={theme.sizes.iconSm + 2}
                  color={theme.colors.primary}
                  strokeWidth={1.8}
                />
                <View>
                  <Text style={styles.label}>اعلان نوبت‌ها</Text>
                  <Text style={styles.navHint}>تنظیم اعلان‌های روی این دستگاه</Text>
                </View>
              </View>
              <ChevronLeft
                size={theme.sizes.iconSm + 2}
                color={theme.iconColors.muted}
                strokeWidth={1.6}
              />
            </Pressable>
          </CardContent>
        </Card>

        <Card style={styles.card}>
          <CardHeader style={styles.cardHeaderPadding}>
            <CardTitle color="mutedForeground" variant="label" weight="medium">
              ظاهر
            </CardTitle>
          </CardHeader>
          <CardContent style={styles.cardContent}>
            <View style={styles.themeRow}>
              <View style={styles.themeLeft}>
                {isDark ? (
                  <Moon
                    size={theme.sizes.iconSm + 2}
                    color={theme.iconColors.muted}
                    strokeWidth={1.8}
                  />
                ) : (
                  <Sun
                    size={theme.sizes.iconSm + 2}
                    color={theme.iconColors.muted}
                    strokeWidth={1.8}
                  />
                )}
                <Text style={styles.label}>حالت تاریک</Text>
              </View>
              <Switch
                value={isDark}
                trackColor={{
                  false: theme.colors.input,
                  true: theme.mode === 'dark' ? theme.colors.secondary : theme.colors.accent,
                }}
                thumbColor={isDark ? theme.colors.primary : theme.colors.primaryForeground}
                ios_backgroundColor={theme.colors.input}
                onValueChange={() => {
                  void toggleTheme();
                }}
              />
            </View>
          </CardContent>
        </Card>

        <Card style={styles.card}>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              void logout();
            }}
            style={styles.logoutRow}>
            <LogOut
              size={theme.sizes.iconSm + 2}
              color={theme.colors.destructive}
              strokeWidth={1.8}
            />
            <Text style={styles.logoutLabel}>خروج از حساب</Text>
          </Pressable>
        </Card>

        <View style={styles.footer}>
          <Text style={styles.footerLabel}>سالورا</Text>
          <Text style={styles.footerVersion}>نسخه ۱.۰.۰</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
