import { readFile } from 'node:fs/promises'

import { describe, expect, it } from 'vitest'

import {
  injectPwaAssetVersion,
  PWA_ASSET_VERSION_PLACEHOLDER,
} from './pwa-assets.config'

const versionSuffix = `?v=${PWA_ASSET_VERSION_PLACEHOLDER}`

describe('PWA asset versioning', () => {
  it('versions every install-facing icon and precaches the same URLs', async () => {
    const [html, manifestSource, serviceWorker] = await Promise.all([
      readFile('index.html', 'utf8'),
      readFile('public/manifest.webmanifest', 'utf8'),
      readFile('public/sw.js', 'utf8'),
    ])
    const manifest = JSON.parse(manifestSource) as {
      icons: Array<{ src: string }>
      shortcuts: Array<{ icons: Array<{ src: string }> }>
    }
    const manifestIconUrls = [
      ...manifest.icons.map(({ src }) => src),
      ...manifest.shortcuts.flatMap(({ icons }) => icons.map(({ src }) => src)),
    ]
    const htmlAssetUrls = [...html.matchAll(/href="([^"]+)"/g)]
      .map((match) => match[1])
      .filter(
        (url) =>
          url.includes('favicon') ||
          url.includes('apple-touch-icon') ||
          url.includes('/icons/') ||
          url.includes('manifest.webmanifest'),
      )

    expect([...manifestIconUrls, ...htmlAssetUrls]).toEqual(
      expect.arrayContaining([
        `/manifest.webmanifest${versionSuffix}`,
        `/favicon.ico${versionSuffix}`,
        `/apple-touch-icon.png${versionSuffix}`,
        `/icons/icon-192x192.png${versionSuffix}`,
      ]),
    )
    expect(
      [...manifestIconUrls, ...htmlAssetUrls].every((url) =>
        url.endsWith(versionSuffix),
      ),
    ).toBe(true)

    const exposedPaths = new Set(
      [...manifestIconUrls, ...htmlAssetUrls].map((url) =>
        url.slice(0, -versionSuffix.length),
      ),
    )
    for (const path of exposedPaths) {
      expect(serviceWorker).toContain(`withAssetVersion('${path}')`)
    }
  })

  it('URL-encodes the build version', () => {
    expect(
      injectPwaAssetVersion(
        `/icon.png?v=${PWA_ASSET_VERSION_PLACEHOLDER}`,
        'release 1/2',
      ),
    ).toBe('/icon.png?v=release%201%2F2')
  })
})
