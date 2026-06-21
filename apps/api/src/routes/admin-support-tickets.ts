import { Hono } from 'hono'
import { z } from 'zod'
import {
  adminSupportTicketListQuerySchema,
  platformSupportReplySchema,
} from '@repo/salon-core/support-tickets'
import {
  addPlatformSupportMessage,
  getAdminSupportTicketDetail,
  getAdminSupportTicketSummary,
  listAdminSupportTickets,
  markSupportTicketReadByPlatform,
  resolveSupportTicket,
  type TicketMutationResult,
} from '@repo/database/support-tickets'
import { notifyManagersOfSupportReply } from '@repo/notifications'
import type { AppEnv } from '../factory'
import { adminAuditRequestMeta, writeAdminAudit } from '../lib/admin-audit'
import { created, error, ok } from '../lib/responses'
import { zValidator } from '../lib/validate'
import { requirePlatformAdmin } from '../middleware/auth'

const ticketParamsSchema = z.object({ ticketId: z.uuid() }).strict()

async function auditPlatformReply(
  c: Parameters<typeof adminAuditRequestMeta>[0] & { var: AppEnv['Variables'] },
  result: TicketMutationResult,
  resolveAfter: boolean,
) {
  if (!result.message) {
    throw new Error('Platform Support Message result did not include a message')
  }
  const actor = c.var.platformAdmin
  const request = adminAuditRequestMeta(c)
  const baseMetadata = {
    ticketId: result.ticket.id,
    salonId: result.ticket.salonId,
    previousStatus: result.previousStatus,
    resultingStatus: result.resultingStatus,
    resolveAfter,
  }
  await writeAdminAudit({
    actorUserId: actor.userId,
    actorPlatformRole: actor.role,
    action: 'support_ticket.message_created',
    targetType: 'support_message',
    targetId: result.message.id,
    salonId: result.ticket.salonId,
    reason: 'support_ticket_reply',
    metadata: baseMetadata,
    request,
  })

  if (resolveAfter || result.previousStatus === 'resolved') {
    await writeAdminAudit({
      actorUserId: actor.userId,
      actorPlatformRole: actor.role,
      action: 'support_ticket.status_changed',
      targetType: 'support_ticket',
      targetId: result.ticket.id,
      salonId: result.ticket.salonId,
      reason: 'support_ticket_status_change',
      metadata: {
        previousStatus: result.previousStatus,
        resultingStatus: result.resultingStatus,
        source: resolveAfter ? 'reply_and_resolve' : 'reply',
      },
      request,
    })
  }
}

export const adminSupportTicketsRoute = new Hono<AppEnv>()
  .use('*', requirePlatformAdmin('view_support_tickets'))
  .get('/', zValidator('query', adminSupportTicketListQuerySchema), async (c) =>
    ok(c, await listAdminSupportTickets(c.req.valid('query'))),
  )
  .get('/summary', async (c) => ok(c, await getAdminSupportTicketSummary()))
  .get('/:ticketId', zValidator('param', ticketParamsSchema), async (c) => {
    const detail = await getAdminSupportTicketDetail(
      c.req.valid('param').ticketId,
    )
    return detail ? ok(c, detail) : error(c, 'تیکت پشتیبانی یافت نشد', 404)
  })
  .post(
    '/:ticketId/read',
    zValidator('param', ticketParamsSchema),
    async (c) => {
      const result = await markSupportTicketReadByPlatform({
        ticketId: c.req.valid('param').ticketId,
      })
      return result ? ok(c, result) : error(c, 'تیکت پشتیبانی یافت نشد', 404)
    },
  )
  .post(
    '/:ticketId/messages',
    requirePlatformAdmin('reply_support_tickets'),
    zValidator('param', ticketParamsSchema),
    zValidator('json', platformSupportReplySchema),
    async (c) => {
      const actor = c.var.platformAdmin
      const body = c.req.valid('json')
      const resolveAfter = body.resolveAfter ?? false
      const result = await addPlatformSupportMessage({
        ticketId: c.req.valid('param').ticketId,
        authorUserId: actor.userId,
        authorDisplayName: actor.name,
        body: body.body,
        resolveAfter,
      })
      if (!result) return error(c, 'تیکت پشتیبانی یافت نشد', 404)

      await auditPlatformReply(c, result, resolveAfter)
      try {
        await notifyManagersOfSupportReply({
          salonId: result.ticket.salonId,
          ticketId: result.ticket.id,
        })
      } catch (err) {
        console.error('[notifications] support reply fanout failed', {
          salonId: result.ticket.salonId,
          ticketId: result.ticket.id,
          err,
        })
      }
      return created(c, result)
    },
  )
  .post(
    '/:ticketId/resolve',
    requirePlatformAdmin('resolve_support_tickets'),
    zValidator('param', ticketParamsSchema),
    async (c) => {
      const actor = c.var.platformAdmin
      const result = await resolveSupportTicket({
        ticketId: c.req.valid('param').ticketId,
        resolvedByUserId: actor.userId,
      })
      if (!result) return error(c, 'تیکت پشتیبانی یافت نشد', 404)
      if (result.changed) {
        await writeAdminAudit({
          actorUserId: actor.userId,
          actorPlatformRole: actor.role,
          action: 'support_ticket.status_changed',
          targetType: 'support_ticket',
          targetId: result.ticket.id,
          salonId: result.ticket.salonId,
          reason: 'support_ticket_status_change',
          metadata: {
            previousStatus: result.previousStatus,
            resultingStatus: result.resultingStatus,
            source: 'resolve',
          },
          request: adminAuditRequestMeta(c),
        })
      }
      return ok(c, result)
    },
  )

export type AdminSupportTicketsRoute = typeof adminSupportTicketsRoute
