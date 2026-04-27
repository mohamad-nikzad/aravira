import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const dirname = path.dirname(fileURLToPath(import.meta.url))

/** Non-Next bundle smoke test: `pnpm --filter @repo/data-client portability` */
export default defineConfig({
  root: path.resolve(dirname),
  build: {
    lib: {
      entry: path.resolve(dirname, 'main.ts'),
      name: 'DataClientPortability',
      fileName: () => 'portability-smoke.js',
      formats: ['es'],
    },
    outDir: path.resolve(dirname, 'dist-portability'),
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@repo/data-client': path.resolve(dirname, '../src/index.ts'),
    },
  },
})
