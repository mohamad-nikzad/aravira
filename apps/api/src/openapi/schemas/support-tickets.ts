import { z } from '@hono/zod-openapi'

const isoDateTimeSchema = z.string().datetime()
const uuidSchema = z.string().uuid()
const nullableSupportTicketStatusSchema = z
  .enum(['open', 'waiting_for_manager', 'resolved'])
  .nullable()

export const supportTicketCategorySchema = z
  .enum(['problem', 'question', 'feature_request', 'other'])
  .openapi('SupportTicketCategory')

export const supportTicketStatusSchema = z
  .enum(['open', 'waiting_for_manager', 'resolved'])
  .openapi('SupportTicketStatus')

const supportMessageBodySchema = z.string().trim().min(1).max(4_000)

export const supportTicketParamsSchema = z
  .object({
    ticketId: uuidSchema.openapi({
      param: { name: 'ticketId', in: 'path' },
    }),
  })
  .openapi('SupportTicketParams')

export const managerSupportTicketListQuerySchema = z
  .object({
    page: z.coerce
      .number()
      .int()
      .min(1)
      .optional()
      .openapi({
        param: { name: 'page', in: 'query' },
        description: 'One-based page number. Defaults to 1.',
      }),
    pageSize: z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .openapi({
        param: { name: 'pageSize', in: 'query' },
        description: 'Items per page. Defaults to 25 and is capped at 100.',
      }),
  })
  .openapi('ManagerSupportTicketListQuery')

export const adminSupportTicketListQuerySchema = z
  .object({
    page: z.coerce
      .number()
      .int()
      .min(1)
      .optional()
      .openapi({
        param: { name: 'page', in: 'query' },
      }),
    pageSize: z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .openapi({
        param: { name: 'pageSize', in: 'query' },
      }),
    status: supportTicketStatusSchema.optional().openapi({
      param: { name: 'status', in: 'query' },
    }),
    category: supportTicketCategorySchema.optional().openapi({
      param: { name: 'category', in: 'query' },
    }),
    salonId: uuidSchema.optional().openapi({
      param: { name: 'salonId', in: 'query' },
    }),
    search: z
      .string()
      .trim()
      .optional()
      .openapi({
        param: { name: 'search', in: 'query' },
        description: 'Case-insensitive subject or salon-name search.',
      }),
    scope: z
      .enum(['unresolved', 'all'])
      .optional()
      .openapi({
        param: { name: 'scope', in: 'query' },
        description: 'Defaults to unresolved; ignored when status is supplied.',
      }),
  })
  .openapi('AdminSupportTicketListQuery')

export const createSupportTicketBodySchema = z
  .object({
    category: supportTicketCategorySchema,
    subject: z.string().trim().min(1).max(120),
    body: supportMessageBodySchema,
  })
  .openapi('CreateManagerSupportTicketRequest')

export const createManagerSupportMessageBodySchema = z
  .object({ body: supportMessageBodySchema })
  .openapi('CreateManagerSupportMessageRequest')

export const createAdminSupportMessageBodySchema = z
  .object({
    body: supportMessageBodySchema,
    resolveAfter: z.boolean().optional(),
  })
  .openapi('CreateAdminSupportMessageRequest')

const supportTicketPaginationSchema = z
  .object({
    page: z.number().int(),
    pageSize: z.number().int(),
    total: z.number().int(),
  })
  .openapi('SupportTicketPagination')

const supportMessagePreviewSchema = z
  .object({
    body: z.string(),
    authorKind: z.enum(['manager', 'platform']),
    authorDisplayName: z.string(),
  })
  .openapi('SupportMessagePreview')

const managerSupportMessageSchema = z
  .discriminatedUnion('authorKind', [
    z.object({
      id: uuidSchema,
      authorKind: z.literal('manager'),
      authorUserId: uuidSchema,
      authorDisplayName: z.string(),
      body: z.string(),
      createdAt: isoDateTimeSchema,
    }),
    z.object({
      id: uuidSchema,
      authorKind: z.literal('platform'),
      authorDisplayName: z.literal('پشتیبانی سالونا'),
      body: z.string(),
      createdAt: isoDateTimeSchema,
    }),
  ])
  .openapi('ManagerSupportMessage')

const managerSupportTicketSchema = z
  .object({
    id: uuidSchema,
    salonId: uuidSchema,
    submittedByUserId: uuidSchema,
    category: supportTicketCategorySchema,
    subject: z.string(),
    status: supportTicketStatusSchema,
    lastActivityAt: isoDateTimeSchema,
    resolvedAt: isoDateTimeSchema.nullable(),
    createdAt: isoDateTimeSchema,
  })
  .openapi('ManagerSupportTicket')

const managerSupportTicketListItemSchema = z
  .object({
    id: uuidSchema,
    category: supportTicketCategorySchema,
    subject: z.string(),
    status: supportTicketStatusSchema,
    lastActivityAt: isoDateTimeSchema,
    createdAt: isoDateTimeSchema,
    managerHasUnread: z.boolean(),
    lastMessage: supportMessagePreviewSchema.nullable(),
  })
  .openapi('ManagerSupportTicketListItem')

export const managerSupportTicketListResponseSchema = z
  .object({
    items: z.array(managerSupportTicketListItemSchema),
    pagination: supportTicketPaginationSchema,
  })
  .openapi('ManagerSupportTicketListResponse')

