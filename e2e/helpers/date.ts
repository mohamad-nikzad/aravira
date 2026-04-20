/** Gregorian YYYY-MM-DD in Asia/Tehran for "today". */
export function tehranTodayYmd(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Tehran' })
}

/** Add calendar days to a YYYY-MM-DD string (UTC noon anchor). */
export function addDaysYmd(ymd: string, deltaDays: number): string {
  const [y, m, d] = ymd.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0))
  dt.setUTCDate(dt.getUTCDate() + deltaDays)
  return dt.toISOString().slice(0, 10)
}
