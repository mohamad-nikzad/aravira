import { Hono } from 'hono'
import {
  getOnboardingStatus,
  updateOnboardingState,
  type OnboardingAction,
} from '@repo/database/onboarding'
import type { AppEnv } from '../factory'
import { requireTenant } from '../middleware/auth'
import { error, ok } from '../lib/responses'

const actions = new Set<OnboardingAction>([
  'complete',
  'skip',
  'reopen',
  'set-manager-staff',
  'confirm-business-hours',
])

export const onboarding = new Hono<AppEnv>()
  .use(requireTenant('manage_settings'))
  .get('/', async (c) => {
    const { salonId } = c.var.tenant
    const onboarding = await getOnboardingStatus(salonId)
    return ok(c, { onboarding })
  })
  .patch('/', async (c) => {
    const body = (await c.req.json().catch(() => ({}))) as { action?: unknown }
    const action = String(body.action ?? '') as OnboardingAction
    if (!actions.has(action)) {
      return error(c, 'درخواست نامعتبر است', 400)
    }
    const { salonId } = c.var.tenant

    if (action === 'skip') {
      // Top-level skip only allowed once required steps are done.
      const current = await getOnboardingStatus(salonId)
      if (!current.steps.servicesAdded || !current.steps.staffAdded) {
        return error(c, 'ابتدا خدمات و کارکنان را اضافه کنید', 400)
      }
    }

    const onboarding = await updateOnboardingState(salonId, action)
    return ok(c, { onboarding })
  })

export type OnboardingRoute = typeof onboarding
