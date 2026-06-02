import { Hono } from 'hono'
import {
  getManagerPublicSettings,
  updateManagerPublicSettings,
  updateSalonSlug,
} from '@repo/database/public'
import { publicSettingsSchema } from '@repo/salon-core/forms/public'
import { slugUpdateSchema } from '@repo/salon-core/forms/slug'
import type { AppEnv } from '../factory'
import { requireTenant } from '../middleware/auth'
import { zValidator } from '../lib/validate'
import { error, ok } from '../lib/responses'

export const salonPublicSettings = new Hono<AppEnv>()
  .get('/', requireTenant('manage_settings'), async (c) => {
    const { salonId } = c.var.tenant
    const result = await getManagerPublicSettings(salonId)
    return ok(c, result)
  })
  .put(
    '/',
    requireTenant('manage_settings'),
    zValidator('json', publicSettingsSchema),
    async (c) => {
      const { salonId } = c.var.tenant
      const payload = c.req.valid('json')
      const result = await updateManagerPublicSettings(salonId, payload)
      return ok(c, result)
    },
  )
  .patch(
    '/slug',
    requireTenant('manage_settings'),
    zValidator('json', slugUpdateSchema),
    async (c) => {
      const { salonId } = c.var.tenant
      const { slug } = c.req.valid('json')
      const outcome = await updateSalonSlug(salonId, slug)
      if (!outcome.ok) {
        return error(c, 'این آدرس سالن قبلاً ثبت شده است', 409)
      }
      return ok(c, outcome.result)
    },
  )

export type SalonPublicSettingsRoute = typeof salonPublicSettings
