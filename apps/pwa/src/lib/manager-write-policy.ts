/**
 * Write policy for manager PWA mutations.
 *
 * Migrated domains use generated query/mutation hooks directly (online-only).
 * Remaining data-client operations will be removed in Phase 17.
 */

export type WritePolicyMode = 'queue-offline' | 'require-online'

export const MANAGER_WRITE_OPERATIONS = [] as const

export type ManagerWriteOperation = (typeof MANAGER_WRITE_OPERATIONS)[number]

export const MANAGER_WRITE_POLICIES: Record<
  ManagerWriteOperation,
  WritePolicyMode
> = {}

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
