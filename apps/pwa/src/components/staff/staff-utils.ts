import { eligibleServicesForStaff } from '@repo/salon-core/staff-service-autofill'
import type { Service, User, UserRole } from '@repo/salon-core/types'

export function staffRoleLabel(role: UserRole): string {
  return role === 'manager' ? 'مدیر سالن' : 'پرسنل'
}

export function staffServiceCount(member: User, services: Service[]): number {
  return eligibleServicesForStaff(member, services).length
}
