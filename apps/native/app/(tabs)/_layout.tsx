import { Tabs } from 'expo-router';
import { BottomNav } from '../../components/bottom-nav';
import { useAuth } from '../../components/auth-provider';
import { notificationsApi } from '../../lib/api';
import { useAsyncResource } from '../../lib/hooks/use-async-resource';
import { useTheme } from '../../theme';

export default function TabsLayout() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const role = user?.role ?? 'manager';
  const unreadResource = useAsyncResource(
    user ? `tab-unread-notifications:${user.id}` : null,
    (signal) => notificationsApi.list({ unreadOnly: true }, { signal }),
    [user?.id]
  );
  const unreadNotifications = unreadResource.data?.notifications.length ?? 0;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: {
          backgroundColor: theme.colors.background,
        },
      }}
      tabBar={(props) => (
        <BottomNav {...props} role={role} unreadNotifications={unreadNotifications} />
      )}>
      <Tabs.Screen name="today" options={{ title: 'امروز' }} />
      <Tabs.Screen name="calendar" options={{ title: 'تقویم' }} />
      <Tabs.Screen
        name="clients"
        options={{
          title: 'مشتریان',
          href: role === 'manager' ? '/clients' : null,
        }}
      />
      <Tabs.Screen name="settings" options={{ title: role === 'manager' ? 'بیشتر' : 'تنظیمات' }} />
    </Tabs>
  );
}
