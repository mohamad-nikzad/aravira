/** Normalize phone for storage and unique lookup (digits only, Persian/Arabic → Latin). */
export function normalizePhone(input: string): string {
  let s = input.trim()
  s = s.replace(/[\u06F0-\u06F9]/g, (ch) => String(ch.charCodeAt(0) - 0x06f0))
  s = s.replace(/[\u0660-\u0669]/g, (ch) => String(ch.charCodeAt(0) - 0x0660))
  return s.replace(/\D/g, '')
}

export function displayPhone(normalized: string): string {
  return normalized
}
