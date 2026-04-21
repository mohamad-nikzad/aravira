import type { BusinessHours, StaffSchedule } from './types';
export declare const STAFF_AVAILABILITY_CODES: {
    readonly OUTSIDE_STAFF_HOURS: "OUTSIDE_STAFF_HOURS";
    readonly STAFF_INACTIVE_DAY: "STAFF_INACTIVE_DAY";
    readonly OUTSIDE_BUSINESS_HOURS: "OUTSIDE_BUSINESS_HOURS";
};
export type StaffAvailabilityCode = (typeof STAFF_AVAILABILITY_CODES)[keyof typeof STAFF_AVAILABILITY_CODES];
export type StaffAvailabilityResult = {
    ok: true;
    source: 'staff' | 'business';
    hours: BusinessHours;
} | {
    ok: false;
    code: StaffAvailabilityCode;
    error: string;
    source: 'staff' | 'business';
    hours: BusinessHours;
};
export declare function dayOfWeekFromDate(date: string): number;
export declare function validateAgainstHours(startTime: string, endTime: string, hours: Pick<BusinessHours, 'workingStart' | 'workingEnd'>): boolean;
export declare function validateStaffAvailability(params: {
    schedule: StaffSchedule | undefined;
    hasAnyScheduleRows: boolean;
    businessHours: BusinessHours;
    startTime: string;
    endTime: string;
}): StaffAvailabilityResult;
