import { z } from 'zod'

const authKeysSchema = z.object({
  JWT_SECRET: z.string().optional(),
  NODE_ENV: z.string().optional(),
})

export function getAuthKeys() {
  return authKeysSchema.parse({
    JWT_SECRET: process.env.JWT_SECRET?.trim() || undefined,
    NODE_ENV: process.env.NODE_ENV,
  })
}
