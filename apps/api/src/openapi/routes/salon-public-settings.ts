import { createRoute } from '@hono/zod-openapi'
import { apiErrorSchema, tenantSecurity } from '../schemas/common'
import {
  managerPublicSettingsResultSchema,
  publicSettingsBodySchema,
  slugUpdateBodySchema,
} from '../schemas/salon-public-settings'

const unauthorizedResponse = {
  description: 'Missing or invalid session',
  content: { 'application/json': { schema: apiErrorSchema } },
} as const

const forbiddenResponse = {
  description: 'Authenticated but missing manage_settings permission',
  content: { 'application/json': { schema: apiErrorSchema } },
} as const

const validationErrorResponse = {
  description: 'Invalid request body or parameters',
  content: { 'application/json': { schema: apiErrorSchema } },
} as const

const slugConflictResponse = {
  description: 'Slug already taken by another salon',
  content: { 'application/json': { schema: apiErrorSchema } },
} as const

export const getSalonPublicSettingsRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Salon public settings'],
  summary: 'Get manager public page settings',
  security: tenantSecurity,
  responses: {
    200: {
      description: 'Public page settings, slug, and service visibility',
      content: {
        'application/json': { schema: managerPublicSettingsResultSchema },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
})

export const updateSalonPublicSettingsRoute = createRoute({
  method: 'put',
  path: '/',
  tags: ['Salon public settings'],
  summary: 'Update manager public page settings',
  security: tenantSecurity,
  request: {
    body: {
      required: true,
      content: {
        'application/json': { schema: publicSettingsBodySchema },
      },
    },
  },
  responses: {
    200: {
      description: 'Updated public page settings',
      content: {
        'application/json': { schema: managerPublicSettingsResultSchema },
      },
    },
    400: validationErrorResponse,
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
})

export const updateSalonSlugRoute = createRoute({
  method: 'patch',
  path: '/slug',
  tags: ['Salon public settings'],
  summary: 'Update public page slug',
  security: tenantSecurity,
  request: {
    body: {
      required: true,
      content: {
        'application/json': { schema: slugUpdateBodySchema },
      },
    },
  },
  responses: {
    200: {
      description: 'Updated slug and refreshed public page settings',
      content: {
        'application/json': { schema: managerPublicSettingsResultSchema },
      },
    },
    400: validationErrorResponse,
    401: unauthorizedResponse,
    403: forbiddenResponse,
    409: slugConflictResponse,
  },
})