export const managerSupportTicketDetailResponseSchema = z
  .object({
    ticket: managerSupportTicketSchema,
    managerHasUnread: z.boolean(),
    messages: z.array(managerSupportMessageSchema),
    truncated: z.boolean(),
  })
  .openapi('ManagerSupportTicketDetailResponse')

const managerMutationMessageSchema = z
  .object({
    id: uuidSchema,
    ticketId: uuidSchema,
    authorUserId: uuidSchema,
    authorKind: z.literal('manager'),
    authorDisplayNameSnapshot: z.string(),
    body: z.string(),
    createdAt: isoDateTimeSchema,
  })
  .openapi('ManagerSupportTicketMutationMessage')

export const managerSupportTicketMutationResponseSchema = z
  .object({
    previousStatus: nullableSupportTicketStatusSchema,
    resultingStatus: supportTicketStatusSchema,
    ticket: managerSupportTicketSchema,
    message: managerMutationMessageSchema,
  })
  .openapi('ManagerSupportTicketMutationResponse')

export const managerSupportTicketSummaryResponseSchema = z
  .object({ unreadCount: z.number().int() })
  .openapi('ManagerSupportTicketSummaryResponse')

export const supportTicketReadResponseSchema = z
  .object({ ticketId: uuidSchema, readAt: isoDateTimeSchema })
  .openapi('SupportTicketReadResponse')

const adminSupportMessageSchema = z
  .object({
    id: uuidSchema,
    authorKind: z.enum(['manager', 'platform']),
    authorUserId: uuidSchema,
    authorDisplayName: z.string(),
    body: z.string(),
    createdAt: isoDateTimeSchema,
  })
  .openapi('AdminSupportMessage')

const adminSupportTicketSchema = managerSupportTicketSchema
  .extend({
    resolvedByUserId: uuidSchema.nullable(),
    salonName: z.string(),
    submittedByDisplayName: z.string(),
  })
  .openapi('AdminSupportTicket')

const adminSupportTicketListItemSchema = z
  .object({
    id: uuidSchema,
    salonId: uuidSchema,
    salonName: z.string(),
    submittedByUserId: uuidSchema,
    submittedByDisplayName: z.string(),
    category: supportTicketCategorySchema,
    subject: z.string(),
    status: supportTicketStatusSchema,
    lastActivityAt: isoDateTimeSchema,
    createdAt: isoDateTimeSchema,
    platformHasUnread: z.boolean(),
    lastMessage: supportMessagePreviewSchema.nullable(),
  })
  .openapi('AdminSupportTicketListItem')

export const adminSupportTicketListResponseSchema = z
  .object({
    items: z.array(adminSupportTicketListItemSchema),
    pagination: supportTicketPaginationSchema,
  })
  .openapi('AdminSupportTicketListResponse')

export const adminSupportTicketDetailResponseSchema = z
  .object({
    ticket: adminSupportTicketSchema,
    platformHasUnread: z.boolean(),
    messages: z.array(adminSupportMessageSchema),
    truncated: z.boolean(),
  })
  .openapi('AdminSupportTicketDetailResponse')

export const adminSupportTicketSummaryResponseSchema = z
  .object({
    unresolvedCount: z.number().int(),
    unreadCount: z.number().int(),
  })
  .openapi('AdminSupportTicketSummaryResponse')

const adminMutationTicketSchema = z
  .object({
    id: uuidSchema,
    salonId: uuidSchema,
    submittedByUserId: uuidSchema,
    category: supportTicketCategorySchema,
    subject: z.string(),
    status: supportTicketStatusSchema,
    lastActivityAt: isoDateTimeSchema,
    lastManagerMessageAt: isoDateTimeSchema.nullable(),
    lastPlatformMessageAt: isoDateTimeSchema.nullable(),
    managerLastReadAt: isoDateTimeSchema.nullable(),
    platformLastReadAt: isoDateTimeSchema.nullable(),
    resolvedAt: isoDateTimeSchema.nullable(),
    resolvedByUserId: uuidSchema.nullable(),
    createdAt: isoDateTimeSchema,
  })
  .openapi('AdminSupportTicketMutationTicket')

const adminMutationMessageSchema = z
  .object({
    id: uuidSchema,
    ticketId: uuidSchema,
    authorUserId: uuidSchema,
    authorKind: z.enum(['manager', 'platform']),
    authorDisplayNameSnapshot: z.string(),
    body: z.string(),
    createdAt: isoDateTimeSchema,
  })
  .openapi('AdminSupportTicketMutationMessage')

export const adminSupportTicketReplyResponseSchema = z
  .object({
    previousStatus: nullableSupportTicketStatusSchema,
    resultingStatus: supportTicketStatusSchema,
    ticket: adminMutationTicketSchema,
    message: adminMutationMessageSchema,
  })
  .openapi('AdminSupportTicketReplyResponse')

export const adminSupportTicketResolveResponseSchema = z
  .object({
    changed: z.boolean(),
    previousStatus: nullableSupportTicketStatusSchema,
    resultingStatus: supportTicketStatusSchema,
    ticket: adminMutationTicketSchema,
  })
  .openapi('AdminSupportTicketResolveResponse')
