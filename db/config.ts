import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

type DatabaseUrlOptions = {
  preferDirect?: boolean
}

let envLoaded = false

function loadLocalEnvFile(fileName: string) {
  const filePath = path.join(/* turbopackIgnore: true */ process.cwd(), fileName)
  if (!existsSync(filePath)) return

  const contents = readFileSync(filePath, 'utf8')
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const separatorIndex = trimmed.indexOf('=')
    if (separatorIndex <= 0) continue

    const key = trimmed.slice(0, separatorIndex).trim()
    if (!key || process.env[key] !== undefined) continue

    let value = trimmed.slice(separatorIndex + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    process.env[key] = value
  }
}

function ensureEnvLoaded() {
  if (envLoaded) return
  envLoaded = true

  // Let real environment variables win, then fill from local env files for CLI usage.
  loadLocalEnvFile('.env')
  loadLocalEnvFile('.env.local')
}

function readEnv(name: 'DATABASE_URL' | 'DATABASE_URL_DIRECT') {
  ensureEnvLoaded()
  const value = process.env[name]?.trim()
  return value ? value : undefined
}

/**
 * Keep the app portable by depending on standard Postgres URLs only.
 * `DATABASE_URL` is the default runtime connection.
 * `DATABASE_URL_DIRECT` is optional and useful for migrations/seeds.
 */
export function getDatabaseUrl(options: DatabaseUrlOptions = {}): string {
  const runtimeUrl = readEnv('DATABASE_URL')
  const directUrl = readEnv('DATABASE_URL_DIRECT')

  const url = options.preferDirect
    ? directUrl ?? runtimeUrl
    : runtimeUrl ?? directUrl

  if (!url) {
    throw new Error(
      'Set DATABASE_URL (and optionally DATABASE_URL_DIRECT for migrations/seeds).'
    )
  }

  return url
}
