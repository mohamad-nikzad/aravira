export declare const APPOINTMENT_DURATION_BOUNDS: {
    readonly min: 5;
    readonly max: number;
};
/** Parses HH:mm (and common variants). Never returns an invalid Date. */
export declare function parseTimeHm(t: string): Date;
export declare function formatTimeHm(d: Date): string;
export declare function endTimeFromDuration(startTime: string, durationMinutes: number): string;
export declare function durationMinutesFromRange(startTime: string, endTime: string): number;
export declare function isEndAfterStart(startTime: string, endTime: string): boolean;
export declare function validateAppointmentWindow(startTime: string, endTime: string): {
    ok: true;
} | {
    ok: false;
    error: string;
};
