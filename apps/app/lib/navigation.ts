import type { UserRole } from '@repo/salon-core/types'

export function homePathForRole(_role: UserRole) {
  return '/today'
}
