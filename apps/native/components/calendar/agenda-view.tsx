import * as React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { CalendarX } from 'lucide-react-native';
import { formatJalaliFullDate, parseGregorianToJalali } from '@repo/salon-core/jalali';
import { formatPersianTime, toPersianDigits } from '@repo/salon-core/persian-digits';
import { addDaysYmd, salonTodayYmd } from '@repo/salon-core/salon-local-time';
import { saloora } from '@repo/brand-tokens/colors';
import { APPOINTMENT_STATUS, type AppointmentWithDetails } from '@repo/salon-core/types';
import {
  FONTS,
  appointmentsByDay,
  filterByStaff,
  hmToMinutes,
  numFmt,
  staffBorder,
  staffHex,
  staffSoftBg,
  statusPalette,
} from './helpers';
import type { CalendarViewProps } from './types';

const RANGE_DAYS = 14;

export function AgendaView(props: CalendarViewProps) {
  const { cursorYmd, appointments, staffFilter, onSelectAppointment } = props;
  const todayYmd = salonTodayYmd();

  const filtered = React.useMemo(
    () => filterByStaff(appointments, staffFilter),
    [appointments, staffFilter]
  );
  const dayMap = React.useMemo(() => appointmentsByDay(filtered), [filtered]);

  const days = React.useMemo(() => {
    const ymds: string[] = [];
    for (let i = 0; i < RANGE_DAYS; i++) ymds.push(addDaysYmd(cursorYmd, i));
    return ymds;
  }, [cursorYmd]);

  const sections = days
    .map((ymd) => ({ ymd, items: dayMap.get(ymd) ?? [] }))
    .filter((s) => s.items.length > 0);

  if (sections.length === 0) {
    return (
      <ScrollView
        contentContainerStyle={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}>
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: saloora.mist.hex,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 14,
          }}>
          <CalendarX size={26} color={saloora.plum.hex} strokeWidth={1.6} />
        </View>
        <Text
          style={{
            fontFamily: FONTS.semi,
            fontSize: 14,
            color: saloora.plum.hex,
            marginBottom: 6,
          }}>
          نوبتی در دو هفته‌ی پیش‌رو ثبت نشده
        </Text>
        <Text
          style={{
            fontFamily: FONTS.reg,
            fontSize: 12,
            color: saloora.sage.hex,
            textAlign: 'center',
          }}>
          از نمای روز یا ماه برای پیمایش بیشتر استفاده کنید.
        </Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 12, gap: 16 }}>
        {sections.map((section) => (
          <DaySection
            key={section.ymd}
            ymd={section.ymd}
            items={section.items}
            isToday={section.ymd === todayYmd}
            onSelectAppointment={onSelectAppointment}
          />
        ))}
      </View>
    </ScrollView>
  );
}

