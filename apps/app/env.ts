import { z } from 'zod'

const appEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_WEB_URL: z.string().url().optional(),
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().optional(),
})

export const appEnv = appEnvSchema.parse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_WEB_URL: process.env.NEXT_PUBLIC_WEB_URL,
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
})
