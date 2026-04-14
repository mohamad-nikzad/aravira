import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const g = globalThis as unknown as {
  __salon_postgres?: ReturnType<typeof postgres>
  __salon_drizzle?: ReturnType<typeof drizzle<typeof schema>>
}

function connectionString(): string {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error(
      'DATABASE_URL is not set. Add it to .env.local (e.g. postgresql://user:pass@localhost:5432/salon)'
    )
  }
  return url
}

/** Lazy DB client so Next build does not require DATABASE_URL at compile time. */
export function getDb() {
  if (g.__salon_drizzle) return g.__salon_drizzle
  if (!g.__salon_postgres) {
    g.__salon_postgres = postgres(connectionString(), {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
    })
  }
  g.__salon_drizzle = drizzle(g.__salon_postgres, { schema })
  return g.__salon_drizzle
}