function DaySection({
  ymd,
  items,
  isToday,
  onSelectAppointment,
}: {
  ymd: string;
  items: AppointmentWithDetails[];
  isToday: boolean;
  onSelectAppointment: (appointment: AppointmentWithDetails) => void;
}) {
  const j = parseGregorianToJalali(ymd);
  const dow = (new Date(ymd + 'T12:00:00').getDay() + 1) % 7;
  const isFriday = dow === 6;
  const totalMinutes = items.reduce(
    (sum, a) => sum + (hmToMinutes(a.endTime) - hmToMinutes(a.startTime)),
    0
  );

  return (
    <View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          marginBottom: 10,
        }}>
        <View
          style={{
            width: 44,
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 6,
            borderRadius: 12,
            backgroundColor: isToday ? saloora.plum.hex : '#FFFFFF',
            borderWidth: 1,
            borderColor: isToday ? saloora.plum.hex : '#E5D9DB99',
          }}>
          <Text
            style={{
              fontFamily: FONTS.bold,
              fontSize: 16,
              color: isToday ? '#FFFFFF' : isFriday ? saloora.rose.hex : saloora.plum.hex,
            }}>
            {numFmt.format(j.jd)}
          </Text>
          <Text
            style={{
              fontFamily: FONTS.med,
              fontSize: 9,
              color: isToday ? '#FFFFFFCC' : saloora.sage.hex,
              marginTop: 1,
            }}>
            {['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'][dow]}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: FONTS.semi,
              fontSize: 13,
              color: saloora.plum.hex,
            }}
            numberOfLines={1}>
            {formatJalaliFullDate(ymd)}
          </Text>
          <Text
            style={{
              fontFamily: FONTS.reg,
              fontSize: 11,
              color: saloora.sage.hex,
              marginTop: 2,
            }}>
            {toPersianDigits(items.length)} نوبت · {toPersianDigits(Math.round(totalMinutes / 60))}{' '}
            ساعت کار
          </Text>
        </View>
        {isToday ? (
          <View
            style={{
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 999,
              backgroundColor: saloora.rose.hex + '22',
            }}>
            <Text style={{ fontFamily: FONTS.semi, fontSize: 10, color: saloora.rose.hex }}>
              امروز
            </Text>
          </View>
        ) : null}
      </View>

      <View style={{ gap: 8 }}>
        {items.map((apt) => (
          <AgendaRow key={apt.id} appointment={apt} onPress={() => onSelectAppointment(apt)} />
        ))}
      </View>
    </View>
  );
}

function AgendaRow({
  appointment,
  onPress,
}: {
  appointment: AppointmentWithDetails;
  onPress: () => void;
}) {
  const palette = statusPalette(appointment.status);
  const stripeHex = staffHex(appointment.staff.color);
  const tint = staffSoftBg(appointment.staff.color);
  const border = staffBorder(appointment.staff.color);
  const isCancelled = appointment.status === 'cancelled' || appointment.status === 'no-show';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: isCancelled ? '#E5E5E5' : border,
        overflow: 'hidden',
        opacity: pressed ? 0.85 : 1,
      })}>
      <View
        style={{
          width: 4,
          backgroundColor: isCancelled ? '#BDBDBD' : stripeHex,
        }}
      />
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 10,
          paddingHorizontal: 12,
          gap: 10,
        }}>
        <View
          style={{
            paddingVertical: 4,
            paddingHorizontal: 8,
            borderRadius: 8,
            backgroundColor: isCancelled ? '#F5F5F5' : tint,
            alignItems: 'center',
            minWidth: 64,
          }}>
          <Text
            style={{
              fontFamily: FONTS.bold,
              fontSize: 12,
              color: isCancelled ? '#737373' : saloora.plum.hex,
              writingDirection: 'ltr',
            }}>
            {formatPersianTime(appointment.startTime)}
          </Text>
          <Text
            style={{
              fontFamily: FONTS.reg,
              fontSize: 9,
              color: isCancelled ? '#A3A3A3' : saloora.sage.hex,
              writingDirection: 'ltr',
              marginTop: 1,
            }}>
            تا {formatPersianTime(appointment.endTime)}
          </Text>
        </View>

        <View style={{ flex: 1, gap: 2 }}>
          <Text
            numberOfLines={1}
            style={{
              fontFamily: FONTS.semi,
              fontSize: 13,
              color: saloora.plum.hex,
              textDecorationLine: appointment.status === 'cancelled' ? 'line-through' : 'none',
            }}>
            {appointment.client.name}
          </Text>
          <Text
            numberOfLines={1}
            style={{
              fontFamily: FONTS.reg,
              fontSize: 11,
              color: saloora.sage.hex,
            }}>
            {appointment.service.name} · {appointment.staff.name}
          </Text>
        </View>

        <View
          style={{
            paddingHorizontal: 7,
            paddingVertical: 3,
            borderRadius: 999,
            backgroundColor: palette.bg,
          }}>
          <Text
            style={{
              fontFamily: FONTS.semi,
              fontSize: 10,
              color: palette.text,
            }}>
            {APPOINTMENT_STATUS[appointment.status].label}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
