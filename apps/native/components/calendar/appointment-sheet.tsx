import * as React from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Clock, Phone, Scissors, StickyNote, User as UserIcon, X } from 'lucide-react-native';
import { APPOINTMENT_STATUS, type AppointmentWithDetails } from '@repo/salon-core/types';
import { ApiError } from '@repo/api-client';
import { appointmentsApi } from '../../lib/api';
import { useAuth } from '../auth-provider';
import { formatJalaliFullDate } from '@repo/salon-core/jalali';
import { formatPersianTime, toPersianDigits } from '@repo/salon-core/persian-digits';
import { saloora } from '@repo/brand-tokens/colors';
import { FONTS, hmToMinutes, staffBorder, staffHex, staffSoftBg, statusPalette } from './helpers';

export type AppointmentSheetChange =
  | { type: 'updated'; appointment: AppointmentWithDetails }
  | { type: 'deleted'; id: string };

export function AppointmentSheet({
  appointment,
  onClose,
  onChange,
}: {
  appointment: AppointmentWithDetails | null;
  onClose: () => void;
  onChange?: (change: AppointmentSheetChange) => void;
}) {
  const visible = appointment != null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          justifyContent: 'flex-end',
          backgroundColor: 'rgba(43, 22, 27, 0.45)',
        }}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingBottom: 32,
            maxHeight: '85%',
          }}>
          {appointment ? (
            <SheetContent appointment={appointment} onClose={onClose} onChange={onChange} />
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function SheetContent({
  appointment,
  onClose,
  onChange,
}: {
  appointment: AppointmentWithDetails;
  onClose: () => void;
  onChange?: (change: AppointmentSheetChange) => void;
}) {
  const { user } = useAuth();
  const isManager = user?.role === 'manager';
  const isOwnAppointment = user?.role === 'staff' && appointment.staffId === user.id;
  const canChangeStatus = isManager || isOwnAppointment;

  const [pending, setPending] = React.useState<AppointmentWithDetails['status'] | null>(null);
  const [error, setError] = React.useState<string>('');

  React.useEffect(() => {
    setPending(null);
    setError('');
  }, [appointment.id]);

  const handleStatusChange = async (next: AppointmentWithDetails['status']) => {
    setError('');
    setPending(next);
    try {
      const res = await appointmentsApi.updateStatus(appointment.id, next);
      if (res.removedAppointmentId) {
        onChange?.({ type: 'deleted', id: res.removedAppointmentId });
      } else if (res.appointment) {
        onChange?.({ type: 'updated', appointment: res.appointment });
      }
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تغییر وضعیت انجام نشد');
    } finally {
      setPending(null);
    }
  };

  const palette = statusPalette(appointment.status);
  const stripe = staffHex(appointment.staff.color);
  const tint = staffSoftBg(appointment.staff.color);
  const border = staffBorder(appointment.staff.color);

  const durationMin = hmToMinutes(appointment.endTime) - hmToMinutes(appointment.startTime);
  const isCancelled = appointment.status === 'cancelled' || appointment.status === 'no-show';

  return (
    <ScrollView
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 14 }}
      showsVerticalScrollIndicator={false}>
      {/* Drag handle */}
      <View
        style={{
          alignSelf: 'center',
          width: 40,
          height: 4,
          borderRadius: 2,
          backgroundColor: '#E5D9DB',
          marginBottom: 12,
        }}
      />

      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text
            numberOfLines={1}
            style={{
              fontFamily: FONTS.bold,
              fontSize: 18,
              color: saloora.plum.hex,
              textDecorationLine: appointment.status === 'cancelled' ? 'line-through' : 'none',
            }}>
            {appointment.client.name}
          </Text>
          <Text
            style={{
              fontFamily: FONTS.reg,
              fontSize: 12,
              color: saloora.sage.hex,
            }}>
            {formatJalaliFullDate(appointment.date)}
          </Text>
        </View>
        <Pressable
          onPress={onClose}
          accessibilityLabel="بستن"
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#F4EFE7',
          }}>
          <X size={16} color={saloora.plum.hex} strokeWidth={2} />
        </Pressable>
      </View>

      {/* Status pill */}
      <View
        style={{
          alignSelf: 'flex-start',
          marginTop: 12,
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 999,
          backgroundColor: palette.bg,
          borderWidth: 1,
          borderColor: palette.border,
        }}>
        <Text
          style={{
            fontFamily: FONTS.semi,
            fontSize: 11,
            color: palette.text,
          }}>
          {APPOINTMENT_STATUS[appointment.status].label}
        </Text>
      </View>

      {/* Time card with staff color stripe */}
      <View
        style={{
          marginTop: 16,
          flexDirection: 'row',
          backgroundColor: isCancelled ? '#FAFAFA' : tint,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: isCancelled ? '#E5E5E5' : border,
          overflow: 'hidden',
        }}>
        <View
          style={{
            width: 4,
            backgroundColor: isCancelled ? '#BDBDBD' : stripe,
          }}
        />
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            padding: 14,
            gap: 12,
          }}>
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: '#FFFFFFCC',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Clock size={18} color={saloora.plum.hex} strokeWidth={1.8} />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: FONTS.bold,
                fontSize: 16,
                color: saloora.plum.hex,
                writingDirection: 'ltr',
              }}>
              {formatPersianTime(appointment.startTime)} – {formatPersianTime(appointment.endTime)}
            </Text>
            <Text
              style={{
                fontFamily: FONTS.reg,
                fontSize: 11,
                color: saloora.sage.hex,
                marginTop: 2,
              }}>
              مدت زمان: {toPersianDigits(durationMin)} دقیقه
            </Text>
          </View>
        </View>
      </View>

      {/* Detail rows */}
      <View style={{ marginTop: 14, gap: 10 }}>
        <DetailRow
          icon={<Scissors size={16} color={saloora.plum.hex} strokeWidth={1.8} />}
          label="خدمت"
          value={appointment.service.name}
          hint={
            appointment.service.duration
              ? `${toPersianDigits(appointment.service.duration)} دقیقه`
              : undefined
          }
        />
        <DetailRow
          icon={<UserIcon size={16} color={saloora.plum.hex} strokeWidth={1.8} />}
          label="آرایشگر"
          value={appointment.staff.name}
          rightDecor={
            <View
              style={{
                width: 14,
                height: 14,
                borderRadius: 7,
                backgroundColor: stripe,
              }}
            />
          }
        />
        {appointment.client.phone ? (
          <DetailRow
            icon={<Phone size={16} color={saloora.plum.hex} strokeWidth={1.8} />}
            label="تلفن مشتری"
            value={appointment.client.phone}
            valueLtr
          />
        ) : null}
        {appointment.notes ? (
          <DetailRow
            icon={<StickyNote size={16} color={saloora.plum.hex} strokeWidth={1.8} />}
            label="یادداشت"
            value={appointment.notes}
            multiline
          />
        ) : null}
      </View>

      {canChangeStatus ? (
        <StatusActions
          status={appointment.status}
          isManager={isManager}
          pending={pending}
          onPress={handleStatusChange}
        />
      ) : null}

      {error ? (
        <Text
          style={{
            marginTop: 12,
            fontFamily: FONTS.med,
            fontSize: 12,
            color: saloora.rose.hex,
            textAlign: 'center',
          }}>
          {error}
        </Text>
      ) : null}
    </ScrollView>
  );
}

