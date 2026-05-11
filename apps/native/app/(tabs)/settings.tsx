import * as React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, LogOut, Users } from 'lucide-react-native';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Separator } from '../../components/ui/separator';
import { useAuth } from '../../components/auth-provider';
import { ServicesCard } from '../../components/services/services-card';
import { useTheme, useThemeStyles, withAlpha } from '../../theme';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const isManager = user?.role === 'manager';
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
    scroll: { padding: t.spacing.xl, gap: t.spacing.xl },
    card: { gap: t.spacing.lg, padding: t.spacing.xl },
    cardHeaderPadding: { padding: 0 },
    cardContent: { gap: t.spacing.md, padding: 0 },
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

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{isManager ? 'بیشتر' : 'تنظیمات'}</Text>
      </View>

      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.scroll}>
        <Card style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.label}>کاربر فعلی</Text>
            <Text style={styles.muted}>
              {user?.name} · {isManager ? 'مدیر' : 'کارمند'}
            </Text>
          </View>
          <Separator />
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              void logout();
            }}
            style={styles.logoutRow}>
            <LogOut size={theme.sizes.iconSm + 2} color={theme.colors.primary} strokeWidth={1.8} />
            <Text style={styles.label}>خروج</Text>
          </Pressable>
        </Card>

        {isManager ? (
          <>
            <Card style={styles.card}>
              <CardHeader style={styles.cardHeaderPadding}>
                <CardTitle color="mutedForeground" variant="label" weight="medium">
                  مدیریت
                </CardTitle>
              </CardHeader>
              <CardContent style={styles.cardContent}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push('/staff')}
                  style={styles.navRow}>
                  <View style={styles.navLeft}>
                    <Users
                      size={theme.sizes.iconSm + 2}
                      color={theme.colors.primary}
                      strokeWidth={1.8}
                    />
                    <View>
                      <Text style={styles.label}>پرسنل و نقش‌ها</Text>
                      <Text style={styles.navHint}>مدیریت پرسنل، خدمات و ساعت کاری</Text>
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

            <ServicesCard />
          </>
        ) : null}

        <View style={styles.footer}>
          <Text style={styles.footerLabel}>سالورا</Text>
          <Text style={styles.footerVersion}>نسخه ۱.۰.۰</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
