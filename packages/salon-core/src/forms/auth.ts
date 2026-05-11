/**
 * Authentication form schemas — shared between web (`apps/app`) and native (`apps/native`).
 * Both validates and normalizes (phone is canonical in the output payload).
 */
import { z } from 'zod'

import { formMessages } from './messages'
import { phoneSchema, requiredTextSchema } from './primitives'

const MIN_PASSWORD_LENGTH = 6

export const loginSchema = z.object({
  phone: phoneSchema,
  password: z
    .string({ required_error: formMessages.required })
    .min(1, formMessages.required),
})

export type LoginFormInput = z.input<typeof loginSchema>
export type LoginFormPayload = z.output<typeof loginSchema>

const slugRegex = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/

export const signupSchema = z.object({
  salonName: requiredTextSchema,
  slug: z
    .string({ required_error: formMessages.required })
    .trim()
    .min(1, formMessages.required)
    .regex(slugRegex, formMessages.required),
  managerName: requiredTextSchema,
  managerPhone: phoneSchema,
  password: z
    .string({ required_error: formMessages.required })
    .min(MIN_PASSWORD_LENGTH, formMessages.passwordTooShort),
})

export type SignupFormInput = z.input<typeof signupSchema>
export type SignupFormPayload = z.output<typeof signupSchema>
