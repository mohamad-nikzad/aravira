import { createNextConfig } from '@repo/next-config'

export default createNextConfig({
  pwa: true,
  transpilePackages: ['@repo/ui', '@repo/salon-core', '@repo/database', '@repo/auth'],
})
