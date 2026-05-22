import { toPersianDigits } from '@repo/salon-core/persian-digits'

export function formatPrice(value: number): string {
  return `${toPersianDigits(value.toLocaleString('en-US'))} تومان`
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${toPersianDigits(minutes)} دقیقه`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (m === 0) return `${toPersianDigits(h)} ساعت`
  return `${toPersianDigits(h)} ساعت و ${toPersianDigits(m)} دقیقه`
}

export function formatHm(value: string): string {
  return toPersianDigits(value)
}
