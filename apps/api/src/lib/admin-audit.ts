import { createAdminAuditEvent, type PlatformRole } from '@repo/database/admin'

type AuditContext = {
  req: { header: (name: string) => string | undefined }
}

export function adminAuditRequestMeta(c: AuditContext) {
  return {
    ip:
      c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ??
      c.req.header('x-real-ip') ??
      null,
    userAgent: c.req.header('user-agent') ?? null,
    requestId: c.req.header('x-request-id') ?? null,
  }
}

export async function writeAdminAudit(input: {
  actorUserId: string
  actorPlatformRole: PlatformRole
  action: string
  targetType: string
  targetId: string
  salonId?: string | null
  metadata?: Record<string, unknown>
  request: ReturnType<typeof adminAuditRequestMeta>
}) {
  await createAdminAuditEvent({
    actorUserId: input.actorUserId,
    actorPlatformRole: input.actorPlatformRole,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId,
    salonId: input.salonId ?? null,
    metadata: input.metadata,
    requestId: input.request.requestId,
    ip: input.request.ip,
    userAgent: input.request.userAgent,
  })
}
