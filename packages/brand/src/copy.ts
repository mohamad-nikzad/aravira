import { brand } from './config'

const { fa, en } = brand.name

/** User-facing copy derived from `brand.name` — edit `config.ts` to rebrand */
export const brandCopy = {
  pwaShortName: fa,
  pwaFullName: `${fa} - سامانه مدیریت هوشمند سالن`,
  pwaDescription: `سامانه مدیریت هوشمند نوبت‌دهی ${fa}`,
  landingTitle: `${fa} | مدیریت هوشمند سالن زیبایی`,
  landingDescription: `${fa} نرم‌افزار مدیریت نوبت‌ها، مشتریان، خدمات و پرسنل برای سالن‌های زیبایی است.`,
  signupSubtitle: `سالن خود را در ${fa} بسازید`,
  installPromptTitle: `نصب ${fa} روی موبایل`,
  nativeDisplayName: en,
} as const

/** Page / document titles derived from brand config */
export function pageTitle(suffix: string): string {
  return `${fa} | ${suffix}`
}

export function titleWithBrand(name: string): string {
  return `${name} | ${fa}`
}
