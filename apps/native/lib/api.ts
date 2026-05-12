import Constants from 'expo-constants';
import {
  createApiClient,
  createAuthApi,
  createTodayApi,
  createDashboardApi,
  createOnboardingApi,
  createRetentionApi,
  createBusinessSettingsApi,
  createClientsApi,
  createStaffApi,
  createServicesApi,
  createAppointmentsApi,
} from '@repo/api-client';
import { getStoredToken } from './secure-storage';

function resolveBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (fromEnv && fromEnv.length > 0) return fromEnv;
  const fromConfig = (Constants.expoConfig?.extra as { apiBaseUrl?: string } | undefined)
    ?.apiBaseUrl;
  if (fromConfig && fromConfig.length > 0) return fromConfig;
  return 'https://aravira-saloon.vercel.app';
}

export const apiClient = createApiClient({
  baseUrl: resolveBaseUrl(),
  getToken: () => getStoredToken(),
  credentials: 'omit',
});

export const authApi = createAuthApi(apiClient);
export const todayApi = createTodayApi(apiClient);
export const dashboardApi = createDashboardApi(apiClient);
export const onboardingApi = createOnboardingApi(apiClient);
export const retentionApi = createRetentionApi(apiClient);
export const businessSettingsApi = createBusinessSettingsApi(apiClient);
export const clientsApi = createClientsApi(apiClient);
export const staffApi = createStaffApi(apiClient);
export const servicesApi = createServicesApi(apiClient);
export const appointmentsApi = createAppointmentsApi(apiClient);
