import type { AppointmentWithDetails, BusinessHours, User } from '@repo/salon-core/types';

export type CalendarView = 'day' | 'week' | 'month' | 'agenda';

export type CalendarStaff = User;

export type CalendarRange = {
  startYmd: string;
  endYmd: string;
};

export type CalendarViewProps = {
  cursorYmd: string;
  appointments: AppointmentWithDetails[];
  hours: BusinessHours;
  staffFilter: string | null;
  staffMap: Map<string, CalendarStaff>;
  isManager: boolean;
  loading: boolean;
  onSelectAppointment: (appointment: AppointmentWithDetails) => void;
  onSelectDay?: (ymd: string) => void;
  onSlotPress?: (ymd: string, hm: string) => void;
};
