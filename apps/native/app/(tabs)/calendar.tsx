import * as React from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AlertCircle, Plus, RefreshCw, Search } from 'lucide-react-native';
import {
  jalaliMonthLength,
  jalaliToGregorianStr,
  parseGregorianToJalali,
} from '@repo/salon-core/jalali';
import { addDaysYmd, salonTodayYmd } from '@repo/salon-core/salon-local-time';
import type {
  AppointmentWithDetails,
  BusinessHours,
  Client,
  Service,
  User,
} from '@repo/salon-core/types';
import { Skeleton } from '../../components/ui/skeleton';
import { useAuth } from '../../components/auth-provider';
import {
  appointmentsApi,
  businessSettingsApi,
  clientsApi,
  servicesApi,
  staffApi,
} from '../../lib/api';
import { useAsyncResource } from '../../lib/hooks/use-async-resource';
import { useNotificationSync } from '../../lib/notification-sync';
import { CalendarHeader } from '../../components/calendar/calendar-header';
import { ViewSwitcher } from '../../components/calendar/view-switcher';
import { StaffFilter } from '../../components/calendar/staff-filter';
import { DayView } from '../../components/calendar/day-view';
import { WeekView } from '../../components/calendar/week-view';
import { MonthView } from '../../components/calendar/month-view';
import { AgendaView } from '../../components/calendar/agenda-view';
import { AppointmentSheet } from '../../components/calendar/appointment-sheet';
import { AppointmentCreateModal } from '../../components/calendar/appointment-create-modal';
import { AppointmentEditModal } from '../../components/calendar/appointment-edit-modal';
import { AvailabilityModal } from '../../components/calendar/availability-modal';
import { CompleteClientModal } from '../../components/calendar/complete-client-modal';
import { defaultBusinessHours, weekStartYmd } from '../../components/calendar/helpers';
import type { CalendarView } from '../../components/calendar/types';
import { useTheme, useThemeStyles, withAlpha } from '../../theme';

const FAB_SIZE = 56;

function computeRange(view: CalendarView, cursorYmd: string): { start: string; end: string } {
  if (view === 'day' || view === 'week') {
    const start = weekStartYmd(cursorYmd);
    return { start, end: addDaysYmd(start, 6) };
  }
  if (view === 'month') {
    const j = parseGregorianToJalali(cursorYmd);
    const monthStart = jalaliToGregorianStr(j.jy, j.jm, 1);
    const monthEnd = jalaliToGregorianStr(j.jy, j.jm, jalaliMonthLength(j.jy, j.jm));
    return { start: addDaysYmd(monthStart, -7), end: addDaysYmd(monthEnd, 7) };
  }
  return { start: cursorYmd, end: addDaysYmd(cursorYmd, 13) };
}

