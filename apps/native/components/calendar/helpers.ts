import { calendarColorById } from '@repo/brand-tokens/calendar-colors';
import { saloora } from '@repo/brand-tokens/colors';
import { normalizeCalendarColorId } from '@repo/salon-core/calendar-colors';
import {
  jalaliMonthLength,
  jalaliMonthStartDow,
  jalaliToGregorianStr,
  parseGregorianToJalali,
  toJalali,
} from '@repo/salon-core/jalali';
import { addDaysYmd } from '@repo/salon-core/salon-local-time';
import type { AppointmentWithDetails, BusinessHours } from '@repo/salon-core/types';
import { WORKING_HOURS } from '@repo/salon-core/types';

export const FONTS = {
  reg: 'Vazirmatn_400Regular',
  med: 'Vazirmatn_500Medium',
  semi: 'Vazirmatn_600SemiBold',
  bold: 'Vazirmatn_700Bold',
} as const;

export const numFmt = new Intl.NumberFormat('fa-IR');

export function hmToMinutes(hm: string): number {
  const [h, m] = hm.split(':').map(Number);
  return h * 60 + m;
}

export function minutesToHm(total: number): string {
  const h = Math.floor(total / 60);
  const m = Math.floor(total % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function clampToHours(
  startMin: number,
  endMin: number,
  hours: BusinessHours
): { start: number; end: number } | null {
  const lo = hmToMinutes(hours.workingStart);
  const hi = hmToMinutes(hours.workingEnd);
  const start = Math.max(startMin, lo);
  const end = Math.min(endMin, hi);
  if (end <= start) return null;
  return { start, end };
}

/** Resolve calendar color hex from new ids or legacy User.color values. */
export function staffHex(color: string | undefined | null): string {
  if (!color) return saloora.sage.hex;
  return calendarColorById[normalizeCalendarColorId(color)].light.hex;
}

export function staffSoftBg(color: string | undefined | null): string {
  // 18% opacity tinted background
  return `${staffHex(color)}26`;
}

export function staffBorder(color: string | undefined | null): string {
  return `${staffHex(color)}55`;
}

/** Get Jalali Saturday-anchored week start for a Gregorian YYYY-MM-DD */
export function weekStartYmd(ymd: string): string {
  const date = new Date(ymd + 'T12:00:00');
  // JS getDay(): 0=Sun … 6=Sat. Convert to Sat=0 … Fri=6
  const dow = (date.getDay() + 1) % 7;
  return addDaysYmd(ymd, -dow);
}

export function weekDays(weekStart: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDaysYmd(weekStart, i));
}

/** Generate Jalali month grid with leading/trailing pads. Returns 6 weeks of 7 cells each. */
export type MonthGridCell = {
  ymd: string;
  jd: number;
  inCurrentMonth: boolean;
};

export function jalaliMonthGrid(jy: number, jm: number): MonthGridCell[][] {
  const len = jalaliMonthLength(jy, jm);
  const startDow = jalaliMonthStartDow(jy, jm);

  const prevJm = jm === 1 ? 12 : jm - 1;
  const prevJy = jm === 1 ? jy - 1 : jy;
  const prevLen = jalaliMonthLength(prevJy, prevJm);

  const nextJm = jm === 12 ? 1 : jm + 1;
  const nextJy = jm === 12 ? jy + 1 : jy;

  const cells: MonthGridCell[] = [];
  for (let i = startDow - 1; i >= 0; i--) {
    const jd = prevLen - i;
    cells.push({
      ymd: jalaliToGregorianStr(prevJy, prevJm, jd),
      jd,
      inCurrentMonth: false,
    });
  }
  for (let d = 1; d <= len; d++) {
    cells.push({
      ymd: jalaliToGregorianStr(jy, jm, d),
      jd: d,
      inCurrentMonth: true,
    });
  }
  let nextDay = 1;
  while (cells.length < 42) {
    cells.push({
      ymd: jalaliToGregorianStr(nextJy, nextJm, nextDay),
      jd: nextDay,
      inCurrentMonth: false,
    });
    nextDay++;
  }

  const rows: MonthGridCell[][] = [];
  for (let i = 0; i < 6; i++) {
    rows.push(cells.slice(i * 7, i * 7 + 7));
  }
  return rows;
}

export function jalaliFromYmd(ymd: string) {
  return parseGregorianToJalali(ymd);
}

export function todayJalali() {
  const now = new Date();
  return toJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

/** Returns minute index of the working window for a given clock minute, or null if out of window */
export function minuteOffsetWithin(hm: string, hours: BusinessHours): number | null {
  const m = hmToMinutes(hm);
  const lo = hmToMinutes(hours.workingStart);
  const hi = hmToMinutes(hours.workingEnd);
  if (m < lo || m > hi) return null;
  return m - lo;
}

export function workingMinutes(hours: BusinessHours): number {
  return hmToMinutes(hours.workingEnd) - hmToMinutes(hours.workingStart);
}

/** Generate hour-step labels in salon working window: ["09:00", "10:00", ...] */
export function hourLabels(hours: BusinessHours): string[] {
  const lo = hmToMinutes(hours.workingStart);
  const hi = hmToMinutes(hours.workingEnd);
  const out: string[] = [];
  // align to top of hour
  const startHour = Math.ceil(lo / 60) * 60;
  for (let m = startHour; m <= hi; m += 60) {
    out.push(minutesToHm(m));
  }
  return out;
}

export function defaultBusinessHours(input: BusinessHours | null | undefined): BusinessHours {
  if (input) return input;
  return {
    workingStart: WORKING_HOURS.start,
    workingEnd: WORKING_HOURS.end,
    slotDurationMinutes: WORKING_HOURS.slotDuration,
  };
}

export function appointmentsByDay(
  appointments: AppointmentWithDetails[]
): Map<string, AppointmentWithDetails[]> {
  const map = new Map<string, AppointmentWithDetails[]>();
  for (const a of appointments) {
    const list = map.get(a.date);
    if (list) list.push(a);
    else map.set(a.date, [a]);
  }
  for (const list of map.values()) {
    list.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }
  return map;
}

export type StatusPalette = {
  bg: string;
  text: string;
  border: string;
};

const STATUS_PALETTE: Record<AppointmentWithDetails['status'], StatusPalette> = {
  scheduled: { bg: '#F4EFE7', text: '#767A6F', border: '#E5D9DB' },
  confirmed: { bg: '#ECD3D7', text: '#6B3A4A', border: '#D8B8BF' },
  completed: { bg: '#DCEFE1', text: '#1F6B3A', border: '#B8D9C0' },
  cancelled: { bg: '#F7DAD7', text: '#A02A1F', border: '#E5B4AD' },
  'no-show': { bg: '#FCE7CC', text: '#9A5A12', border: '#EBC994' },
};

export function statusPalette(s: AppointmentWithDetails['status']): StatusPalette {
  return STATUS_PALETTE[s];
}

/** Filter helper that respects optional staffFilter */
export function filterByStaff(
  appointments: AppointmentWithDetails[],
  staffId: string | null
): AppointmentWithDetails[] {
  if (!staffId) return appointments;
  return appointments.filter((a) => a.staffId === staffId);
}
