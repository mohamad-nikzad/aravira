import type { Context } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'

export function ok<T>(c: Context, data: T, status: ContentfulStatusCode = 200) {
  return c.json(data, status)
}

export function created<T>(c: Context, data: T) {
  return c.json(data, 201)
}

export function error(
  c: Context,
  message: string,
  status: ContentfulStatusCode,
  code?: string,
) {
  return c.json(code ? { error: message, code } : { error: message }, status)
}
