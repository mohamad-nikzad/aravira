/**
 * Cron entrypoint — flips stale `pending` `AppointmentRequest`s
 * (`requestedDate < salonToday` in Asia/Tehran) to `expired`.
 *
 * Wire to system cron at 03:00 Asia/Tehran in prod (VPS).
 */
import { expirePastDueAppointmentRequests } from '@repo/database/appointment-requests'

async function main() {
  const count = await expirePastDueAppointmentRequests()
  console.log(`[expire-requests] expired ${count} request(s)`)
  const g = globalThis as { __salon_postgres?: { end: () => Promise<void> } }
  if (g.__salon_postgres) {
    await g.__salon_postgres.end()
  }
}

main().catch((err) => {
  console.error('[expire-requests] failed:', err)
  process.exit(1)
})
