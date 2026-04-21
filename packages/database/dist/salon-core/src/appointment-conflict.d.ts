import type { Appointment } from './types';
/** Statuses that occupy the calendar for conflict purposes (per scheduling plan). */
export declare function isBlockingAppointmentStatus(status: Appointment['status']): boolean;
/** Overlap on the same calendar day using HH:mm lexical order (same as existing storage). */
export declare function appointmentIntervalsConflict(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean;
export declare function hasAppointmentConflict(appointments: Pick<Appointment, 'staffId' | 'date' | 'startTime' | 'endTime' | 'status' | 'id'>[], staffId: string, date: string, startTime: string, endTime: string, excludeId?: string): boolean;
export type ScheduleConflictRow = Pick<Appointment, 'id' | 'staffId' | 'clientId' | 'date' | 'startTime' | 'endTime' | 'status'> & {
    salonId?: string;
};
export type ScheduleOverlapFlags = {
    staffConflict: boolean;
    clientConflict: boolean;
};
export declare const SCHEDULE_CONFLICT_CODES: {
    readonly STAFF_OVERLAP: "STAFF_OVERLAP";
    readonly CLIENT_OVERLAP: "CLIENT_OVERLAP";
};
export type ScheduleConflictCode = (typeof SCHEDULE_CONFLICT_CODES)[keyof typeof SCHEDULE_CONFLICT_CODES];
/**
 * Detect staff vs client overlap against a candidate window (same day).
 * Cancelled / completed / no-show do not block; excludeId skips the current appointment on edit.
 */
export declare function detectScheduleOverlaps(rows: ScheduleConflictRow[], params: {
    staffId: string;
    clientId: string;
    date: string;
    startTime: string;
    endTime: string;
    excludeId?: string;
    salonId?: string;
}): ScheduleOverlapFlags;
