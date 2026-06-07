/**
 * Write policy for manager PWA mutations.
 *
 * - queue-offline: DataClient write + flush pending sync on success
 * - require-online: API-only; no offline queue (ADR-gated where noted)
 */

export type WritePolicyMode = 'queue-offline' | 'require-online'

export const MANAGER_WRITE_OPERATIONS = [
  'appointment.create',
  'appointment.update',
  'appointment.delete',
  'appointment.updateStatus',
  'appointment.completePlaceholderClient',
  'service.save',
  'serviceCategory.save',
  'serviceFamily.save',
  'serviceAddon.save',
  'staff.create',
  'staff.update',
  'staff.updatePassword',
  'staff.delete',
  'staff.setServiceIds',
  'staff.saveSchedule',
  'staffToday.appointment.updateStatus',
  'appointmentRequest.approve',
  'appointmentRequest.reject',
] as const

export type ManagerWriteOperation = (typeof MANAGER_WRITE_OPERATIONS)[number]

/** Per-operation write policy. ADR: request approve/reject stay require-online. */
export const MANAGER_WRITE_POLICIES: Record<
  ManagerWriteOperation,
  WritePolicyMode
> = {
  'appointment.create': 'queue-offline',
  'appointment.update': 'queue-offline',
  'appointment.delete': 'queue-offline',
  'appointment.updateStatus': 'queue-offline',
  'appointment.completePlaceholderClient': 'queue-offline',
  'service.save': 'queue-offline',
  'serviceCategory.save': 'queue-offline',
  'serviceFamily.save': 'queue-offline',
  'serviceAddon.save': 'queue-offline',
  /** Staff account creation — server-side auth; no offline queue. */
  'staff.create': 'require-online',
  /** Staff/account profile editing — server-side auth identity; no offline queue. */
  'staff.update': 'require-online',
  /** Staff credential updates — server-side auth identity; no offline queue. */
  'staff.updatePassword': 'require-online',
  /** Staff access removal — server-side auth identity; no offline queue. */
  'staff.delete': 'require-online',
  'staff.setServiceIds': 'queue-offline',
  'staff.saveSchedule': 'queue-offline',
  /** Staff /today status changes — online API only (no offline queue). */
  'staffToday.appointment.updateStatus': 'require-online',
  /** ADR-0001 / ADR-0002: intake at approval; no offline queue or soft-hold. */
  'appointmentRequest.approve': 'require-online',
  'appointmentRequest.reject': 'require-online',
}

export function getWritePolicy(
  operation: ManagerWriteOperation,
): WritePolicyMode {
  return MANAGER_WRITE_POLICIES[operation]
}

export function writePolicyQueuesOffline(
  operation: ManagerWriteOperation,
): boolean {
  return getWritePolicy(operation) === 'queue-offline'
}

export function writePolicyRequiresOnline(
  operation: ManagerWriteOperation,
): boolean {
  return getWritePolicy(operation) === 'require-online'
}

export function writePolicyUsesDataClient(
  operation: ManagerWriteOperation,
): boolean {
  return getWritePolicy(operation) === 'queue-offline'
}

export const OFFLINE_WRITE_BLOCKED_MESSAGE =
  'برای این عملیات باید آنلاین باشید.'

export function assertOnlineForWrite(
  operation: ManagerWriteOperation,
  isOnline: boolean,
): void {
  if (writePolicyRequiresOnline(operation) && !isOnline) {
    throw new Error(OFFLINE_WRITE_BLOCKED_MESSAGE)
  }
}
