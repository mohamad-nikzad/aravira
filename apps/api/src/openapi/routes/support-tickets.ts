import { createRoute } from '@hono/zod-openapi'
import { apiErrorSchema, tenantSecurity } from '../schemas/common'
import {
  createManagerSupportMessageBodySchema,
  createSupportTicketBodySchema,
  managerSupportTicketDetailResponseSchema,
  managerSupportTicketListQuerySchema,
  managerSupportTicketListResponseSchema,
  managerSupportTicketMutationResponseSchema,
  managerSupportTicketSummaryResponseSchema,
  supportTicketParamsSchema,
  supportTicketReadResponseSchema,
} from '../schemas/support-tickets'

const errorResponse = (description: string) => ({
  description,
  content: { 'application/json': { schema: apiErrorSchema } },
})

const errors = {
  400: errorResponse('Invalid Support Ticket request'),
  401: errorResponse('Missing or invalid session'),
  403: errorResponse(
    'Authenticated user lacks the required manager permission',
  ),
  404: errorResponse('Support Ticket not found in the authenticated salon'),
} as const

export const listManagerSupportTicketsRoute = createRoute({
  method: 'get',
  path: '/',
  operationId: 'listManagerSupportTickets',
  tags: ['Support tickets'],
  summary: 'List salon Support Tickets',
  security: tenantSecurity,
  request: { query: managerSupportTicketListQuerySchema },
  responses: {
    200: {
      description: 'Salon-scoped Support Tickets ordered by newest activity',
      content: {
        'application/json': { schema: managerSupportTicketListResponseSchema },
      },
    },
    ...errors,
  },
})

export const createManagerSupportTicketRoute = createRoute({
  method: 'post',
  path: '/',
  operationId: 'createManagerSupportTicket',
  tags: ['Support tickets'],
  summary: 'Create a Support Ticket and its first manager message',
  security: tenantSecurity,
  request: {
    body: {
      required: true,
      content: {
        'application/json': { schema: createSupportTicketBodySchema },
      },
    },
  },
  responses: {
    201: {
      description: 'Support Ticket created',
      content: {
        'application/json': {
          schema: managerSupportTicketMutationResponseSchema,
        },
      },
    },
    ...errors,
  },
})

export const getManagerSupportTicketSummaryRoute = createRoute({
  method: 'get',
  path: '/summary',
  operationId: 'getManagerSupportTicketSummary',
  tags: ['Support tickets'],
  summary: 'Get the salon-shared unread Support Ticket count',
  security: tenantSecurity,
  responses: {
    200: {
      description: 'Salon-shared unread summary',
      content: {
        'application/json': {
          schema: managerSupportTicketSummaryResponseSchema,
        },
      },
    },
    ...errors,
  },
})

export const getManagerSupportTicketRoute = createRoute({
  method: 'get',
  path: '/{ticketId}',
  operationId: 'getManagerSupportTicket',
  tags: ['Support tickets'],
  summary: 'Get a salon-scoped Support Ticket conversation',
  security: tenantSecurity,
  request: { params: supportTicketParamsSchema },
  responses: {
    200: {
      description: 'Support Ticket detail with platform identity redacted',
      content: {
        'application/json': {
          schema: managerSupportTicketDetailResponseSchema,
        },
      },
    },
    ...errors,
  },
})

export const createManagerSupportMessageRoute = createRoute({
  method: 'post',
  path: '/{ticketId}/messages',
  operationId: 'createManagerSupportMessage',
  tags: ['Support tickets'],
  summary: 'Add a manager message to a Support Ticket',
  security: tenantSecurity,
  request: {
    params: supportTicketParamsSchema,
    body: {
      required: true,
      content: {
        'application/json': { schema: createManagerSupportMessageBodySchema },
      },
    },
  },
  responses: {
    201: {
      description: 'Manager message created and lifecycle transition applied',
      content: {
        'application/json': {
          schema: managerSupportTicketMutationResponseSchema,
        },
      },
    },
    ...errors,
  },
})

export const markManagerSupportTicketReadRoute = createRoute({
  method: 'post',
  path: '/{ticketId}/read',
  operationId: 'markManagerSupportTicketRead',
  tags: ['Support tickets'],
  summary: 'Advance the salon-shared manager read cursor',
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
