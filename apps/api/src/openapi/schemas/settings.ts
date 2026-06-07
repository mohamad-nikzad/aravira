import { z } from '@hono/zod-openapi'
import { businessSettingsSchema } from '@repo/salon-core/forms/settings'

import { businessHoursSchema } from './staff'

function bodyFromCoreSchema<T extends z.ZodType>(
  name: string,
  shape: z.ZodRawShape,
  coreSchema: T,
) {
  return z
    .object(shape)
    .openapi(name)
    .superRefine((data, ctx) => {
      const result = coreSchema.safeParse(data)
      if (!result.success) {
        for (const issue of result.error.issues) {
          ctx.addIssue({
            code: 'custom',
            message: issue.message,
            path: issue.path,
          })
        }
      }
    })
    .transform((data) => coreSchema.parse(data))
}

export const businessSettingsBodySchema = bodyFromCoreSchema(
  'BusinessSettingsUpdateRequest',
  {
    workingStart: z.string().optional().openapi({ example: '09:00' }),
    workingEnd: z.string().optional().openapi({ example: '19:00' }),
    slotDurationMinutes: z.number().int().optional().openapi({ example: 30 }),
    workingDays: z.number().int().optional().openapi({ example: 126 }),
  },
  businessSettingsSchema,
)

export const businessSettingsResponseSchema = z
  .object({
    settings: businessHoursSchema,
  })
  .openapi('BusinessSettingsResponse')
