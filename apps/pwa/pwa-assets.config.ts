export const DEFAULT_PWA_ASSET_VERSION = '2026-06-22-saluna-v2'

export const PWA_ASSET_VERSION_PLACEHOLDER = '__PWA_ASSET_VERSION__'

export function injectPwaAssetVersion(source: string, version: string) {
  return source.replaceAll(
    PWA_ASSET_VERSION_PLACEHOLDER,
    encodeURIComponent(version),
  )
}
