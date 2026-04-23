/** Normalize phone for storage and unique lookup (digits only, Persian/Arabic → Latin). */
import { toLatinDigits, toPersianDigits } from './persian-digits'

export function normalizePhone(input: string): string {
  const s = toLatinDigits(input.trim())
  return s.replace(/\D/g, '')
}

export function displayPhone(normalized: string): string {
  return toPersianDigits(normalized)
}
