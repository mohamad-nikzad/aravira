import * as React from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check, X } from 'lucide-react-native';
import type { AppointmentWithDetails, Client, Service, User } from '@repo/salon-core/types';
import {
  APPOINTMENT_DURATION_BOUNDS,
  durationMinutesFromRange,
  endTimeFromDuration,
  formatTimeHm,
  parseTimeHm,
  validateAppointmentWindow,
} from '@repo/salon-core/appointment-time';
import {
  autoPickServiceForStaff,
  eligibleServicesForStaff,
  eligibleStaffForService,
} from '@repo/salon-core/staff-service-autofill';
import { parseLocalizedInt, toPersianDigits } from '@repo/salon-core/persian-digits';
import { ApiError } from '@repo/api-client';
import { semanticLight } from '@repo/brand-tokens/colors';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { JalaliDatePicker } from '../ui/jalali-date-picker';
import { Select, type SelectGroup, type SelectOption } from '../ui/select';
import { TimePicker } from '../ui/time-picker';
import { Spinner } from '../ui/spinner';
import { appointmentsApi } from '../../lib/api';
import { ClientPicker } from './client-picker';

import { tw } from '../../lib/utils';
const CATEGORY_LABELS: Record<string, string> = {
  hair: 'مو',
  nails: 'ناخن',
  skincare: 'پوست',
  spa: 'اسپا',
};

const DURATION_PRESETS = [30, 45, 60, 90, 120];

const FONT_REG = 'Vazirmatn_400Regular';
const FONT_MED = 'Vazirmatn_500Medium';
const FONT_SEMI = 'Vazirmatn_600SemiBold';
const FONT_BOLD = 'Vazirmatn_700Bold';

const numFmt = new Intl.NumberFormat('fa-IR');
function formatPrice(price: number) {
  return `${numFmt.format(price)} تومان`;
}

export type AppointmentCreateModalProps = {
  open: boolean;
  onClose: () => void;
  initialDate: string;
  initialTime?: string;
  initialStaffId?: string;
  initialServiceId?: string;
  staff: User[];
  services: Service[];
  clients: Client[];
  onSuccess: (appointment: AppointmentWithDetails) => void;
  onClientCreated?: (client: Client) => void;
};

