declare const JALALI_MONTHS: readonly ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
declare const JALALI_WEEKDAYS_SHORT: readonly ["ش", "ی", "د", "س", "چ", "پ", "ج"];
export { JALALI_MONTHS, JALALI_WEEKDAYS_SHORT };
export declare function toJalali(gy: number, gm: number, gd: number): {
    jy: number;
    jm: number;
    jd: number;
};
export declare function toGregorian(jy: number, jm: number, jd: number): {
    gy: number;
    gm: number;
    gd: number;
};
export declare function isJalaliLeap(jy: number): boolean;
export declare function jalaliMonthLength(jy: number, jm: number): number;
/** Gregorian "yyyy-MM-dd" → { jy, jm, jd } */
export declare function parseGregorianToJalali(dateStr: string): {
    jy: number;
    jm: number;
    jd: number;
};
/** Jalali date parts → Gregorian "yyyy-MM-dd" */
export declare function jalaliToGregorianStr(jy: number, jm: number, jd: number): string;
/** Format Gregorian "yyyy-MM-dd" as Jalali display string: "۲۶ فروردین ۱۴۰۴" */
export declare function formatJalaliDate(dateStr: string): string;
/** Format Gregorian "yyyy-MM-dd" as full Jalali with weekday: "شنبه، ۲۶ فروردین ۱۴۰۴" */
export declare function formatJalaliFullDate(dateStr: string): string;
/**
 * Get the day-of-week (Saturday=0 … Friday=6) for the first day of a Jalali month.
 * Iran week starts on Saturday.
 */
export declare function jalaliMonthStartDow(jy: number, jm: number): number;
