export { createApiClient } from './client'
export type { ApiClient, ApiClientOptions, RequestOptions, TokenProvider } from './client'
export { createAuthApi } from './auth'
export type {
  AuthApi,
  LoginInput,
  LoginResponse,
  SignupInput,
  SignupResponse,
  MeResponse,
} from './auth'
export { createTodayApi } from './today'
export type { TodayApi } from './today'
export { createClientsApi } from './clients'
export type {
  ClientsApi,
  ClientsResponse,
  CreateClientInput,
  CreateClientResponse,
} from './clients'
export { createStaffApi } from './staff'
export type { StaffApi, StaffResponse } from './staff'
export { createServicesApi } from './services'
export type { ServicesApi, ServicesResponse } from './services'
export { createAppointmentsApi } from './appointments'
export type {
  AppointmentsApi,
  AppointmentsRangeResponse,
  CreateAppointmentInput,
  CreateAppointmentResponse,
} from './appointments'
export { endpoints } from './endpoints'
export { ApiError, NetworkError } from './errors'
