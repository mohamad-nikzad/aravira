import { zValidator as zv } from '@hono/zod-validator'
import type { ZodSchema } from 'zod'
import type { ValidationTargets } from 'hono'
import { error } from './responses'

export function zValidator<
  T extends ZodSchema,
  Target extends keyof ValidationTargets,
>(target: Target, schema: T) {
  return zv(target, schema, (result, c) => {
    if (!result.success) {
      return error(c, result.error.issues[0]?.message ?? 'داده نامعتبر', 400)
    }
  })
}
