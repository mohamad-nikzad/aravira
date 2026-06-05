import path from 'node:path'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { getDatabaseUrl } from '@repo/database/config'
import * as schema from '@repo/database/schema'

function defaultMigrationsDir() {
  return path.resolve(__dirname, '../../../packages/database/src/migrations')
}

async function main() {
  const migrationsFolder =
    process.env.SALUNA_MIGRATIONS_DIR?.trim() || defaultMigrationsDir()
  const client = postgres(getDatabaseUrl({ preferDirect: true }), {
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
  })
  const db = drizzle(client, { schema })

  try {
    console.log(`[api] applying migrations from ${migrationsFolder}`)
    await migrate(db, { migrationsFolder })
    console.log('[api] migrations applied')
  } finally {
    await client.end()
  }
}

main().catch((err) => {
  console.error('[api] migration failed')
  console.error(err)
  process.exit(1)
})
