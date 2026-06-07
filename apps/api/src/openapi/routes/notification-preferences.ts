import { createRoute } from '@hono/zod-openapi'
import { apiErrorSchema, tenantSecurity } from '../schemas/common'
import {
  notificationPreferencesResponseSchema,
  updateNotificationPreferencesBodySchema,
} from '../schemas/notification-preferences'

const unauthorizedResponse = {
  description: 'Missing or invalid session',
  content: { 'application/json': { schema: apiErrorSchema } },
} as const

const forbiddenResponse = {
  description: 'Authenticated but missing tenant context',
  content: { 'application/json': { schema: apiErrorSchema } },
} as const

const validationErrorResponse = {
  description: 'Invalid request body',
  content: { 'application/json': { schema: apiErrorSchema } },
} as const

export const getNotificationPreferencesRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Notification preferences'],
  summary: 'Get notification preferences',
  security: tenantSecurity,
  responses: {
    200: {
      description: 'Notification preferences for the authenticated user',
      content: {
        'application/json': { schema: notificationPreferencesResponseSchema },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
})

export const updateNotificationPreferencesRoute = createRoute({
  method: 'patch',
  path: '/',
  tags: ['Notification preferences'],
  summary: 'Update notification preferences',
  security: tenantSecurity,
  request: {
    body: {
      required: true,
      content: {
        'application/json': { schema: updateNotificationPreferencesBodySchema },
      },
    },
  },
  responses: {
    200: {
      description: 'Updated notification preferences',
      content: {
        'application/json': { schema: notificationPreferencesResponseSchema },
      },
    },
    400: validationErrorResponse,
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
})
