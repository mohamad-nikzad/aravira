import { Hono } from 'hono'
import { z } from 'zod'
import {
  createClient,
  createClientFollowUp,
  getAllClients,
  getClientById,
  getClientSummary,
  getClientTags,
  isClientProvidedEntityId,
  setClientTags,
  updateClient,
} from '@repo/database/clients'
import { clientCreateSchema, clientUpdateSchema } from '@repo/salon-core/forms/client'
import type { FollowUpReason } from '@repo/salon-core/types'
import type { AppEnv } from '../factory'
import { requireTenant } from '../middleware/auth'
import { zValidator } from '../lib/validate'
import { error, ok } from '../lib/responses'

const idParamSchema = z.object({ id: z.string().min(1) })

const followUpBodySchema = z.object({
  reason: z.string().optional(),
  dueDate: z.string().optional(),
})

const allowedReasons = new Set<FollowUpReason>([
  'inactive',
  'no-show',
  'new-client',
  'vip',
  'manual',
])

function isDuplicatePhoneError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : ''
  return msg.includes('unique') || msg.includes('duplicate')
}

export const clients = new Hono<AppEnv>()
  .use('*', requireTenant('manage_clients'))
  .get('/', async (c) => {
    const { salonId } = c.var.tenant
    const list = await getAllClients(salonId)
    return ok(c, { clients: list })
  })
  .post('/', zValidator('json', clientCreateSchema), async (c) => {
    const { salonId } = c.var.tenant
    const { name, phone, notes, tags, id: requestedId } = c.req.valid('json')
    try {
      const client = await createClient({
        name,
        phone,
        notes,
        salonId,
        ...(isClientProvidedEntityId(requestedId) ? { id: requestedId } : {}),
      })
      const savedTags = await setClientTags(client.id, salonId, tags)
      return ok(c, { client: { ...client, tags: savedTags } })
    } catch (err) {
      if (isDuplicatePhoneError(err)) {
        return error(
          c,
          'این شماره تماس برای این سالن قبلاً ثبت شده است',
          409,
          'duplicate-phone',
        )
      }
      throw err
    }
  })
  .get('/:id', zValidator('param', idParamSchema), async (c) => {
    const { salonId } = c.var.tenant
    const { id } = c.req.valid('param')
    const client = await getClientById(id, salonId)
    if (!client) return error(c, 'مشتری یافت نشد', 404)
    const tags = await getClientTags(id, salonId)
    return ok(c, { client: { ...client, tags } })
  })
  .patch(
    '/:id',
    zValidator('param', idParamSchema),
    zValidator('json', clientUpdateSchema),
    async (c) => {
      const { salonId } = c.var.tenant
      const { id } = c.req.valid('param')
      const { name, phone, notes, tags } = c.req.valid('json')
      try {
        const client = await updateClient(id, salonId, { name, phone, notes })
        if (!client) return error(c, 'مشتری یافت نشد', 404)
        const savedTags = Array.isArray(tags)
          ? await setClientTags(id, salonId, tags)
          : await getClientTags(id, salonId)
        return ok(c, { client: { ...client, tags: savedTags } })
      } catch (err) {
        if (isDuplicatePhoneError(err)) {
          return error(
            c,
            'این شماره تماس برای این سالن قبلاً ثبت شده است',
            409,
            'duplicate-phone',
          )
        }
        throw err
      }
    },
  )
  .get('/:id/summary', zValidator('param', idParamSchema), async (c) => {
    const { salonId } = c.var.tenant
    const { id } = c.req.valid('param')
    const summary = await getClientSummary(salonId, id)
    if (!summary) return error(c, 'مشتری یافت نشد', 404)
    return ok(c, summary)
  })
  .post('/:id/follow-ups', zValidator('param', idParamSchema), async (c) => {
    const { salonId } = c.var.tenant
    const { id } = c.req.valid('param')
    const client = await getClientById(id, salonId)
    if (!client) return error(c, 'مشتری یافت نشد', 404)
    const raw = await c.req.json().catch(() => ({}))
    const body = followUpBodySchema.parse(raw ?? {})
    const reason: FollowUpReason = allowedReasons.has(body.reason as FollowUpReason)
      ? (body.reason as FollowUpReason)
      : 'manual'
    const followUp = await createClientFollowUp(salonId, id, reason, body.dueDate)
    return ok(c, { followUp })
  })

export type ClientsRoute = typeof clients
