import { z } from 'zod'
import { getDatabaseUrl, loadDatabaseEnvFiles } from './config'

const databaseKeysSchema = z.object({
  DATABASE_URL: z.string().min(1),
  DATABASE_URL_DIRECT: z.string().min(1).optional(),
})

export function getDatabaseKeys() {
  loadDatabaseEnvFiles()

  return databaseKeysSchema.parse({
    DATABASE_URL: getDatabaseUrl(),
    DATABASE_URL_DIRECT: process.env.DATABASE_URL_DIRECT?.trim() || undefined,
  })
}
