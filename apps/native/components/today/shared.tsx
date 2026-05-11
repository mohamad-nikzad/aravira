import * as React from 'react';
import { Text, View } from 'react-native';
import type { AppointmentWithDetails, TodayAttentionItem } from '@repo/salon-core/types';
import { APPOINTMENT_STATUS } from '@repo/salon-core/types';
import { formatPersianTime, toPersianDigits } from '@repo/salon-core/persian-digits';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';

import { tw } from '../../lib/utils';
const FONT_REG = 'Vazirmatn_400Regular';
const FONT_MED = 'Vazirmatn_500Medium';
const FONT_SEMI = 'Vazirmatn_600SemiBold';
const FONT_BOLD = 'Vazirmatn_700Bold';

export const ACTIVE_STATUSES = new Set<AppointmentWithDetails['status']>([
  'scheduled',
  'confirmed',
]);

export const ATTENTION_LABELS: Record<TodayAttentionItem['type'], string> = {
  soon: 'نزدیک',
  overdue: 'ثبت نتیجه',
  'no-show-risk': 'بدقول',
  'first-time': 'اولین مراجعه',
  vip: 'VIP',
  'incomplete-client': 'اطلاعات ناقص',
};

const numFmt = new Intl.NumberFormat('fa-IR');
export function formatNumber(value: number) {
  return numFmt.format(value);
}

export function sortAppointments(list: AppointmentWithDetails[]) {
  return [...list].sort((a, b) =>
    `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`)
  );
}

export function summarizeOpenRanges(ranges: { startTime: string; endTime: string }[]) {
  if (ranges.length === 0) return 'بازه آزاد ندارد';
  const first = ranges[0];
  const primary = `${formatPersianTime(first.startTime)} تا ${formatPersianTime(first.endTime)}`;
  if (ranges.length === 1) return primary;
  return `${primary} · ${toPersianDigits(ranges.length - 1)} بازه دیگر`;
}

export function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card style={{ gap: 4, padding: 16 }}>
      <Text style={[tw('text-muted-foreground text-[11px]'), { fontFamily: FONT_MED }]}>
        {label}
      </Text>
      <Text style={[tw('text-foreground text-2xl'), { fontFamily: FONT_BOLD }]}>{value}</Text>
      {hint ? (
        <Text style={[tw('text-muted-foreground text-xs'), { fontFamily: FONT_REG }]}>{hint}</Text>
      ) : null}
    </Card>
  );
}

export function AppointmentCard({
  appointment,
  meta,
  tone = 'default',
  children,
}: {
  appointment: AppointmentWithDetails;
  meta: string;
  tone?: 'default' | 'highlight';
  children?: React.ReactNode;
}) {
  return (
    <View
      style={tw(
        'border-border/60 bg-card gap-3 rounded-2xl border p-3',
        tone === 'highlight' && 'border-primary/30 bg-primary/5'
      )}>
      <View style={tw('flex-row items-start justify-between gap-3')}>
        <View style={tw('min-w-0 flex-1 gap-1')}>
          <View style={tw('flex-row items-center gap-2')}>
            <Text
              style={[tw('text-foreground text-sm'), { fontFamily: FONT_SEMI }]}
              numberOfLines={1}>
              {appointment.client.name}
            </Text>
            {appointment.client.isPlaceholder ? (
              <Badge
                variant="outline"
                style={{
                  backgroundColor: '#fffbeb',
                  borderColor: '#fcd34d',
                  paddingHorizontal: 6,
                  paddingVertical: 0,
                }}
                textStyle={{ color: '#92400e', fontSize: 10 }}>
                اطلاعات ناقص
              </Badge>
            ) : null}
          </View>
          <Text style={[tw('text-muted-foreground text-xs'), { fontFamily: FONT_REG }]}>
            {appointment.service.name}
          </Text>
          <Text
            style={[
              tw('text-muted-foreground text-xs'),
              { fontFamily: FONT_REG, writingDirection: 'ltr' },
            ]}>
            {formatPersianTime(appointment.startTime)} - {formatPersianTime(appointment.endTime)} ·{' '}
            {meta}
          </Text>
          {appointment.notes ? (
            <Text
              style={[tw('text-muted-foreground text-xs'), { fontFamily: FONT_REG }]}
              numberOfLines={2}>
              {appointment.notes}
            </Text>
          ) : null}
        </View>
        <Badge
          variant="outline"
          style={{ paddingHorizontal: 8, paddingVertical: 2 }}
          textStyle={{ fontSize: 10 }}>
          {APPOINTMENT_STATUS[appointment.status].label}
        </Badge>
      </View>
      {children}
    </View>
  );
}

export function SectionCard({
  icon,
  title,
  children,
  toneClassName: _toneClassName,
}: {
  icon?: React.ReactNode;
  title: string;
  children: React.ReactNode;
  toneClassName?: string;
}) {
  return (
    <Card style={{ gap: 12 }}>
      <View style={tw('flex-row items-center gap-2')}>
        {icon}
        <Text style={[tw('text-foreground text-sm'), { fontFamily: FONT_SEMI }]}>{title}</Text>
      </View>
      <CardContent style={{ gap: 12, padding: 0 }}>{children}</CardContent>
    </Card>
  );
}

export const FONTS = {
  reg: FONT_REG,
  med: FONT_MED,
  semi: FONT_SEMI,
  bold: FONT_BOLD,
};
