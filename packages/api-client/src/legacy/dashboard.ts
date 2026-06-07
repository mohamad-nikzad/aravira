import type { Appointment } from '@repo/salon-core/types'
import type { ApiClient } from './client'
import { endpoints } from './endpoints'

export type DashboardData = {
  totalClients: number
  totalStaff: number
  todayAppointments: number
  weekAppointments: number
  monthAppointments: number
  todayStatusBreakdown: Array<{ status: Appointment['status']; count: number }>
  monthStatusBreakdown: Array<{ status: Appointment['status']; count: number }>
  popularServices: Array<{ name: string; count: number }>
  staffLoad: Array<{ name: string; color: string; count: number }>
  monthRevenue: number
  newClientsThisMonth: number
}

export function createDashboardApi(client: ApiClient) {
  return {
    get(opts: { signal?: AbortSignal } = {}) {
      return client.request<DashboardData>(endpoints.dashboard, { signal: opts.signal })
    },
  }
}

export type DashboardApi = ReturnType<typeof createDashboardApi>
