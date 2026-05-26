import {
  createApiClient,
  createAuthApi,
  createDashboardApi,
} from '@repo/api-client'

import { env } from '#/env'

export const apiClient = createApiClient({
  baseUrl: env.apiBaseUrl,
  credentials: 'include',
})

export const api = {
  auth: createAuthApi(apiClient),
  dashboard: createDashboardApi(apiClient),
}

export type Api = typeof api
