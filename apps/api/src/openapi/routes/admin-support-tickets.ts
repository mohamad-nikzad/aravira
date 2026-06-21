import { createRoute } from '@hono/zod-openapi'
import { apiErrorSchema, tenantSecurity } from '../schemas/common'
import {
  adminSupportTicketDetailResponseSchema,
  adminSupportTicketListQuerySchema,
  adminSupportTicketListResponseSchema,
  adminSupportTicketReplyResponseSchema,
  adminSupportTicketResolveResponseSchema,
  adminSupportTicketSummaryResponseSchema,
  createAdminSupportMessageBodySchema,
  supportTicketParamsSchema,
  supportTicketReadResponseSchema,
} from '../schemas/support-tickets'

const errorResponse = (description: string) => ({
  description,
  content: { 'application/json': { schema: apiErrorSchema } },
})

const errors = {
  400: errorResponse('Invalid admin Support Ticket request'),
  401: errorResponse('Missing or invalid session'),
  403: errorResponse(
    'Platform user lacks the required Support Ticket permission',
  ),
  404: errorResponse('Support Ticket not found'),
} as const

export const listAdminSupportTicketsRoute = createRoute({
  method: 'get',
  path: '/',
  operationId: 'listAdminSupportTickets',
  tags: ['Admin support tickets'],
  summary: 'List the platform Support Ticket inbox',
  security: tenantSecurity,
  request: { query: adminSupportTicketListQuerySchema },
  responses: {
    200: {
      description: 'Filtered platform Support Ticket inbox',
      content: {
        'application/json': { schema: adminSupportTicketListResponseSchema },
      },
    },
    ...errors,
  },
})

export const getAdminSupportTicketSummaryRoute = createRoute({
  method: 'get',
  path: '/summary',
  operationId: 'getAdminSupportTicketSummary',
  tags: ['Admin support tickets'],
  summary: 'Get unresolved and unread platform Support Ticket counts',
  security: tenantSecurity,
  responses: {
    200: {
      description: 'Platform Support Ticket summary',
      content: {
        'application/json': { schema: adminSupportTicketSummaryResponseSchema },
      },
    },
    ...errors,
  },
})

export const getAdminSupportTicketRoute = createRoute({
  method: 'get',
  path: '/{ticketId}',
  operationId: 'getAdminSupportTicket',
  tags: ['Admin support tickets'],
  summary: 'Get a Support Ticket conversation with internal author identities',
  security: tenantSecurity,
  request: { params: supportTicketParamsSchema },
  responses: {
    200: {
      description: 'Support Ticket detail with real stored author identities',
      content: {
        'application/json': { schema: adminSupportTicketDetailResponseSchema },
      },
    },
    ...errors,
  },
})

export const markAdminSupportTicketReadRoute = createRoute({
  method: 'post',
  path: '/{ticketId}/read',
  operationId: 'markAdminSupportTicketRead',
  tags: ['Admin support tickets'],
  summary: 'Advance the platform-shared Support Ticket read cursor',
  security: tenantSecurity,
  request: { params: supportTicketParamsSchema },
  responses: {
    200: {
      description: 'Read cursor advanced idempotently',
      content: {
        'application/json': { schema: supportTicketReadResponseSchema },
      },
    },
    ...errors,
  },
})

export const createAdminSupportMessageRoute = createRoute({
  method: 'post',
  path: '/{ticketId}/messages',
  operationId: 'createAdminSupportMessage',
  tags: ['Admin support tickets'],
  summary: 'Reply to a Support Ticket, optionally resolving it atomically',
  security: tenantSecurity,
  request: {
    params: supportTicketParamsSchema,
    body: {
      required: true,
      content: {
        'application/json': { schema: createAdminSupportMessageBodySchema },
      },
    },
  },
  responses: {
    201: {
      description: 'Platform reply created and lifecycle transition applied',
      content: {
        'application/json': { schema: adminSupportTicketReplyResponseSchema },
      },
    },
    ...errors,
  },
})

export const resolveAdminSupportTicketRoute = createRoute({
  method: 'post',
  path: '/{ticketId}/resolve',
  operationId: 'resolveAdminSupportTicket',
  tags: ['Admin support tickets'],
  summary: 'Resolve a Support Ticket without adding a message',
  security: tenantSecurity,
  request: { params: supportTicketParamsSchema },
  responses: {
    200: {
      description: 'Support Ticket resolved, or unchanged if already resolved',
      content: {
        'application/json': { schema: adminSupportTicketResolveResponseSchema },
      },
    },
    ...errors,
  },
})
