import { Hono } from 'hono'
import { z } from 'zod'
import {
  createSupportMessageSchema,
  createSupportTicketSchema,
  supportTicketListQuerySchema,
} from '@repo/salon-core/support-tickets'
import {
  addManagerSupportMessage,
  createSupportTicket,
  getSalonSupportTicketDetail,
  getSalonSupportTicketSummary,
  listSalonSupportTickets,
  markSupportTicketReadByManager,
} from '@repo/database/support-tickets'
import type { AppEnv } from '../factory'
import { requireTenant } from '../middleware/auth'
import { created, error, ok } from '../lib/responses'
import { zValidator } from '../lib/validate'

const ticketParamsSchema = z.object({ ticketId: z.uuid() }).strict()

export const supportTicketsRoute = new Hono<AppEnv>()
  .get(
    '/',
    requireTenant('view_support_tickets'),
    zValidator('query', supportTicketListQuerySchema),
    async (c) => {
      const query = c.req.valid('query')
      return ok(
        c,
        await listSalonSupportTickets({
          salonId: c.var.tenant.salonId,
          page: query.page,
          pageSize: query.pageSize,
        }),
      )
    },
  )
  .post(
    '/',
    requireTenant('manage_support_tickets'),
    zValidator('json', createSupportTicketSchema),
    async (c) => {
      const tenant = c.var.tenant
      const body = c.req.valid('json')
      return created(
        c,
        await createSupportTicket({
          salonId: tenant.salonId,
          submittedByUserId: tenant.userId,
          submittedByDisplayName: tenant.name,
          ...body,
        }),
      )
    },
  )
  .get(
    '/summary',
    requireTenant('view_support_tickets'),
    async (c) => ok(c, await getSalonSupportTicketSummary(c.var.tenant.salonId)),
  )
  .get(
    '/:ticketId',
    requireTenant('view_support_tickets'),
    zValidator('param', ticketParamsSchema),
    async (c) => {
      const detail = await getSalonSupportTicketDetail({
        salonId: c.var.tenant.salonId,
        ticketId: c.req.valid('param').ticketId,
      })
      return detail ? ok(c, detail) : error(c, 'تیکت پشتیبانی یافت نشد', 404)
    },
  )
  .post(
    '/:ticketId/messages',
    requireTenant('manage_support_tickets'),
    zValidator('param', ticketParamsSchema),
    zValidator('json', createSupportMessageSchema),
    async (c) => {
      const tenant = c.var.tenant
      const result = await addManagerSupportMessage({
        salonId: tenant.salonId,
        ticketId: c.req.valid('param').ticketId,
        authorUserId: tenant.userId,
        authorDisplayName: tenant.name,
        body: c.req.valid('json').body,
      })
      return result
        ? created(c, result)
        : error(c, 'تیکت پشتیبانی یافت نشد', 404)
    },
  )
  .post(
    '/:ticketId/read',
    requireTenant('view_support_tickets'),
    zValidator('param', ticketParamsSchema),
    async (c) => {
      const result = await markSupportTicketReadByManager({
        salonId: c.var.tenant.salonId,
        ticketId: c.req.valid('param').ticketId,
      })
      return result
        ? ok(c, result)
        : error(c, 'تیکت پشتیبانی یافت نشد', 404)
    },
  )

export type SupportTicketsRoute = typeof supportTicketsRoute
