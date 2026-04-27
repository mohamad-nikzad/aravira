export class DataClientHttpError extends Error {
  readonly status: number
  readonly body: unknown

  constructor(message: string, status: number, body: unknown) {
    super(message)
    this.name = 'DataClientHttpError'
    this.status = status
    this.body = body
  }
}

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

export interface HttpTransportPort {
  json<T>(
    method: HttpMethod,
    path: string,
    options?: { query?: Record<string, string | undefined>; body?: unknown }
  ): Promise<T>
}
