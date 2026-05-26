import {
  createApiClient,
  createAppointmentsApi,
  createAuthApi,
  createBusinessSettingsApi,
  createClientsApi,
  createDashboardApi,
  createNotificationPreferencesApi,
  createNotificationsApi,
  createRetentionApi,
  createServicesApi,
  createStaffApi,
} from '@repo/api-client'

import { env } from '#/env'

export const apiClient = createApiClient({
  baseUrl: env.apiBaseUrl,
  credentials: 'include',
})

export const api = {
  appointments: createAppointmentsApi(apiClient),
  auth: createAuthApi(apiClient),
  businessSettings: createBusinessSettingsApi(apiClient),
  clients: createClientsApi(apiClient),
  dashboard: createDashboardApi(apiClient),
  notifications: createNotificationsApi(apiClient),
  notificationPreferences: createNotificationPreferencesApi(apiClient),
  retention: createRetentionApi(apiClient),
  services: createServicesApi(apiClient),
  staff: createStaffApi(apiClient),
}

export type Api = typeof api
