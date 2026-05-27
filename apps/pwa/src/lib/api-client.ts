import {
  createApiClient,
  createAppointmentRequestsApi,
  createAppointmentsApi,
  createAuthApi,
  createBusinessSettingsApi,
  createClientsApi,
  createDashboardApi,
  createNotificationPreferencesApi,
  createNotificationsApi,
  createOnboardingApi,
  createRetentionApi,
  createSalonPublicSettingsApi,
  createServicesApi,
  createStaffApi,
  createTodayApi,
} from '@repo/api-client'

import { env } from '#/env'

export const apiClient = createApiClient({
  baseUrl: env.apiBaseUrl,
  credentials: 'include',
})

export const api = {
  appointmentRequests: createAppointmentRequestsApi(apiClient),
  appointments: createAppointmentsApi(apiClient),
  auth: createAuthApi(apiClient),
  businessSettings: createBusinessSettingsApi(apiClient),
  clients: createClientsApi(apiClient),
  dashboard: createDashboardApi(apiClient),
  notifications: createNotificationsApi(apiClient),
  notificationPreferences: createNotificationPreferencesApi(apiClient),
  onboarding: createOnboardingApi(apiClient),
  retention: createRetentionApi(apiClient),
  salonPublicSettings: createSalonPublicSettingsApi(apiClient),
  services: createServicesApi(apiClient),
  staff: createStaffApi(apiClient),
  today: createTodayApi(apiClient),
}

export type Api = typeof api