export default function CalendarScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { syncUnreadNotifications } = useNotificationSync();
  const router = useRouter();
  const params = useLocalSearchParams<{
    date?: string;
    clientId?: string;
    appointmentId?: string;
    intent?: string;
    time?: string;
    staffId?: string;
    serviceId?: string;
  }>();
  const todayYmd = React.useMemo(() => salonTodayYmd(), []);
  const [view, setView] = React.useState<CalendarView>('day');
  const [cursorYmd, setCursorYmd] = React.useState<string>(todayYmd);
  const [staffFilter, setStaffFilter] = React.useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] =
    React.useState<AppointmentWithDetails | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [createPrefill, setCreatePrefill] = React.useState<{
    date: string;
    time?: string;
    clientId?: string;
    staffId?: string;
    serviceId?: string;
  } | null>(null);
  const [editingAppointment, setEditingAppointment] = React.useState<AppointmentWithDetails | null>(
    null
  );
  const [completingClientFor, setCompletingClientFor] =
    React.useState<AppointmentWithDetails | null>(null);
  const [availabilityOpen, setAvailabilityOpen] = React.useState(false);

  const isManager = user?.role === 'manager';

  const styles = useThemeStyles((t) => ({
    safe: { backgroundColor: t.colors.background, flex: 1 },
    viewSwitcherBar: {
      paddingHorizontal: t.spacing.xl,
      paddingTop: t.spacing.md,
      backgroundColor: t.colors.card,
    },
    viewSwitcherBarWithFilter: { paddingBottom: t.spacing.md },
    viewSwitcherBarStandalone: {
      paddingBottom: t.spacing.lg,
      borderBottomWidth: t.sizes.hairline,
      borderBottomColor: withAlpha(t.colors.border, 0.4),
    },
    staffBar: {
      backgroundColor: t.colors.card,
      paddingVertical: t.spacing.sm,
      borderBottomWidth: t.sizes.hairline,
      borderBottomColor: withAlpha(t.colors.border, 0.4),
    },
    body: { flex: 1, backgroundColor: t.colors.background },
    fab: {
      position: 'absolute' as const,
      bottom: t.spacing.xl,
      left: t.spacing.xl,
      width: FAB_SIZE,
      height: FAB_SIZE,
      borderRadius: t.radius.full,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: t.colors.primary,
      ...t.elevation.lg,
      zIndex: 10,
    },
    fabSecondary: {
      position: 'absolute' as const,
      bottom: t.spacing.xl + FAB_SIZE + t.spacing.md,
      left: t.spacing.xl,
      width: FAB_SIZE,
      height: FAB_SIZE,
      borderRadius: t.radius.full,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: t.colors.card,
      borderWidth: t.sizes.hairline,
      borderColor: t.colors.border,
      ...t.elevation.md,
      zIndex: 10,
    },
  }));

  const range = React.useMemo(() => computeRange(view, cursorYmd), [view, cursorYmd]);

  const apptsKey = user ? `appts:${range.start}:${range.end}:${user.id}` : null;
  const apptsResource = useAsyncResource<{ appointments: AppointmentWithDetails[] }>(
    apptsKey,
    (signal) =>
      appointmentsApi.listRange({ startDate: range.start, endDate: range.end }, { signal }),
    [range.start, range.end]
  );

  const staffKey = isManager ? 'calendar-staff' : null;
  const staffResource = useAsyncResource<{ staff: User[] }>(
    staffKey,
    (signal) => staffApi.list({ signal }),
    []
  );

  const servicesKey = isManager ? 'calendar-services' : null;
  const servicesResource = useAsyncResource<{ services: Service[] }>(
    servicesKey,
    (signal) => servicesApi.list({ signal }),
    []
  );

  const clientsKey = isManager ? 'calendar-clients' : null;
  const clientsResource = useAsyncResource<{ clients: Client[] }>(
    clientsKey,
    (signal) => clientsApi.list({ signal }),
    []
  );

  const settingsKey = user ? `calendar-business-settings:${user.id}` : null;
  const settingsResource = useAsyncResource<{ settings: BusinessHours }>(
    settingsKey,
    (signal) => businessSettingsApi.get({ signal }),
    []
  );

  const appointments = apptsResource.data?.appointments ?? [];

  React.useEffect(() => {
    if (!apptsResource.data) return;
    void syncUnreadNotifications('calendar-refresh');
  }, [apptsResource.data, syncUnreadNotifications]);

  const staff = React.useMemo(() => staffResource.data?.staff ?? [], [staffResource.data]);
  const staffMap = React.useMemo(() => {
    const m = new Map<string, User>();
    for (const s of staff) m.set(s.id, s);
    return m;
  }, [staff]);

  const hours: BusinessHours = React.useMemo(
    () => defaultBusinessHours(settingsResource.data?.settings ?? null),
    [settingsResource.data]
  );

  const dateParam = typeof params.date === 'string' ? params.date : undefined;
  const clientIdParam = typeof params.clientId === 'string' ? params.clientId : undefined;
  const appointmentIdParam =
    typeof params.appointmentId === 'string' ? params.appointmentId : undefined;
  const intentParam = typeof params.intent === 'string' ? params.intent : undefined;
  const timeParam = typeof params.time === 'string' ? params.time : undefined;
  const staffIdParam = typeof params.staffId === 'string' ? params.staffId : undefined;
  const serviceIdParam = typeof params.serviceId === 'string' ? params.serviceId : undefined;
  const handledParamsRef = React.useRef<string>('');

  React.useEffect(() => {
    const key = `${dateParam ?? ''}|${clientIdParam ?? ''}|${appointmentIdParam ?? ''}|${intentParam ?? ''}|${timeParam ?? ''}|${staffIdParam ?? ''}|${serviceIdParam ?? ''}`;
    if (!key.trim() || handledParamsRef.current === key) return;
    handledParamsRef.current = key;

    if (dateParam) {
      setCursorYmd(dateParam);
      setView('day');
    }
    if (intentParam === 'availability' && isManager) {
      setAvailabilityOpen(true);
    } else if (isManager && (intentParam === 'create' || clientIdParam)) {
      setCreatePrefill({
        date: dateParam ?? cursorYmd,
        time: timeParam,
        clientId: clientIdParam,
        staffId: staffIdParam,
        serviceId: serviceIdParam,
      });
      setCreateOpen(true);
    } else if (appointmentIdParam) {
      void appointmentsApi
        .get(appointmentIdParam)
        .then((res) => setSelectedAppointment(res.appointment))
        .catch(() => undefined);
    }
    router.setParams({
      date: undefined,
      clientId: undefined,
      appointmentId: undefined,
      intent: undefined,
      time: undefined,
      staffId: undefined,
      serviceId: undefined,
    });
  }, [
    appointmentIdParam,
    clientIdParam,
    cursorYmd,
    dateParam,
    intentParam,
    isManager,
    router,
    serviceIdParam,
    staffIdParam,
    timeParam,
  ]);

  const handleSelectDay = React.useCallback((ymd: string) => {
    setCursorYmd(ymd);
    setView('day');
  }, []);

  const handleSlotPress = React.useCallback(
    (ymd: string, hm: string) => {
      if (!isManager) return;
      setCreatePrefill({ date: ymd, time: hm });
      setCreateOpen(true);
    },
    [isManager]
  );

  if (!user) return null;

  const showStaffBar = isManager && staff.length > 0;

  const sharedProps = {
    cursorYmd,
    appointments,
    hours,
    staffFilter,
    staffMap,
    isManager,
    loading: apptsResource.loading,
    onSelectAppointment: setSelectedAppointment,
    onSelectDay: handleSelectDay,
    onSlotPress: isManager ? handleSlotPress : undefined,
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <CalendarHeader
        view={view}
        cursorYmd={cursorYmd}
        todayYmd={todayYmd}
        onCursorChange={setCursorYmd}
      />

      <View
        style={[
          styles.viewSwitcherBar,
          showStaffBar ? styles.viewSwitcherBarWithFilter : styles.viewSwitcherBarStandalone,
        ]}>
        <ViewSwitcher value={view} onChange={setView} />
      </View>

      {showStaffBar ? (
        <View style={styles.staffBar}>
          <StaffFilter staff={staff} selected={staffFilter} onSelect={setStaffFilter} />
        </View>
      ) : null}

      <View style={styles.body}>
        {apptsResource.error && !apptsResource.data ? (
          <ErrorState
            message={apptsErrorMessage(apptsResource.error)}
            onRetry={apptsResource.reload}
          />
        ) : apptsResource.loading && !apptsResource.data ? (
          <LoadingState view={view} />
        ) : view === 'day' ? (
          <DayView {...sharedProps} />
        ) : view === 'week' ? (
          <WeekView {...sharedProps} />
        ) : view === 'month' ? (
          <MonthView {...sharedProps} />
        ) : (
          <AgendaView {...sharedProps} />
        )}

        {isManager ? (
          <>
            <Pressable
              onPress={() => setAvailabilityOpen(true)}
              accessibilityLabel="بررسی زمان خالی"
              style={({ pressed }) => [
                styles.fabSecondary,
                pressed ? { opacity: theme.states.pressed.opacity } : null,
              ]}>
              <Search size={theme.sizes.iconLg} color={theme.colors.foreground} strokeWidth={2} />
            </Pressable>
            <Pressable
              onPress={() => {
                setCreatePrefill(null);
                setCreateOpen(true);
              }}
              accessibilityLabel="نوبت جدید"
              style={({ pressed }) => [
                styles.fab,
                pressed ? { opacity: theme.states.pressed.opacity } : null,
              ]}>
              <Plus
                size={theme.sizes.iconLg + 2}
                color={theme.colors.primaryForeground}
                strokeWidth={2.2}
              />
            </Pressable>
          </>
        ) : null}
      </View>

      <AppointmentSheet
        appointment={selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        onChange={() => {
          setSelectedAppointment(null);
          apptsResource.reload();
        }}
        onEdit={(appt) => {
          setSelectedAppointment(null);
          setEditingAppointment(appt);
        }}
        onCompleteClient={(appt) => {
          setSelectedAppointment(null);
          setCompletingClientFor(appt);
        }}
      />

      {isManager ? (
        <>
          <AppointmentCreateModal
            open={createOpen}
            onClose={() => setCreateOpen(false)}
            initialDate={createPrefill?.date ?? cursorYmd}
            initialTime={createPrefill?.time}
            initialStaffId={createPrefill?.staffId ?? staffFilter ?? undefined}
            initialServiceId={createPrefill?.serviceId}
            initialClientId={createPrefill?.clientId}
            staff={staff}
            services={servicesResource.data?.services ?? []}
            clients={clientsResource.data?.clients ?? []}
            onSuccess={() => {
              setCreateOpen(false);
              apptsResource.reload();
            }}
            onClientCreated={() => clientsResource.reload()}
          />

          <AppointmentEditModal
            open={editingAppointment != null}
            onClose={() => setEditingAppointment(null)}
            appointment={editingAppointment}
            staff={staff}
            services={servicesResource.data?.services ?? []}
            clients={clientsResource.data?.clients ?? []}
            onSuccess={() => {
              setEditingAppointment(null);
              apptsResource.reload();
            }}
            onClientCreated={() => clientsResource.reload()}
          />

          <CompleteClientModal
            open={completingClientFor != null}
            onClose={() => setCompletingClientFor(null)}
            appointment={completingClientFor}
            onSuccess={() => {
              setCompletingClientFor(null);
              clientsResource.reload();
              apptsResource.reload();
            }}
          />

          <AvailabilityModal
            open={availabilityOpen}
            onClose={() => setAvailabilityOpen(false)}
            initialDate={cursorYmd}
            staff={staff}
            services={servicesResource.data?.services ?? []}
            onSelectSlot={({ slot, serviceId }) => {
              setAvailabilityOpen(false);
              setCursorYmd(slot.date);
              setCreatePrefill({
                date: slot.date,
                time: slot.startTime,
                staffId: slot.staffId,
                serviceId,
              });
              setCreateOpen(true);
            }}
          />
        </>
      ) : null}
    </SafeAreaView>
  );
}

function apptsErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    const msg = (error as { message?: string }).message;
    if (msg) return msg;
  }
  return 'بارگذاری نوبت‌ها ناموفق بود';
}

function LoadingState({ view }: { view: CalendarView }) {
  const styles = useThemeStyles((t) => ({
    monthWrap: { padding: t.spacing.xl, gap: t.spacing.md },
    monthRow: { flexDirection: 'row' as const, gap: t.spacing.sm },
    monthCell: { flex: 1 },
    agendaWrap: { padding: t.spacing.xl, gap: t.spacing.lg },
    agendaGroup: { gap: t.spacing.md },
    listWrap: { padding: t.spacing.xl, gap: t.spacing.md },
  }));
  if (view === 'month') {
    return (
      <View style={styles.monthWrap}>
        {Array.from({ length: 6 }, (_, i) => (
          <View key={i} style={styles.monthRow}>
            {Array.from({ length: 7 }, (_, j) => (
              <Skeleton key={j} height={64} radius={8} style={styles.monthCell} />
            ))}
          </View>
        ))}
      </View>
    );
  }
  if (view === 'agenda') {
    return (
      <View style={styles.agendaWrap}>
        {Array.from({ length: 4 }, (_, i) => (
          <View key={i} style={styles.agendaGroup}>
            <Skeleton height={24} width="66%" radius={8} />
            <Skeleton height={64} width="100%" radius={16} />
            <Skeleton height={64} width="100%" radius={16} />
          </View>
        ))}
      </View>
    );
  }
  return (
    <View style={styles.listWrap}>
      {Array.from({ length: 6 }, (_, i) => (
        <Skeleton key={i} height={56} width="100%" radius={16} />
      ))}
    </View>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { theme } = useTheme();
  const styles = useThemeStyles((t) => ({
    wrap: {
      flex: 1,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      padding: t.spacing['3xl'],
    },
    iconWrap: {
      width: FAB_SIZE,
      height: FAB_SIZE,
      borderRadius: t.radius.full,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: withAlpha(t.colors.destructive, 0.1),
      marginBottom: t.spacing.lg,
    },
    message: {
      fontFamily: t.fonts.sansSemiBold,
      fontSize: t.fontSize.md,
      color: t.colors.foreground,
      marginBottom: t.spacing.sm,
      textAlign: 'center' as const,
    },
    retry: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: t.spacing.sm,
      marginTop: t.spacing.lg,
      paddingHorizontal: t.spacing.lg,
      paddingVertical: t.spacing.md,
      borderRadius: t.radius.full,
      borderWidth: t.sizes.hairline,
      borderColor: withAlpha(t.colors.destructive, 0.4),
    },
    retryText: {
      fontFamily: t.fonts.sansSemiBold,
      fontSize: t.fontSize.base,
      color: t.colors.destructive,
    },
  }));
  return (
    <View style={styles.wrap}>
      <View style={styles.iconWrap}>
        <AlertCircle size={theme.sizes.iconLg} color={theme.colors.destructive} strokeWidth={1.8} />
      </View>
      <Text style={styles.message}>{message}</Text>
      <Pressable
        onPress={onRetry}
        style={({ pressed }) => [
          styles.retry,
          pressed ? { opacity: theme.states.pressed.opacity } : null,
        ]}>
        <RefreshCw
          size={theme.sizes.iconSm - 2}
          color={theme.colors.destructive}
          strokeWidth={1.8}
        />
        <Text style={styles.retryText}>تلاش دوباره</Text>
      </Pressable>
    </View>
  );
}
