import { getDb } from '@repo/database/client'
import { seedCatalogPresets } from '@repo/database/seed/catalog-presets'

async function main() {
  await seedCatalogPresets(getDb())
  console.log('[api] catalog presets seeded')

  const g = globalThis as { __salon_postgres?: { end: () => Promise<void> } }
  await g.__salon_postgres?.end()
}

main().catch((err) => {
  console.error('[api] catalog preset seed failed')
  console.error(err)
  process.exit(1)
})
