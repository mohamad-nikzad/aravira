import { getCurrentUser } from './auth'
import type { UserRole } from '@repo/salon-core/types'
import { forbidden, unauthorized } from './authz'

export type TenantUser = {
  userId: string
  salonId: string
  role: UserRole
  name: string
  phone: string
}

export type TenantPermission =
  | 'manage_settings'
  | 'manage_staff'
  | 'manage_services'
  | 'manage_clients'
  | 'manage_appointments'
  | 'view_dashboard'
  | 'view_own_appointments'

export type TenantRequest =
  | { ok: true; user: TenantUser }
  | { ok: false; response: ReturnType<typeof unauthorized> }

const rolePermissions: Record<UserRole, ReadonlySet<TenantPermission>> = {
  manager: new Set([
    'manage_settings',
    'manage_staff',
    'manage_services',
    'manage_clients',
    'manage_appointments',
    'view_dashboard',
    'view_own_appointments',
  ]),
  staff: new Set(['view_own_appointments']),
}

export async function getTenantUser(): Promise<TenantUser | null> {
  const user = await getCurrentUser()
  if (!user) return null

  return {
    userId: user.id,
    salonId: user.salonId,
    role: user.role,
    name: user.name,
    phone: user.phone,
  }
}

export async function requireTenantUser(): Promise<TenantUser> {
  const user = await getTenantUser()
  if (!user) {
    throw new Error('UNAUTHORIZED')
  }
  return user
}

export function isManagerRole(role: UserRole): boolean {
  return hasTenantPermission(role, 'manage_settings')
}

export function hasTenantPermission(role: UserRole, permission: TenantPermission): boolean {
  return rolePermissions[role]?.has(permission) ?? false
}

export async function requireTenantManager(): Promise<TenantUser> {
  const user = await requireTenantUser()
  if (!hasTenantPermission(user.role, 'manage_settings')) {
    throw new Error('FORBIDDEN')
  }
  return user
}

export async function getTenantRequest(
  permission?: TenantPermission
): Promise<TenantRequest> {
  const user = await getTenantUser()
  if (!user) {
    return { ok: false, response: unauthorized() }
  }
  if (permission && !hasTenantPermission(user.role, permission)) {
    return { ok: false, response: forbidden() }
  }
  return { ok: true, user }
}

export function getTenantManagerRequest(): Promise<TenantRequest> {
  return getTenantRequest('manage_settings')
}
