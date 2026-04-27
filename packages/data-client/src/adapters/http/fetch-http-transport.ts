import {
  DataClientHttpError,
  type HttpMethod,
  type HttpTransportPort,
} from '../../ports/http-transport'

export interface CreateFetchHttpTransportOptions {
  /** e.g. `''` for same-origin `/api/...` */
  basePath?: string
  fetchImpl?: typeof fetch
  credentials?: RequestCredentials
}

function buildUrl(basePath: string, path: string, query?: Record<string, string | undefined>) {
  const base = basePath.replace(/\/$/, '')
  const p = path.startsWith('/') ? path : `/${path}`
  const url = `${base}${p}`
  const q = new URLSearchParams()
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== '') q.set(k, v)
    }
  }
  const qs = q.toString()
  return qs ? `${url}?${qs}` : url
}

function errorMessageFromPayload(payload: unknown, status: number): string {
  if (payload && typeof payload === 'object' && 'error' in payload) {
    const err = (payload as { error?: unknown }).error
    if (typeof err === 'string' && err.trim()) return err
  }
  return `Request failed with status ${status}`
}

export function createFetchHttpTransport(
  options: CreateFetchHttpTransportOptions = {}
): HttpTransportPort {
  const basePath = options.basePath ?? ''
  const fetchFn = options.fetchImpl ?? fetch
  const credentials = options.credentials ?? 'include'

  return {
    async json<T>(
      method: HttpMethod,
      path: string,
      opts?: { query?: Record<string, string | undefined>; body?: unknown }
    ): Promise<T> {
      const url = buildUrl(basePath, path, opts?.query)
      const headers: Record<string, string> = {}
      let body: string | undefined
      if (opts?.body !== undefined) {
        headers['Content-Type'] = 'application/json'
        body = JSON.stringify(opts.body)
      }

      const response = await fetchFn(url, {
        method,
        credentials,
        headers: Object.keys(headers).length ? headers : undefined,
        body: method === 'GET' || method === 'DELETE' ? undefined : body,
      })

      const contentType = response.headers.get('content-type') ?? ''
      const isJson = contentType.includes('application/json')
      const payload = isJson
        ? await response.json().catch(() => null)
        : await response.text().catch(() => null)

      if (!response.ok) {
        throw new DataClientHttpError(
          errorMessageFromPayload(payload, response.status),
          response.status,
          payload
        )
      }

      return payload as T
    },
  }
}
