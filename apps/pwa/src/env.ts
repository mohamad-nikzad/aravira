const DEFAULT_API_BASE_URL = 'http://localhost:3002'

const rawApiBase = import.meta.env.VITE_API_BASE_URL as string | undefined

export const env = {
  apiBaseUrl: (rawApiBase && rawApiBase.length > 0 ? rawApiBase : DEFAULT_API_BASE_URL).replace(
    /\/+$/,
    '',
  ),
  appUrl: (import.meta.env.VITE_APP_URL as string | undefined) ?? '',
  webUrl: (import.meta.env.VITE_WEB_URL as string | undefined) ?? '',
} as const
