#!/usr/bin/env node
// Side-by-side compare of two stacks on the same env.
//
// Usage:
//   node benchmarks/compare.mjs prod nextjs-api-routes hono-node
//   node benchmarks/compare.mjs prod nextjs-api-routes hono-bun
//
// Writes benchmarks/results/<env>/COMPARE-<stackA>-vs-<stackB>.md and prints it.
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { extract } from './summarize.mjs'

const ROOT = dirname(fileURLToPath(import.meta.url))

const SCENARIO_LABELS = {
  '01-cheap-read': 'GET /api/services',
  '02-heavy-read': 'GET /api/appointments',
  '03-dashboard': 'GET /api/dashboard',
  '04-today': 'GET /api/today',
  '05-auth-me': 'GET /api/auth/me',
  '06-mixed-load': 'Mixed (7 endpoints)',
}

function pickLatest(dir) {
  if (!existsSync(dir)) return {}
  const files = readdirSync(dir).filter((f) => f.endsWith('.json'))
  const byScenario = {}
  for (const f of files) {
    const m = f.match(/^(\d{2}-[a-z-]+)-(.+)\.json$/)
    if (!m) continue
    const [, scenario, ts] = m
    const prev = byScenario[scenario]
    if (!prev || ts > prev.ts) byScenario[scenario] = { ts, path: join(dir, f) }
  }
  return byScenario
}

function delta(a, b) {
  if (a == null || b == null) return '—'
  const diff = b - a
  const pct = a === 0 ? 0 : (diff / a) * 100
  const sign = diff > 0 ? '+' : ''
  const arrow = diff > 0 ? '🔺' : diff < 0 ? '🔻' : '➖'
  return `${arrow} ${sign}${diff.toFixed(0)}ms (${sign}${pct.toFixed(1)}%)`
}

function fmt(n) {
  if (n == null || Number.isNaN(n)) return '—'
  return n.toFixed(n < 10 ? 2 : n < 100 ? 1 : 0)
}

const [env, stackA, stackB] = process.argv.slice(2)
if (!env || !stackA || !stackB) {
  console.error('Usage: node benchmarks/compare.mjs <env> <stackA> <stackB>')
  process.exit(1)
}

const aResults = pickLatest(join(ROOT, 'results', env, stackA))
const bResults = pickLatest(join(ROOT, 'results', env, stackB))

const header = `# Compare — \`${stackA}\` → \`${stackB}\` on ${env}

_Lower is better. Delta = ${stackB} − ${stackA}._

| Scenario | ${stackA} p50 | ${stackB} p50 | Δ p50 | ${stackA} p95 | ${stackB} p95 | Δ p95 | ${stackA} RPS | ${stackB} RPS |
|---|---:|---:|---|---:|---:|---|---:|---:|`

const rows = Object.entries(SCENARIO_LABELS).map(([key, label]) => {
  const a = aResults[key] ? extract(aResults[key].path) : null
  const b = bResults[key] ? extract(bResults[key].path) : null
  return `| ${label} | ${fmt(a?.p50)} | ${fmt(b?.p50)} | ${delta(a?.p50, b?.p50)} | ${fmt(a?.p95)} | ${fmt(b?.p95)} | ${delta(a?.p95, b?.p95)} | ${fmt(a?.rps)} | ${fmt(b?.rps)} |`
})

const md = `${header}\n${rows.join('\n')}\n`
const out = join(ROOT, 'results', env, `COMPARE-${stackA}-vs-${stackB}.md`)
writeFileSync(out, md)
console.log(md)
console.log(`\nWrote ${out.replace(ROOT + '/', '')}`)
