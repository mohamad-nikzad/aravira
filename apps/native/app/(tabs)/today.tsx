import * as React from 'react';
import { addDaysYmd, salonTodayYmd } from '@repo/salon-core/salon-local-time';
import type { TodayData } from '@repo/salon-core/types';
import { useAuth } from '../../components/auth-provider';
import { todayApi } from '../../lib/api';
import { useAsyncResource } from '../../lib/hooks/use-async-resource';
import { useNotificationSync } from '../../lib/notification-sync';
import { ManagerTodayView } from '../../components/today/manager-view';
import { StaffTodayView } from '../../components/today/staff-view';

export default function TodayScreen() {
  const { user } = useAuth();
  const { syncUnreadNotifications } = useNotificationSync();
  const initialToday = React.useMemo(() => salonTodayYmd(), []);
  const [managerDate, setManagerDate] = React.useState(initialToday);

  const isManager = user?.role === 'manager';
  const tomorrowYmd = React.useMemo(() => addDaysYmd(initialToday, 1), [initialToday]);

  const managerKey = isManager ? `today:${managerDate}` : null;
  const manager = useAsyncResource<TodayData>(
    managerKey,
    (signal) => todayApi.get(managerDate, { signal }),
    [managerDate]
  );

  const staffTodayKey = !isManager && user ? `staff-today:${initialToday}` : null;
  const staffToday = useAsyncResource<TodayData>(
    staffTodayKey,
    (signal) => todayApi.get(initialToday, { signal }),
    [initialToday]
  );
  const staffTomorrowKey = !isManager && user ? `staff-tomorrow:${tomorrowYmd}` : null;
  const staffTomorrow = useAsyncResource<TodayData>(
    staffTomorrowKey,
    (signal) => todayApi.get(tomorrowYmd, { signal }),
    [tomorrowYmd]
  );

  React.useEffect(() => {
    if (!manager.data && !staffToday.data && !staffTomorrow.data) return;
    void syncUnreadNotifications('today-refresh');
  }, [manager.data, staffToday.data, staffTomorrow.data, syncUnreadNotifications]);

  if (!user) return null;

  if (isManager) {
    return (
      <ManagerTodayView
        date={managerDate}
        setDate={setManagerDate}
        data={manager.data}
        isLoading={manager.loading}
      />
    );
  }

  return (
    <StaffTodayView
      todayDate={initialToday}
      tomorrowDate={tomorrowYmd}
      todayData={staffToday.data}
      tomorrowData={staffTomorrow.data}
      todayLoading={staffToday.loading}
      tomorrowLoading={staffTomorrow.loading}
    />
  );
}
