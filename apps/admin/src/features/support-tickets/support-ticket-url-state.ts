import { z } from 'zod'

export const SUPPORT_TICKET_STATUSES = [
  'open',
  'waiting_for_manager',
  'resolved',
] as const
export const SUPPORT_TICKET_CATEGORIES = [
  'problem',
  'question',
  'feature_request',
  'other',
] as const
export const SUPPORT_TICKET_SCOPES = ['unresolved', 'all'] as const

export const supportTicketSearchSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  search: z.string().trim().optional(),
  status: z.enum(SUPPORT_TICKET_STATUSES).optional(),
  category: z.enum(SUPPORT_TICKET_CATEGORIES).optional(),
  salon: z.string().trim().optional(),
  scope: z.enum(SUPPORT_TICKET_SCOPES).optional().default('unresolved'),
})

export type SupportTicketUrlState = z.infer<typeof supportTicketSearchSchema>

export function compactSupportTicketSearch(
  input: Partial<SupportTicketUrlState>,
): Partial<SupportTicketUrlState> {
  return {
    ...(input.page && input.page !== 1 ? { page: input.page } : {}),
    ...(input.search?.trim() ? { search: input.search.trim() } : {}),
    ...(input.status ? { status: input.status } : {}),
    ...(input.category ? { category: input.category } : {}),
    ...(input.salon?.trim() ? { salon: input.salon.trim() } : {}),
    ...(input.scope && input.scope !== 'unresolved'
      ? { scope: input.scope }
      : {}),
  }
}

export function supportTicketListParams(state: SupportTicketUrlState) {
  return {
    page: state.page,
    pageSize: 20,
    ...(state.search ? { search: state.search } : {}),
    ...(state.status ? { status: state.status } : {}),
    ...(state.category ? { category: state.category } : {}),
    ...(state.salon ? { salonId: state.salon } : {}),
    ...(state.scope ? { scope: state.scope } : {}),
  }
}
