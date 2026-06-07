/**
 * Write policy for manager PWA mutations.
 *
 * - queue-offline: DataClient write + flush pending sync on success
 * - require-online: API-only; no offline queue (ADR-gated where noted)
 */

export type WritePolicyMode = 'queue-offline' | 'require-online'

export const MANAGER_WRITE_OPERATIONS = [
  'appointmentRequest.approve',
  'appointmentRequest.reject',
] as const

export type ManagerWriteOperation = (typeof MANAGER_WRITE_OPERATIONS)[number]

/** Per-operation write policy. ADR: request approve/reject stay require-online. */
export const MANAGER_WRITE_POLICIES: Record<
  ManagerWriteOperation,
  WritePolicyMode
> = {
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
