import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@repo/database/dashboard', () => ({
  getDashboardData: vi.fn(),
  getTodayData: vi.fn(),
}))

vi.mock('@repo/auth/server', () => ({
  auth: { api: { getSession: vi.fn() } },
}))

vi.mock('@repo/database/members', () => ({
  getMemberForUser: vi.fn(),
}))

import * as dashboardDb from '@repo/database/dashboard'
import { auth as authServer } from '@repo/auth/server'
import { getMemberForUser } from '@repo/database/members'

process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = 'postgres://stub'
process.env.JWT_SECRET = 'test-secret'

const { app } = await import('../app')

const managerUser = {
  id: 'u1',
  salonId: 's1',
  role: 'manager' as const,
  name: 'Manager',
  phone: '09120000000',
  createdAt: new Date(),
}
const staffUser = { ...managerUser, id: 'u2', role: 'staff' as const }

const authHeaders = { Authorization: 'Bearer testtoken' }

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(authServer.api.getSession).mockImplementation(async (args: any) => (args?.headers?.get?.('Authorization') ? { user: { id: 'u1' } } : null) as never)
  vi.mocked(getMemberForUser).mockResolvedValue({ userId: 'u1', organizationId: 's1', role: 'owner', name: 'Manager', username: '09120000000' } as never)
})

describe('dashboard router', () => {
  it('401 without auth', async () => {
    const res = await app.request('/api/v1/dashboard')
    expect(res.status).toBe(401)
  })

  it('403 for staff', async () => {
    vi.mocked(getMemberForUser).mockResolvedValue({ userId: 'u2', organizationId: 's1', role: 'member', name: 'Staff', username: '09120000001' } as never)
    const res = await app.request('/api/v1/dashboard', { headers: authHeaders })
    expect(res.status).toBe(403)
  })

  it('GET returns dashboard data', async () => {
    const payload = { kpis: { revenue: 100 }, charts: [] }
    vi.mocked(dashboardDb.getDashboardData).mockResolvedValue(payload as never)
    const res = await app.request('/api/v1/dashboard', { headers: authHeaders })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(payload)
    expect(dashboardDb.getDashboardData).toHaveBeenCalledWith('s1')
  })
})
