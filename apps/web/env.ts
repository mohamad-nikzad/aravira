import { z } from 'zod'

const webEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
})

export const webEnv = webEnvSchema.parse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
})
