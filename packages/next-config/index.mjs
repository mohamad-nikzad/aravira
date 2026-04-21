import path from 'node:path'
import { fileURLToPath } from 'node:url'

const packageDir = path.dirname(fileURLToPath(import.meta.url))
const workspaceRoot = path.resolve(packageDir, '../..')

export function createNextConfig(options = {}) {
  const { pwa = false, transpilePackages = [] } = options

  return {
    transpilePackages,
    typescript: {
      ignoreBuildErrors: true,
    },
    images: {
      unoptimized: true,
    },
    turbopack: {
      root: workspaceRoot,
    },
    async headers() {
      if (!pwa) return []

      return [
        {
          source: '/sw.js',
          headers: [
            {
              key: 'Cache-Control',
              value: 'public, max-age=0, must-revalidate',
            },
            {
              key: 'Service-Worker-Allowed',
              value: '/',
            },
          ],
        },
        {
          source: '/manifest.json',
          headers: [
            {
              key: 'Cache-Control',
              value: 'public, max-age=0, must-revalidate',
            },
          ],
        },
      ]
    },
  }
}
