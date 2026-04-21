/**
 * Jalali (شمسی) labels using ICU Persian calendar — matches user-facing dates in Iran.
 * Falls back to fa-IR Gregorian if the runtime does not support u-ca-persian.
 */
/** Day column header (week / time-grid): e.g. شنبه ۲ فروردین */
export declare function formatPersianDayHeader(date: Date): string;
/** Compact day header for narrow columns: weekday abbreviation + day number on separate lines */
export declare function formatPersianDayHeaderCompact(date: Date): {
    weekday: string;
    day: string;
};
/** Numeric day inside month grid */
export declare function formatPersianDayNumber(date: Date): string;
/** Month + year line (month view popover / titles) */
export declare function formatPersianMonthYear(date: Date): string;
/** Single day title */
export declare function formatPersianFullDate(date: Date): string;
/** Week range title */
export declare function formatPersianWeekRange(weekStart: Date, weekEnd: Date): string;
/** Time labels (۲۴ ساعته، ارقام فارسی) */
export declare function formatPersianTimeHm(date: Date): string;
/** List view day heading */
export declare function formatPersianListDay(date: Date): string;
/** FullCalendar VerboseFormattingArg / ExpandedZonedMarker → local Date (wall time) */
export declare function expandedZonedToDate(z: {
    year: number;
    month: number;
    day: number;
    hour?: number;
    minute?: number;
    second?: number;
    millisecond?: number;
}): Date;