export function AppointmentCreateModal({
  open,
  onClose,
  initialDate,
  initialTime,
  initialStaffId,
  initialServiceId,
  staff,
  services,
  clients,
  onSuccess,
  onClientCreated,
}: AppointmentCreateModalProps) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const [clientId, setClientId] = React.useState('');
  const [staffId, setStaffId] = React.useState('');
  const [serviceId, setServiceId] = React.useState('');
  const [date, setDate] = React.useState(initialDate);
  const [startTime, setStartTime] = React.useState(() =>
    formatTimeHm(parseTimeHm(initialTime ?? '09:00'))
  );
  const [durationMinutes, setDurationMinutes] = React.useState(45);
  const [endTime, setEndTime] = React.useState(() =>
    endTimeFromDuration(formatTimeHm(parseTimeHm(initialTime ?? '09:00')), 45)
  );
  const [notes, setNotes] = React.useState('');
  const [useTemporaryClient, setUseTemporaryClient] = React.useState(false);
  const [temporaryClientName, setTemporaryClientName] = React.useState('');
  const [temporaryClientNotes, setTemporaryClientNotes] = React.useState('');
  const [showDetails, setShowDetails] = React.useState(false);
  const [localClients, setLocalClients] = React.useState<Client[]>(clients);
  const wasOpenRef = React.useRef(false);

  React.useEffect(() => {
    setLocalClients(clients);
  }, [clients]);

  const staffRoleOnly = React.useMemo(() => staff.filter((m) => m.role === 'staff'), [staff]);

  const resetForm = React.useCallback(() => {
    const initialService = initialServiceId
      ? services.find((s) => s.id === initialServiceId)
      : undefined;
    const defaultDuration = initialService?.duration ?? 45;
    const st = formatTimeHm(parseTimeHm(initialTime ?? '09:00'));
    setDurationMinutes(defaultDuration);
    setDate(initialDate);
    setStartTime(st);
    setEndTime(endTimeFromDuration(st, defaultDuration));
    setClientId('');
    setStaffId(initialStaffId ?? '');
    setServiceId(initialServiceId ?? '');
    setNotes('');
    setUseTemporaryClient(false);
    setTemporaryClientName('');
    setTemporaryClientNotes('');
    setError('');
    setShowDetails(false);
    setLocalClients(clients);
  }, [clients, initialDate, initialTime, initialStaffId, initialServiceId, services]);

  React.useEffect(() => {
    if (open && !wasOpenRef.current) resetForm();
    wasOpenRef.current = open;
  }, [open, resetForm]);

  const applyDuration = (mins: number) => {
    const clamped = Math.min(
      APPOINTMENT_DURATION_BOUNDS.max,
      Math.max(APPOINTMENT_DURATION_BOUNDS.min, mins)
    );
    setDurationMinutes(clamped);
    setEndTime(endTimeFromDuration(startTime, clamped));
  };

  const applyEndTime = (et: string) => {
    setEndTime(et);
    try {
      const d = durationMinutesFromRange(startTime, et);
      if (d > 0) setDurationMinutes(d);
    } catch {
      /* invalid time */
    }
  };

  const handleStartTimeChange = (st: string) => {
    setStartTime(st);
    setEndTime(endTimeFromDuration(st, durationMinutes));
  };

  const handleServiceChange = (id: string) => {
    setServiceId(id);
    const svc = services.find((s) => s.id === id);
    if (svc) applyDuration(svc.duration);
    const eligibleAll = eligibleStaffForService(staff, id);
    const eligibleStaffMembers = eligibleStaffForService(staffRoleOnly, id);
    if (eligibleStaffMembers.length === 1) {
      setStaffId(eligibleStaffMembers[0].id);
    } else if (!eligibleAll.some((m) => m.id === staffId)) {
      setStaffId('');
    }
  };

  const handleStaffChange = (id: string) => {
    setStaffId(id);
    const member = staff.find((s) => s.id === id);
    if (!member) return;
    const eligible = eligibleServicesForStaff(member, services);
    const current = services.find((s) => s.id === serviceId);
    const serviceStillOk = !!current && eligible.some((s) => s.id === serviceId);
    if (!serviceStillOk) {
      const explicitList = member.serviceIds != null && member.serviceIds.length > 0;
      const auto = autoPickServiceForStaff(eligible, {
        staffHasExplicitServiceList: explicitList,
      });
      if (auto) {
        setServiceId(auto.id);
        applyDuration(auto.duration);
      } else {
        setServiceId('');
      }
    }
  };

  const handleClientCreated = (newClient: Client) => {
    setLocalClients((prev) => [newClient, ...prev]);
    onClientCreated?.(newClient);
  };

  const handleSubmit = async () => {
    setError('');
    const localCheck = validateAppointmentWindow(startTime, endTime);
    if (!localCheck.ok) {
      setError(localCheck.error);
      return;
    }
    setLoading(true);
    try {
      const { appointment } = await appointmentsApi.create({
        ...(useTemporaryClient
          ? {
              placeholderClient: {
                name: temporaryClientName.trim(),
                notes: temporaryClientNotes.trim() || undefined,
              },
            }
          : { clientId }),
        staffId,
        serviceId,
        date,
        startTime,
        endTime,
        durationMinutes,
        notes: notes || undefined,
      });
      onSuccess(appointment);
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'خطایی رخ داد';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const staffOptions: SelectOption[] = staffRoleOnly.map((member) => ({
    value: member.id,
    label: member.name,
  }));

  const serviceGroups: SelectGroup[] = React.useMemo(() => {
    const byCat = services.reduce<Record<string, Service[]>>((acc, s) => {
      if (!s.active) return acc;
      (acc[s.category] = acc[s.category] ?? []).push(s);
      return acc;
    }, {});
    return Object.entries(byCat).map(([cat, list]) => ({
      label: CATEGORY_LABELS[cat] ?? cat,
      options: list.map((s) => ({
        value: s.id,
        label: s.name,
        detail: `پیشنهاد ${toPersianDigits(s.duration)} دقیقه — ${formatPrice(s.price)}`,
      })),
    }));
  }, [services]);

  const submitDisabled =
    loading ||
    !serviceId ||
    !staffId ||
    (useTemporaryClient ? !temporaryClientName.trim() : !clientId);

  return (
    <Modal
      visible={open}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet">
      <SafeAreaView
        style={[tw('flex-1 bg-background'), { backgroundColor: semanticLight.background.hex }]}
        edges={['top']}>
        <View style={tw('flex-row items-center justify-between border-b border-border px-4 py-3')}>
          <View style={tw('flex-1')}>
            <Text style={[tw('text-base text-foreground'), { fontFamily: FONT_BOLD }]}>
              نوبت جدید
            </Text>
            <Text style={[tw('mt-0.5 text-xs text-muted-foreground'), { fontFamily: FONT_REG }]}>
              خدمت، پرسنل و زمان نوبت را انتخاب کنید
            </Text>
          </View>
          <Pressable
            onPress={onClose}
            accessibilityLabel="بستن"
            style={tw('h-8 w-8 items-center justify-center rounded-full bg-muted')}>
            <X size={16} color="#6B3A4A" strokeWidth={2} />
          </Pressable>
        </View>

        <KeyboardAvoidingView
          style={tw('flex-1')}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={{ padding: 16, paddingBottom: 24, gap: 16 }}
            keyboardShouldPersistTaps="handled">
            {/* Client */}
            <Field label="مشتری">
              <Pressable
                onPress={() => {
                  setUseTemporaryClient((v) => {
                    const next = !v;
                    if (next) setClientId('');
                    else {
                      setTemporaryClientName('');
                      setTemporaryClientNotes('');
                    }
                    setError('');
                    return next;
                  });
                }}
                style={tw(
                  'mb-2.5 flex-row items-start gap-2.5 rounded-xl border border-border bg-card p-3'
                )}>
                <View
                  style={tw(
                    'mt-0.5 h-[18px] w-[18px] items-center justify-center rounded border',
                    useTemporaryClient
                      ? 'border-primary bg-primary'
                      : 'border-border bg-transparent'
                  )}>
                  {useTemporaryClient ? <Check size={12} color="#FFFFFF" strokeWidth={3} /> : null}
                </View>
                <View style={tw('flex-1')}>
                  <Text
                    style={[
                      tw('text-sm text-foreground'),
                      { fontFamily: FONT_SEMI, textAlign: 'right' },
                    ]}>
                    بعداً اطلاعات مشتری را کامل می‌کنم
                  </Text>
                  <Text
                    style={[
                      tw('mt-0.5 text-xs text-muted-foreground'),
                      { fontFamily: FONT_REG, textAlign: 'right' },
                    ]}>
                    برای این حالت فقط نام لازم است.
                  </Text>
                </View>
              </Pressable>

              {useTemporaryClient ? (
                <View style={tw('gap-2.5')}>
                  <SubField label="نام مشتری">
                    <Input
                      value={temporaryClientName}
                      onChangeText={setTemporaryClientName}
                      placeholder="مثلاً دوستِ سارا"
                    />
                  </SubField>
                  <SubField label="یادداشت (اختیاری)">
                    <Input
                      value={temporaryClientNotes}
                      onChangeText={setTemporaryClientNotes}
                      placeholder="مثلاً شماره را بعداً می‌گیرم"
                    />
                  </SubField>
                </View>
              ) : (
                <ClientPicker
                  clients={localClients}
                  value={clientId}
                  onChange={setClientId}
                  onClientCreated={handleClientCreated}
                />
              )}
            </Field>

            {/* Staff */}
            <Field label="پرسنل">
              <Select
                title="انتخاب پرسنل"
                placeholder="انتخاب پرسنل"
                value={staffId}
                onChange={handleStaffChange}
                options={staffOptions}
              />
            </Field>

            {/* Service */}
            <Field label="خدمت">
              <Select
                title="انتخاب خدمت"
                placeholder="انتخاب خدمت"
                value={serviceId}
                onChange={handleServiceChange}
                groups={serviceGroups}
              />
            </Field>

            {/* Date + Start time */}
            <View style={tw('flex-row gap-2.5')}>
              <View style={tw('flex-1')}>
                <Field label="تاریخ">
                  <JalaliDatePicker value={date} onChange={setDate} />
                </Field>
              </View>
              <View style={tw('flex-1')}>
                <Field label="شروع">
                  <TimePicker
                    value={startTime}
                    onChange={handleStartTimeChange}
                    label="ساعت شروع"
                  />
                </Field>
              </View>
            </View>

            {/* Duration / End / Notes (collapsible) */}
            <View style={tw('overflow-hidden rounded-xl border border-border bg-card')}>
              <Pressable
                onPress={() => setShowDetails((v) => !v)}
                style={tw('flex-row items-center justify-between px-3 py-3')}>
                <Text style={[tw('text-sm text-foreground'), { fontFamily: FONT_SEMI }]}>
                  جزئیات زمان و توضیحات
                </Text>
                <View style={tw('flex-row items-center gap-2.5')}>
                  <Text
                    style={[
                      tw('text-xs text-muted-foreground tabular-nums'),
                      { fontFamily: FONT_REG, writingDirection: 'ltr' },
                    ]}>
                    {toPersianDigits(endTime)}
                  </Text>
                  <Text style={[tw('text-xs text-muted-foreground'), { fontFamily: FONT_REG }]}>
                    {toPersianDigits(durationMinutes)} دقیقه
                  </Text>
                </View>
              </Pressable>

              {showDetails ? (
                <View style={tw('gap-3 border-t border-border px-3 pb-3.5 pt-3')}>
                  <SubField label="مدت (دقیقه)">
                    <View style={tw('mb-2 flex-row flex-wrap gap-1.5')}>
                      {DURATION_PRESETS.map((m) => {
                        const active = durationMinutes === m;
                        return (
                          <Pressable
                            key={m}
                            onPress={() => applyDuration(m)}
                            style={tw(
                              'h-8 items-center justify-center rounded-lg border px-3',
                              active ? 'border-primary bg-primary' : 'border-border bg-transparent'
                            )}>
                            <Text
                              style={[
                                tw(
                                  'text-xs',
                                  active ? 'text-primary-foreground' : 'text-foreground'
                                ),
                                { fontFamily: FONT_SEMI },
                              ]}>
                              {numFmt.format(m)}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                    <Input
                      value={toPersianDigits(durationMinutes)}
                      onChangeText={(t) => {
                        const v = parseLocalizedInt(t, durationMinutes);
                        if (!Number.isFinite(v)) return;
                        applyDuration(v);
                      }}
                      keyboardType="number-pad"
                    />
                  </SubField>

                  <SubField label="پایان">
                    <TimePicker value={endTime} onChange={applyEndTime} label="ساعت پایان" />
                    <Text
                      style={[
                        tw('mt-1 text-[10px] text-muted-foreground'),
                        { fontFamily: FONT_REG, textAlign: 'right' },
                      ]}>
                      تغییر پایان، مدت را هم‌زمان به‌روز می‌کند.
                    </Text>
                  </SubField>

                  <SubField label="توضیحات (اختیاری)">
                    <Input value={notes} onChangeText={setNotes} placeholder="توضیحات اضافی…" />
                  </SubField>
                </View>
              ) : null}
            </View>

            {error ? (
              <Text
                style={[
                  tw('text-xs text-destructive'),
                  { fontFamily: FONT_SEMI, textAlign: 'right' },
                ]}>
                {error}
              </Text>
            ) : null}
          </ScrollView>

          <View style={tw('gap-2 border-t border-border bg-background p-4')}>
            <Button onPress={handleSubmit} disabled={submitDisabled}>
              {loading ? <Spinner color="#FFFFFF" /> : null}
              <Text style={[tw('text-sm text-primary-foreground'), { fontFamily: FONT_SEMI }]}>
                {loading ? 'در حال ثبت…' : 'ثبت نوبت'}
              </Text>
            </Button>
            <Button variant="outline" onPress={onClose} disabled={loading}>
              <Text style={[tw('text-sm text-foreground'), { fontFamily: FONT_MED }]}>انصراف</Text>
            </Button>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={tw('gap-1.5')}>
      <Text style={[tw('text-xs text-foreground'), { fontFamily: FONT_SEMI, textAlign: 'right' }]}>
        {label}
      </Text>
      {children}
    </View>
  );
}

function SubField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={tw('gap-1.5')}>
      <Text
        style={[
          tw('text-[11px] text-muted-foreground'),
          { fontFamily: FONT_MED, textAlign: 'right' },
        ]}>
        {label}
      </Text>
      {children}
    </View>
  );
}
