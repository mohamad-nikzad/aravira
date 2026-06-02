import { toPersianDigits } from '@repo/salon-core/persian-digits'

/** Convert Latin digits to Persian digits. Idempotent on already-Persian input. */
export function faDigits(v: string | number): string {
  return toPersianDigits(v)
}

/**
 * Wrap an LTR run in Unicode bidi isolates (FSI…PDI) so it renders correctly
 * inside an RTL paragraph. Use for phone numbers, times, and Latin names.
 */
export function isolate(s: string): string {
  return `⁨${s}⁩`
}

/** Prefix a line with RLM to force RTL paragraph direction. */
export function rtl(s: string): string {
  return `‏${s}`
}

/** Absolute deep link to a request in the manager PWA inbox. */
export function buildRequestDeepLink(base: string, requestId: string): string {
  return `${base.replace(/\/$/, '')}/requests?focus=${requestId}`
}

/**
 * Telegram rejects inline keyboard `url` buttons unless the target is HTTPS
 * (e.g. `http://localhost:3000` fails with "Wrong HTTP URL").
 */
export function isTelegramInlineButtonUrl(url: string): boolean {
  try {
    return new URL(url).protocol === 'https:'
  } catch {
    return false
  }
}
