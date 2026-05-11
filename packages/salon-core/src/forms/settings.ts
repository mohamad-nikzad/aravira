import { z } from 'zod'

import { formMessages } from './messages'
import { durationMinutesSchema, timeOfDaySchema, timeToMinutes } from './primitives'

export const businessSettingsSchema = z
  .object({
    workingStart: timeOfDaySchema.optional(),
    workingEnd: timeOfDaySchema.optional(),
    slotDurationMinutes: durationMinutesSchema.optional(),
  })
  .superRefine((values, ctx) => {
    if (!values.workingStart || !values.workingEnd) return
    if (timeToMinutes(values.workingEnd) <= timeToMinutes(values.workingStart)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['workingEnd'],
        message: formMessages.endBeforeStart,
      })
    }
  })

export type BusinessSettingsInput = z.input<typeof businessSettingsSchema>
export type BusinessSettingsPayload = z.output<typeof businessSettingsSchema>
