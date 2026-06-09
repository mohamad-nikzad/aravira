/**
 * Vendored mono brand SVGs (apps/pwa/src/components/clients/brand-icons/).
 * Sourced from theSVG project — vendored locally, no runtime CDN dependency.
 */

import appleSvg from './brand-icons/apple.svg?raw'
import googleSvg from './brand-icons/google.svg?raw'
import huaweiSvg from './brand-icons/huawei.svg?raw'
import samsungSvg from './brand-icons/samsung.svg?raw'
import whatsappSvg from './brand-icons/whatsapp.svg?raw'
import xiaomiSvg from './brand-icons/xiaomi.svg?raw'

export type BrandIconSlug =
  | 'apple'
  | 'google'
  | 'samsung'
  | 'xiaomi'
  | 'huawei'
  | 'whatsapp'

export const BRAND_ICON_SVGS: Record<BrandIconSlug, string> = {
  apple: appleSvg,
  google: googleSvg,
  samsung: samsungSvg,
  xiaomi: xiaomiSvg,
  huawei: huaweiSvg,
  whatsapp: whatsappSvg,
}

export function isBrandIconSlug(slug: string): slug is BrandIconSlug {
  return slug in BRAND_ICON_SVGS
}
