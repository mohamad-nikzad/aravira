import { getCookie } from 'hono/cookie'
import { verifySession } from '@repo/auth/auth'
import { getUserById } from '@repo/database/auth-users'
import {
  hasTenantPermission,
  type TenantPermission,
  type TenantUser,
} from '@repo/auth/tenant'
import { factory } from '../factory'
import { error } from '../lib/responses'

function extractBearer(req: Request): string | null {
  const header = req.headers.get('authorization') ?? req.headers.get('Authorization')
  if (!header) return null
  const match = header.match(/^Bearer\s+(.+)$/i)
  return match ? match[1].trim() : null
}

async function resolveTenant(c: Parameters<typeof getCookie>[0]): Promise<TenantUser | null> {
  const req = c.req.raw
  const token = extractBearer(req) ?? getCookie(c, 'session') ?? null
  if (!token) return null
  const userId = await verifySession(token)
  if (!userId) return null
  const user = await getUserById(userId)
  if (!user) return null
  return {
    userId: user.id,
    salonId: user.salonId,
    role: user.role,
    name: user.name,
    phone: user.phone,
  }
}

export function requireTenant(permission?: TenantPermission) {
  return factory.createMiddleware(async (c, next) => {
    const tenant = await resolveTenant(c)
    if (!tenant) return error(c, 'دسترسی غیرمجاز', 401)
    if (permission && !hasTenantPermission(tenant.role, permission)) {
      return error(c, 'دسترسی غیرمجاز', 403)
    }
    c.set('tenant', tenant)
    await next()
  })
}
