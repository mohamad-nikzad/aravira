// Bump this when install-time branding assets change so existing PWAs fetch a new icon/splash set.
const DEFAULT_PWA_ASSET_VERSION = '2026-05-02-v1'

export const PWA_ASSET_VERSION =
  process.env.NEXT_PUBLIC_PWA_ASSET_VERSION ?? DEFAULT_PWA_ASSET_VERSION

export function withPwaAssetVersion(path: string) {
  const separator = path.includes('?') ? '&' : '?'
  return `${path}${separator}v=${encodeURIComponent(PWA_ASSET_VERSION)}`
}
