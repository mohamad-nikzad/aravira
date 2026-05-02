import { describe, expect, it } from 'vitest'
import { PWA_ASSET_VERSION, withPwaAssetVersion } from '@/lib/pwa-assets'

describe('withPwaAssetVersion', () => {
  it('appends the current asset version to a plain path', () => {
    expect(withPwaAssetVersion('/icons/icon-192x192.png')).toBe(
      `/icons/icon-192x192.png?v=${encodeURIComponent(PWA_ASSET_VERSION)}`
    )
  })

  it('preserves existing query parameters', () => {
    expect(withPwaAssetVersion('/sw.js?scope=/')).toBe(
      `/sw.js?scope=/&v=${encodeURIComponent(PWA_ASSET_VERSION)}`
    )
  })
})
