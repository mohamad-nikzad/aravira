#!/usr/bin/env node
/**
 * Downloads self-hosted fonts for apps/web (air-gapped / Iran VPS).
 * Run from repo root: node scripts/fetch-web-fonts.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const outDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../apps/web/src/assets/fonts',
)

/** @type {{ url: string; file: string }[]} */
const files = [
  ...([400, 500, 600, 700, 800].map((weight) => ({
    url: `https://cdn.jsdelivr.net/npm/@fontsource/vazirmatn@5.1.1/files/vazirmatn-arabic-${weight}-normal.woff2`,
    file: `vazirmatn-arabic-${weight}.woff2`,
  }))),
  {
    url: 'https://cdn.jsdelivr.net/npm/@fontsource/lalezar@5.2.5/files/lalezar-arabic-400-normal.woff2',
    file: 'lalezar-arabic-400.woff2',
  },
  {
    url: 'https://github.com/rastikerdar/vazirmatn/raw/master/fonts/ttf/Vazirmatn-Bold.ttf',
    file: 'Vazirmatn-Bold.ttf',
  },
]

await mkdir(outDir, { recursive: true })

for (const { url, file } of files) {
  const res = await fetch(url)
  if (!res.ok) {
    console.error(`Failed ${file}: ${res.status} ${url}`)
    process.exit(1)
  }
  const buf = Buffer.from(await res.arrayBuffer())
  await writeFile(path.join(outDir, file), buf)
  console.log(`wrote ${file}`)
}

console.log(`Fonts saved to ${outDir}`)
