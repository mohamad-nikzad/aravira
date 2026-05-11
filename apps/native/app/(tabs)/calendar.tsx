import * as React from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlertCircle, Plus, RefreshCw } from 'lucide-react-native';
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
import { saloora, semanticLight } from '@repo/brand-tokens/colors';
import { Skeleton } from '../../components/ui/skeleton';
import { useAuth } from '../../components/auth-provider';
import { appointmentsApi, clientsApi, servicesApi, staffApi } from '../../lib/api';
import { useAsyncResource } from '../../lib/hooks/use-async-resource';
import { CalendarHeader } from '../../components/calendar/calendar-header';
import { ViewSwitcher } from '../../components/calendar/view-switcher';
import { StaffFilter } from '../../components/calendar/staff-filter';
import { DayView } from '../../components/calendar/day-view';
import { WeekView } from '../../components/calendar/week-view';
import { MonthView } from '../../components/calendar/month-view';
import { AgendaView } from '../../components/calendar/agenda-view';
import { AppointmentSheet } from '../../components/calendar/appointment-sheet';
import { AppointmentCreateModal } from '../../components/calendar/appointment-create-modal';
import { FONTS, defaultBusinessHours, weekStartYmd } from '../../components/calendar/helpers';
import type { CalendarView } from '../../components/calendar/types';

import { tw } from '../../lib/utils';
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
  } | null>(null);

  const isManager = user?.role === 'manager';

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

  const appointments = apptsResource.data?.appointments ?? [];
  const staff = React.useMemo(() => staffResource.data?.staff ?? [], [staffResource.data]);
  const staffMap = React.useMemo(() => {
    const m = new Map<string, User>();
    for (const s of staff) m.set(s.id, s);
    return m;
  }, [staff]);

  const hours: BusinessHours = React.useMemo(() => defaultBusinessHours(null), []);

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
    <SafeAreaView
      style={[tw('bg-background flex-1'), { backgroundColor: semanticLight.background.hex }]}
      edges={['top']}>
      <CalendarHeader
        view={view}
        cursorYmd={cursorYmd}
        todayYmd={todayYmd}
        onCursorChange={setCursorYmd}
      />

      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 10,
          paddingBottom: isManager && staff.length > 0 ? 8 : 12,
          backgroundColor: '#FFFFFF',
          borderBottomWidth: isManager && staff.length > 0 ? 0 : 1,
          borderBottomColor: '#E5D9DB66',
        }}>
        <ViewSwitcher value={view} onChange={setView} />
      </View>

      {isManager && staff.length > 0 ? (
        <View
          style={{
            backgroundColor: '#FFFFFF',
            paddingVertical: 6,
            borderBottomWidth: 1,
            borderBottomColor: '#E5D9DB66',
          }}>
          <StaffFilter staff={staff} selected={staffFilter} onSelect={setStaffFilter} />
        </View>
      ) : null}

      <View style={{ flex: 1, backgroundColor: saloora.mist.hex }}>
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
          <Pressable
            onPress={() => {
              setCreatePrefill(null);
              setCreateOpen(true);
            }}
            accessibilityLabel="نوبت جدید"
            style={({ pressed }) => ({
              position: 'absolute',
              bottom: 16,
              left: 16,
              width: 56,
              height: 56,
              borderRadius: 28,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: saloora.plum.hex,
              opacity: pressed ? 0.9 : 1,
              elevation: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              zIndex: 10,
            })}>
            <Plus size={26} color="#FFFFFF" strokeWidth={2.2} />
          </Pressable>
        ) : null}
      </View>

      <AppointmentSheet
        appointment={selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        onChange={() => {
          setSelectedAppointment(null);
          apptsResource.reload();
        }}
      />

      {isManager ? (
        <AppointmentCreateModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          initialDate={createPrefill?.date ?? cursorYmd}
          initialTime={createPrefill?.time}
          initialStaffId={staffFilter ?? undefined}
          staff={staff}
          services={servicesResource.data?.services ?? []}
          clients={clientsResource.data?.clients ?? []}
          onSuccess={() => {
            setCreateOpen(false);
            apptsResource.reload();
          }}
          onClientCreated={() => clientsResource.reload()}
        />
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
  if (view === 'month') {
    return (
      <View style={{ padding: 16, gap: 8 }}>
        {Array.from({ length: 6 }, (_, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: 6 }}>
            {Array.from({ length: 7 }, (_, j) => (
              <Skeleton key={j} height={64} radius={8} style={{ flex: 1 }} />
            ))}
          </View>
        ))}
      </View>
    );
  }
  if (view === 'agenda') {
    return (
      <View style={{ padding: 16, gap: 12 }}>
        {Array.from({ length: 4 }, (_, i) => (
          <View key={i} style={{ gap: 8 }}>
            <Skeleton height={24} width="66%" radius={8} />
            <Skeleton height={64} width="100%" radius={16} />
            <Skeleton height={64} width="100%" radius={16} />
          </View>
        ))}
      </View>
    );
  }
  return (
    <View style={{ padding: 16, gap: 10 }}>
      {Array.from({ length: 6 }, (_, i) => (
        <Skeleton key={i} height={56} width="100%" radius={16} />
      ))}
    </View>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}>
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: saloora.rose.hex + '1A',
          marginBottom: 12,
        }}>
        <AlertCircle size={24} color={saloora.rose.hex} strokeWidth={1.8} />
      </View>
      <Text
        style={{
          fontFamily: FONTS.semi,
          fontSize: 14,
          color: saloora.plum.hex,
          marginBottom: 6,
          textAlign: 'center',
        }}>
        {message}
      </Text>
      <Pressable
        onPress={onRetry}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          marginTop: 12,
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: saloora.rose.hex + '55',
          opacity: pressed ? 0.75 : 1,
        })}>
        <RefreshCw size={14} color={saloora.rose.hex} strokeWidth={1.8} />
        <Text
          style={{
            fontFamily: FONTS.semi,
            fontSize: 12,
            color: saloora.rose.hex,
          }}>
          تلاش دوباره
        </Text>
      </Pressable>
    </View>
  );
}
