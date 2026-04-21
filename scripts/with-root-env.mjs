import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(scriptDir, '..')

function parseEnvFile(filePath) {
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

function loadRootEnv() {
  parseEnvFile(path.join(repoRoot, '.env'))
  parseEnvFile(path.join(repoRoot, '.env.local'))

  const extra = process.env.ROOT_ENV_FILES
    ?.split(',')
    .map((value) => value.trim())
    .filter(Boolean)

  for (const fileName of extra ?? []) {
    parseEnvFile(path.join(repoRoot, fileName))
  }
}

const [command, ...args] = process.argv.slice(2)

if (!command) {
  console.error('Usage: node scripts/with-root-env.mjs <command> [...args]')
  process.exit(1)
}

loadRootEnv()

const child = spawn(command, args, {
  cwd: process.cwd(),
  env: process.env,
  stdio: 'inherit',
})

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }
  process.exit(code ?? 1)
})
