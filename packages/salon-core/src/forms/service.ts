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

export const catalogEntityIdSchema = z
  .string({ required_error: formMessages.required })
  .trim()
  .min(1, formMessages.required)

const legacyServiceCategoryKeys = Object.keys(SERVICE_CATEGORIES) as [
  keyof typeof SERVICE_CATEGORIES,
  ...(keyof typeof SERVICE_CATEGORIES)[],
]

export const serviceCategorySchema = z.enum(legacyServiceCategoryKeys, {
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
  familyId: catalogEntityIdSchema.optional(),
  category: serviceCategorySchema.default('hair'),
  duration: durationMinutesSchema,
  price: nonNegativeMoneySchema,
  color: calendarColorIdSchema.default(STAFF_COLORS[0]),
  active: z.boolean().default(true),
  description: z.string().trim().optional(),
  kind: z.enum(['standard', 'combo']).default('standard'),
})

export const serviceCreateSchema = serviceFormSchema.extend({
  id: z.string().optional(),
})

export const serviceUpdateSchema = z.object({
  name: requiredTextSchema.optional(),
  familyId: catalogEntityIdSchema.optional(),
  duration: durationMinutesSchema.optional(),
  price: nonNegativeMoneySchema.optional(),
  color: calendarColorIdSchema.optional(),
  active: z.boolean().optional(),
  description: z.string().trim().optional(),
  kind: z.enum(['standard', 'combo']).optional(),
})

export const serviceCategoryFormSchema = z.object({
  name: requiredTextSchema,
  active: z.boolean().default(true),
})

export const serviceCategoryCreateSchema = serviceCategoryFormSchema.extend({
  id: z.string().optional(),
})

export const serviceCategoryUpdateSchema = z.object({
  name: requiredTextSchema.optional(),
  active: z.boolean().optional(),
})

export const serviceFamilyFormSchema = z.object({
  categoryId: catalogEntityIdSchema,
  name: requiredTextSchema,
  active: z.boolean().default(true),
})

export const serviceFamilyCreateSchema = serviceFamilyFormSchema.extend({
  id: z.string().optional(),
})

export const serviceFamilyUpdateSchema = z.object({
  categoryId: catalogEntityIdSchema.optional(),
  name: requiredTextSchema.optional(),
  active: z.boolean().optional(),
})

export const comboComponentsUpdateSchema = z.object({
  componentServiceIds: z.array(catalogEntityIdSchema).default([]),
})

export type ServiceFormInput = z.input<typeof serviceFormSchema>
export type ServiceFormPayload = z.output<typeof serviceFormSchema>
export type ServiceCreateInput = z.input<typeof serviceCreateSchema>
export type ServiceCreatePayload = z.output<typeof serviceCreateSchema>
export type ServiceUpdateInput = z.input<typeof serviceUpdateSchema>
export type ServiceUpdatePayload = z.output<typeof serviceUpdateSchema>
export type ServiceCategoryCreateInput = z.input<typeof serviceCategoryCreateSchema>
export type ServiceCategoryCreatePayload = z.output<typeof serviceCategoryCreateSchema>
export type ServiceCategoryUpdateInput = z.input<typeof serviceCategoryUpdateSchema>
export type ServiceCategoryUpdatePayload = z.output<typeof serviceCategoryUpdateSchema>
export type ServiceFamilyCreateInput = z.input<typeof serviceFamilyCreateSchema>
export type ServiceFamilyCreatePayload = z.output<typeof serviceFamilyCreateSchema>
export type ServiceFamilyUpdateInput = z.input<typeof serviceFamilyUpdateSchema>
export type ServiceFamilyUpdatePayload = z.output<typeof serviceFamilyUpdateSchema>
export type ComboComponentsUpdateInput = z.input<typeof comboComponentsUpdateSchema>
export type ComboComponentsUpdatePayload = z.output<typeof comboComponentsUpdateSchema>
