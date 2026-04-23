import type { UserRole } from '@repo/salon-core/types'

export function homePathForRole(role: UserRole) {
  return role === 'manager' ? '/today' : '/calendar'
}
