import { z } from 'zod'

export const supportTicketCategories = [
  'problem',
  'question',
  'feature_request',
  'other',
] as const
export type SupportTicketCategory = (typeof supportTicketCategories)[number]

export const supportTicketStatuses = [
  'open',
  'waiting_for_manager',
  'resolved',
] as const
export type SupportTicketStatus = (typeof supportTicketStatuses)[number]

export type SupportMessageAuthorKind = 'manager' | 'platform'

export function statusAfterMessage(
  current: SupportTicketStatus,
  author: SupportMessageAuthorKind,
): SupportTicketStatus {
  if (current === 'resolved' || author === 'manager') {
    return 'open'
  }

  return 'waiting_for_manager'
}

export const supportTicketCategorySchema = z.enum(supportTicketCategories)
export const supportTicketStatusSchema = z.enum(supportTicketStatuses)

function trimmedUnicodeString(maxCharacters: number) {
  return z
    .string()
    .trim()
    .refine((value) => Array.from(value).length >= 1, {
      message: 'Required',
    })
    .refine((value) => Array.from(value).length <= maxCharacters, {
      message: `Must contain at most ${maxCharacters} characters`,
    })
}

export const supportTicketSubjectSchema = trimmedUnicodeString(120)
export const supportMessageBodySchema = trimmedUnicodeString(4_000)

export const createSupportTicketSchema = z
  .object({
    category: supportTicketCategorySchema,
    subject: supportTicketSubjectSchema,
    body: supportMessageBodySchema,
  })
  .strict()

export const createSupportMessageSchema = z
  .object({
    body: supportMessageBodySchema,
  })
  .strict()

export const platformSupportReplySchema = z
  .object({
    body: supportMessageBodySchema,
    resolveAfter: z.boolean().optional(),
  })
  .strict()

export const resolveSupportTicketParamsSchema = z
  .object({
    ticketId: z.uuid(),
  })
  .strict()

const supportTicketPaginationShape = {
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(25),
}

export const supportTicketListQuerySchema = z
  .object(supportTicketPaginationShape)
  .strict()

export const adminSupportTicketListQuerySchema = z
  .object({
    ...supportTicketPaginationShape,
    status: supportTicketStatusSchema.optional(),
    category: supportTicketCategorySchema.optional(),
    salonId: z.uuid().optional(),
    search: z.string().trim().optional(),
    scope: z.enum(['unresolved', 'all']).optional(),
  })
  .strict()

export type CreateSupportTicketInput = z.input<typeof createSupportTicketSchema>
export type CreateSupportTicketPayload = z.output<
  typeof createSupportTicketSchema
>
export type CreateSupportMessageInput = z.input<
  typeof createSupportMessageSchema
>
export type CreateSupportMessagePayload = z.output<
  typeof createSupportMessageSchema
>
export type PlatformSupportReplyInput = z.input<
  typeof platformSupportReplySchema
>
export type PlatformSupportReplyPayload = z.output<
  typeof platformSupportReplySchema
>
export type SupportTicketListQuery = z.output<
  typeof supportTicketListQuerySchema
>
export type AdminSupportTicketListQuery = z.output<
  typeof adminSupportTicketListQuerySchema
>
