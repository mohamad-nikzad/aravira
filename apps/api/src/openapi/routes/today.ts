import { createRoute } from '@hono/zod-openapi'
import { apiErrorSchema, tenantSecurity } from '../schemas/common'
import { todayDataSchema, todayQuerySchema } from '../schemas/today'

const unauthorizedResponse = {
  description: 'Missing or invalid session',
  content: { 'application/json': { schema: apiErrorSchema } },
} as const

const forbiddenResponse = {
  description: 'Authenticated but not a salon member',
  content: { 'application/json': { schema: apiErrorSchema } },
} as const

export const getTodayRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Today'],
  summary: 'Get today view data',
  description:
    'Appointments, attention items, staff load, and open slots for a calendar day. Staff members only see their own appointments.',
  security: tenantSecurity,
  request: { query: todayQuerySchema },
  responses: {
    200: {
      description: 'Today view payload for the requested date',
      content: {
        'application/json': { schema: todayDataSchema },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
})
