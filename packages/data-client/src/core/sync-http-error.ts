import { DataClientHttpError } from '../ports/http-transport'

/** Non-409 responses that should enter conflict review (machine codes only). */
const SYNC_IMMEDIATE_CONFLICT_CODES = new Set(['staff-overlap', 'client-overlap', 'duplicate-phone'])

export function httpErrorCode(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null
  const c = (body as { code?: unknown }).code
  return typeof c === 'string' && c.trim() ? c.trim() : null
}

export function httpErrorCodeFromException(e: unknown): string | null {
  if (!(e instanceof DataClientHttpError)) return null
  return httpErrorCode(e.body)
}

export function isAuthHttpError(e: unknown): boolean {
  return e instanceof DataClientHttpError && (e.status === 401 || e.status === 403)
}

export function isServerConflictError(e: unknown): boolean {
  if (!(e instanceof DataClientHttpError)) return false
  if (e.status === 409) return true
  const code = httpErrorCode(e.body)
  return code !== null && SYNC_IMMEDIATE_CONFLICT_CODES.has(code)
}
