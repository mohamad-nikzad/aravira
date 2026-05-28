import { auth } from '@repo/auth/server'
import { mapRole } from '@repo/auth/permissions'
import {
  hasTenantPermission,
  type TenantPermission,
} from '@repo/auth/tenant'
import { getMemberForUser } from '@repo/database/members'
import { factory } from '../factory'
import { error } from '../lib/responses'

export function requireTenant(permission?: TenantPermission) {
  return factory.createMiddleware(async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers })
    if (!session?.user) return error(c, 'دسترسی غیرمجاز', 401)

    const member = await getMemberForUser(session.user.id)
    if (!member) return error(c, 'دسترسی غیرمجاز', 403)

    const role = mapRole(member.role)
    if (permission && !hasTenantPermission(role, permission)) {
      return error(c, 'دسترسی غیرمجاز', 403)
    }

    c.set('tenant', {
      userId: member.userId,
      salonId: member.organizationId,
      role,
      name: member.name,
      phone: member.username,
    })
    await next()
  })
}
