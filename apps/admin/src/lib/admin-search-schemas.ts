import { z } from 'zod'

const positiveInt = z.coerce.number().int().min(1)

export const PAGE_SIZE_OPTIONS = [10, 20, 50] as const
export type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number]

const pageSizeSchema = z.coerce
  .number()
  .int()
  .pipe(z.union([z.literal(10), z.literal(20), z.literal(50)]))

export function normalizePageSize(
  value: number,
  fallback: PageSizeOption = DEFAULT_TABLE_SEARCH.pageSize,
): PageSizeOption {
  return PAGE_SIZE_OPTIONS.includes(value as PageSizeOption)
    ? (value as PageSizeOption)
    : fallback
}

export const tableSearchSchema = z.object({
  page: positiveInt.optional().default(1),
  pageSize: pageSizeSchema.optional().default(20),
  q: z.string().optional(),
})

export const auditLogSearchSchema = tableSearchSchema.extend({
  action: z.string().optional(),
  targetType: z.string().optional(),
  targetId: z.string().optional(),
  salonId: z.string().optional(),
})

export type TableSearch = z.infer<typeof tableSearchSchema>
export type AuditLogSearch = z.infer<typeof auditLogSearchSchema>

export type TableSearchDefaults = {
  page: number
  pageSize: PageSizeOption
}

export const DEFAULT_TABLE_SEARCH: TableSearchDefaults = {
  page: 1,
  pageSize: 20,
}

export function compactTableSearch(
  input: Partial<TableSearch>,
  defaults: TableSearchDefaults = DEFAULT_TABLE_SEARCH,
): Partial<TableSearch> {
  const out: Partial<TableSearch> = {}
  const page = input.page ?? defaults.page
  const pageSize = normalizePageSize(
    input.pageSize ?? defaults.pageSize,
    defaults.pageSize,
  )

  if (page !== defaults.page) out.page = page
  if (pageSize !== defaults.pageSize) out.pageSize = pageSize
  if (input.q) out.q = input.q

  return out
}

export function compactAuditLogSearch(
  input: Partial<AuditLogSearch>,
  defaults: TableSearchDefaults = DEFAULT_TABLE_SEARCH,
): Partial<AuditLogSearch> {
  return {
    ...compactTableSearch(input, defaults),
    ...(input.action ? { action: input.action } : {}),
    ...(input.targetType ? { targetType: input.targetType } : {}),
    ...(input.targetId ? { targetId: input.targetId } : {}),
    ...(input.salonId ? { salonId: input.salonId } : {}),
  }
}
