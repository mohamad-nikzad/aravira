import { createRoute } from '@hono/zod-openapi'
import { apiErrorSchema, tenantSecurity } from '../schemas/common'
import { dashboardDataSchema } from '../schemas/dashboard'

const unauthorizedResponse = {
  description: 'Missing or invalid session',
  content: { 'application/json': { schema: apiErrorSchema } },
} as const

const forbiddenResponse = {
  description: 'Authenticated but missing view_dashboard permission',
  content: { 'application/json': { schema: apiErrorSchema } },
} as const

export const getDashboardRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Dashboard'],
  summary: 'Get salon dashboard metrics',
  description:
    'Aggregated counts, revenue, and breakdowns for the manager dashboard.',
  security: tenantSecurity,
  responses: {
    200: {
      description: 'Dashboard metrics for the authenticated salon',
      content: {
        'application/json': { schema: dashboardDataSchema },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
})
