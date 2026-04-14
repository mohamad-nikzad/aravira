import { defineConfig } from 'drizzle-kit'
import { getDatabaseUrl } from './db/config'

export default defineConfig({
  schema: './db/schema.ts',
  out: './db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: getDatabaseUrl({ preferDirect: true }),
  },
})
