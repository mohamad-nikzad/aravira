export class ApiError extends Error {
  status: number
  payload: unknown

  constructor(message: string, status: number, payload: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }
}

export class NetworkError extends Error {
  cause: unknown

  constructor(cause: unknown) {
    super('خطای شبکه. اتصال اینترنت را بررسی کنید.')
    this.name = 'NetworkError'
    this.cause = cause
  }
}