function StatusActions({
  status,
  isManager,
  pending,
  onPress,
}: {
  status: AppointmentWithDetails['status'];
  isManager: boolean;
  pending: AppointmentWithDetails['status'] | null;
  onPress: (next: AppointmentWithDetails['status']) => void;
}) {
  type Action = {
    key: AppointmentWithDetails['status'];
    label: string;
    tone: 'primary' | 'neutral' | 'danger';
  };

  const actions: Action[] = [];
  if (status === 'scheduled') {
    actions.push({ key: 'confirmed', label: 'تایید نوبت', tone: 'primary' });
    if (isManager) actions.push({ key: 'cancelled', label: 'لغو', tone: 'danger' });
  } else if (status === 'confirmed') {
    actions.push({ key: 'completed', label: 'انجام شد', tone: 'primary' });
    actions.push({ key: 'no-show', label: 'غیبت', tone: 'neutral' });
  }

  if (actions.length === 0) return null;

  return (
    <View
      style={{
        marginTop: 16,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
      }}>
      {actions.map((action) => {
        const isPending = pending === action.key;
        const disabled = pending != null;
        const palette = actionPalette(action.tone);
        return (
          <Pressable
            key={action.key}
            onPress={() => onPress(action.key)}
            disabled={disabled}
            style={({ pressed }) => ({
              flexGrow: 1,
              flexBasis: '45%',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              minHeight: 44,
              paddingHorizontal: 14,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: palette.border,
              backgroundColor: palette.bg,
              opacity: disabled && !isPending ? 0.5 : pressed ? 0.85 : 1,
            })}>
            {isPending ? <ActivityIndicator size="small" color={palette.text} /> : null}
            <Text
              style={{
                fontFamily: FONTS.semi,
                fontSize: 13,
                color: palette.text,
              }}>
              {action.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function actionPalette(tone: 'primary' | 'neutral' | 'danger') {
  if (tone === 'primary') {
    return {
      bg: saloora.plum.hex,
      border: saloora.plum.hex,
      text: '#FFFFFF',
    };
  }
  if (tone === 'danger') {
    return {
      bg: '#FFFFFF',
      border: saloora.rose.hex + '66',
      text: saloora.rose.hex,
    };
  }
  return {
    bg: '#FFFFFF',
    border: '#E5D9DB',
    text: saloora.plum.hex,
  };
}

function DetailRow({
  icon,
  label,
  value,
  hint,
  multiline,
  valueLtr,
  rightDecor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  multiline?: boolean;
  valueLtr?: boolean;
  rightDecor?: React.ReactNode;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E5D9DB80',
        padding: 12,
      }}>
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F8EFF0',
        }}>
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: FONTS.med,
            fontSize: 10,
            color: saloora.sage.hex,
            marginBottom: 2,
          }}>
          {label}
        </Text>
        <Text
          numberOfLines={multiline ? undefined : 2}
          style={{
            fontFamily: FONTS.semi,
            fontSize: 13,
            color: saloora.plum.hex,
            writingDirection: valueLtr ? 'ltr' : 'rtl',
          }}>
          {value}
        </Text>
        {hint ? (
          <Text
            style={{
              fontFamily: FONTS.reg,
              fontSize: 11,
              color: saloora.sage.hex,
              marginTop: 2,
            }}>
            {hint}
          </Text>
        ) : null}
      </View>
      {rightDecor ? <View style={{ alignSelf: 'center' }}>{rightDecor}</View> : null}
    </View>
  );
}
