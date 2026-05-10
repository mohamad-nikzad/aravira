import { createNextConfig } from '@repo/next-config'

const config = createNextConfig({
  pwa: true,
  transpilePackages: ['@repo/ui', '@repo/salon-core', '@repo/database', '@repo/auth'],
})

export default {
  ...config,
  async headers() {
    const headers = config.headers ? await config.headers() : []

    return [
      ...headers,
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, Accept',
          },
          {
            key: 'Access-Control-Max-Age',
            value: '86400',
          },
        ],
      },
    ]
  },
}
