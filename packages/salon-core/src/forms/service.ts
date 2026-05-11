/**
 * Service form schema — shared between web (`apps/app`) and native (`apps/native`).
 * Normalizes category/color/number fields into API-ready payload values.
 */
import { z } from 'zod'

import { normalizeCalendarColorId } from '../calendar-colors'
import { SERVICE_CATEGORIES, STAFF_COLORS } from '../types'
import { formMessages } from './messages'
import {
  durationMinutesSchema,
  nonNegativeMoneySchema,
  requiredTextSchema,
} from './primitives'

const serviceCategoryKeys = Object.keys(SERVICE_CATEGORIES) as [
  keyof typeof SERVICE_CATEGORIES,
  ...(keyof typeof SERVICE_CATEGORIES)[],
]

export const serviceCategorySchema = z.enum(serviceCategoryKeys, {
  required_error: formMessages.required,
  invalid_type_error: formMessages.required,
})

export const calendarColorIdSchema = z
  .string({ required_error: formMessages.required })
  .trim()
  .min(1, formMessages.required)
  .transform((value) => normalizeCalendarColorId(value))

export const serviceFormSchema = z.object({
  name: requiredTextSchema,
  category: serviceCategorySchema.default('hair'),
  duration: durationMinutesSchema,
  price: nonNegativeMoneySchema,
  color: calendarColorIdSchema.default(STAFF_COLORS[0]),
  active: z.boolean().default(true),
})

export const serviceCreateSchema = serviceFormSchema.extend({
  id: z.string().optional(),
})

export const serviceUpdateSchema = z.object({
  name: requiredTextSchema.optional(),
  category: serviceCategorySchema.optional(),
  duration: durationMinutesSchema.optional(),
  price: nonNegativeMoneySchema.optional(),
  color: calendarColorIdSchema.optional(),
  active: z.boolean().optional(),
})

export type ServiceFormInput = z.input<typeof serviceFormSchema>
export type ServiceFormPayload = z.output<typeof serviceFormSchema>
export type ServiceCreateInput = z.input<typeof serviceCreateSchema>
export type ServiceCreatePayload = z.output<typeof serviceCreateSchema>
export type ServiceUpdateInput = z.input<typeof serviceUpdateSchema>
export type ServiceUpdatePayload = z.output<typeof serviceUpdateSchema>
