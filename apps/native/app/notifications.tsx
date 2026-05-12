import * as React from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowRight, Bell, Check, CheckCheck, ChevronLeft, RefreshCw } from 'lucide-react-native';
import type { AppNotification } from '@repo/api-client';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { useAuth } from '../components/auth-provider';
import { notificationsApi } from '../lib/api';
import { useAsyncResource } from '../lib/hooks/use-async-resource';
import { useTheme, useThemeStyles, withAlpha } from '../theme';

function formatNotificationDate(value: string) {
  try {
    return new Intl.DateTimeFormat('fa-IR', {
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      month: 'short',
    }).format(new Date(value));
  } catch {
    return '';
  }
}

function groupNotifications(notifications: AppNotification[]) {
  const unread = notifications.filter((notification) => !notification.readAt);
  const recent = notifications.filter((notification) => notification.readAt).slice(0, 20);
  return { unread, recent };
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [readAllBusy, setReadAllBusy] = React.useState(false);
  const resource = useAsyncResource(
    user ? `notifications:${user.id}` : null,
    (signal) => notificationsApi.list({}, { signal }),
    [user?.id]
  );
  const notifications = React.useMemo(
    () => resource.data?.notifications ?? [],
    [resource.data?.notifications]
  );
  const { unread, recent } = React.useMemo(
    () => groupNotifications(notifications),
    [notifications]
  );

  const styles = useThemeStyles((t) => ({
    safe: { backgroundColor: t.colors.background, flex: 1 },
    header: {
      borderBottomColor: withAlpha(t.colors.border, 0.5),
      backgroundColor: t.colors.card,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: t.spacing.lg,
      borderBottomWidth: t.sizes.hairline,
      paddingHorizontal: t.spacing.lg,
      paddingVertical: t.spacing.lg,
    },
    backBtn: {
      height: t.sizes.avatarMd,
      width: t.sizes.avatarMd,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderRadius: t.radius.xl,
    },
    headerBody: { flex: 1, gap: t.spacing.xs },
    title: { color: t.colors.foreground, fontSize: t.fontSize.xl, fontFamily: t.fonts.sansBold },
    hint: { color: t.colors.mutedForeground, fontSize: t.fontSize.sm, fontFamily: t.fonts.sans },
    scroll: { padding: t.spacing.lg, gap: t.spacing.lg },
    card: { gap: t.spacing.md, padding: t.spacing.lg },
    cardHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      padding: 0,
    },
    sectionTitle: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: t.spacing.sm,
    },
    cardContent: { gap: t.spacing.sm, padding: 0 },
    notificationRow: {
      borderColor: withAlpha(t.colors.border, 0.55),
      borderRadius: t.radius.lg,
      borderWidth: t.sizes.hairline,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: t.spacing.md,
      paddingHorizontal: t.spacing.lg,
      paddingVertical: t.spacing.md,
    },
    notificationBody: { flex: 1, minWidth: 0, gap: t.spacing.xs },
    notificationTop: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      gap: t.spacing.md,
    },
    notificationTitle: {
      color: t.colors.foreground,
      flex: 1,
      fontFamily: t.fonts.sansSemiBold,
      fontSize: t.fontSize.base,
    },
    notificationText: {
      color: t.colors.mutedForeground,
      fontFamily: t.fonts.sans,
      fontSize: t.fontSize.sm,
      lineHeight: 22,
    },
    timeText: {
      color: t.colors.mutedForeground,
      fontFamily: t.fonts.sans,
      fontSize: t.fontSize.xs,
    },
    markButton: {
      alignItems: 'center' as const,
      borderRadius: t.radius.md,
      height: 32,
      justifyContent: 'center' as const,
      width: 32,
    },
    empty: {
      alignItems: 'center' as const,
      gap: t.spacing.sm,
      paddingVertical: t.spacing.xl,
    },
    emptyTitle: {
      color: t.colors.foreground,
      fontFamily: t.fonts.sansMedium,
      fontSize: t.fontSize.base,
    },
    emptyText: {
      color: t.colors.mutedForeground,
      fontFamily: t.fonts.sans,
      fontSize: t.fontSize.sm,
      textAlign: 'center' as const,
    },
  }));

  const markRead = React.useCallback(
    async (notification: AppNotification) => {
      if (notification.readAt) return;
      setBusyId(notification.id);
      try {
        await notificationsApi.markRead(notification.id);
        resource.reload();
      } finally {
        setBusyId(null);
      }
    },
    [resource]
  );

  const openNotification = React.useCallback(
    async (notification: AppNotification) => {
      await markRead(notification);
      router.push((notification.route || '/(tabs)/calendar') as never);
    },
    [markRead, router]
  );

  const markAllRead = React.useCallback(async () => {
    setReadAllBusy(true);
    try {
      await notificationsApi.markAllRead();
      resource.reload();
    } finally {
      setReadAllBusy(false);
    }
  }, [resource]);

  const renderNotification = (notification: AppNotification) => {
    const isUnread = !notification.readAt;
    return (
      <Pressable
        key={notification.id}
        accessibilityRole="button"
        onPress={() => {
          void openNotification(notification);
        }}
        style={({ pressed }) => [styles.notificationRow, pressed && theme.states.pressed]}>
        <View style={styles.notificationBody}>
          <View style={styles.notificationTop}>
            <Text style={styles.notificationTitle} numberOfLines={1}>
              {notification.title}
            </Text>
            {isUnread ? <Badge>جدید</Badge> : null}
          </View>
          <Text style={styles.notificationText} numberOfLines={2}>
            {notification.body}
          </Text>
          <Text style={styles.timeText}>{formatNotificationDate(notification.createdAt)}</Text>
        </View>
        {isUnread ? (
          <Pressable
            accessibilityLabel="علامت‌گذاری به‌عنوان خوانده‌شده"
            disabled={busyId === notification.id}
            onPress={(event) => {
              event.stopPropagation();
              void markRead(notification);
            }}
            style={({ pressed }) => [styles.markButton, pressed && theme.states.pressed]}>
            <Check size={theme.sizes.iconSm} color={theme.colors.primary} strokeWidth={2} />
          </Pressable>
        ) : (
          <ChevronLeft
            size={theme.sizes.iconSm + 2}
            color={theme.iconColors.muted}
            strokeWidth={1.6}
          />
        )}
      </Pressable>
    );
  };

  if (!user) return null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="بازگشت" onPress={() => router.back()} style={styles.backBtn}>
          <ArrowRight size={theme.sizes.iconMd} color={theme.colors.primary} strokeWidth={1.8} />
        </Pressable>
        <View style={styles.headerBody}>
          <Text style={styles.title}>صندوق اعلان‌ها</Text>
          <Text style={styles.hint}>اعلان‌های خوانده‌نشده و اخیر</Text>
        </View>
        <Pressable
          accessibilityLabel="به‌روزرسانی"
          onPress={resource.reload}
          style={styles.backBtn}>
          <RefreshCw
            size={theme.sizes.iconSm + 2}
            color={theme.iconColors.muted}
            strokeWidth={1.8}
          />
        </Pressable>
      </View>

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={resource.loading} onRefresh={resource.reload} />
        }>
        <Card style={styles.card}>
          <CardHeader style={styles.cardHeader}>
            <View style={styles.sectionTitle}>
              <Bell size={theme.sizes.iconSm} color={theme.iconColors.muted} strokeWidth={1.6} />
              <CardTitle color="mutedForeground" variant="label" weight="medium">
                خوانده‌نشده
              </CardTitle>
              {unread.length > 0 ? <Badge>{String(unread.length)}</Badge> : null}
            </View>
            {unread.length > 0 ? (
              <Button
                variant="ghost"
                size="sm"
                disabled={readAllBusy}
                onPress={() => {
                  void markAllRead();
                }}>
                <CheckCheck
                  size={theme.sizes.iconSm}
                  color={theme.colors.primary}
                  strokeWidth={1.8}
                />
                <Text style={{ color: theme.colors.primary, fontFamily: theme.fonts.sansMedium }}>
                  خواندن همه
                </Text>
              </Button>
            ) : null}
          </CardHeader>
          <CardContent style={styles.cardContent}>
            {resource.loading && notifications.length === 0 ? (
              <>
                <Skeleton height={72} />
                <Skeleton height={72} />
              </>
            ) : unread.length > 0 ? (
              unread.map(renderNotification)
            ) : (
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>اعلان خوانده‌نشده‌ای ندارید</Text>
                <Text style={styles.emptyText}>اعلان‌های جدید نوبت همین‌جا دیده می‌شوند.</Text>
              </View>
            )}
          </CardContent>
        </Card>

        <Card style={styles.card}>
          <CardHeader style={styles.cardHeader}>
            <View style={styles.sectionTitle}>
              <CheckCheck
                size={theme.sizes.iconSm}
                color={theme.iconColors.muted}
                strokeWidth={1.6}
              />
              <CardTitle color="mutedForeground" variant="label" weight="medium">
                اخیر
              </CardTitle>
            </View>
          </CardHeader>
          <CardContent style={styles.cardContent}>
            {recent.length > 0 ? (
              recent.map(renderNotification)
            ) : (
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>هنوز اعلان اخیری نیست</Text>
              </View>
            )}
          </CardContent>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
