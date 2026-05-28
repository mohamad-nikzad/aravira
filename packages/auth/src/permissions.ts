import type { UserRole } from '@repo/salon-core/types'

/**
 * Collapse a Better Auth member role onto our two-tier tenant role.
 * `owner`/`admin` manage the salon; everyone else is staff.
 */
export function mapRole(role: string): UserRole {
  return role === 'owner' || role === 'admin' ? 'manager' : 'staff'
}
