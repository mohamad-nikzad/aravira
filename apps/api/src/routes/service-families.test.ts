import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@repo/database/services', () => ({
  getAllServiceCategories: vi.fn(),
  createServiceCategory: vi.fn(),
  updateServiceCategory: vi.fn(),
  getAllServiceFamilies: vi.fn(),
  createServiceFamily: vi.fn(),
  updateServiceFamily: vi.fn(),
  getAllServiceAddons: vi.fn(),
  createServiceAddon: vi.fn(),
  updateServiceAddon: vi.fn(),
}))

vi.mock('@repo/database/clients', () => ({
  isClientProvidedEntityId: (id: string | undefined) => typeof id === 'string' && id.length > 0,
}))

vi.mock('@repo/auth/server', () => ({
  auth: { api: { getSession: vi.fn() } },
}))

vi.mock('@repo/database/members', () => ({
  getMemberForUser: vi.fn(),
}))

import * as db from '@repo/database/services'
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

describe('service-families router', () => {
  it('returns 401 without auth', async () => {
    const res = await app.request('/api/v1/service-families')
    expect(res.status).toBe(401)
  })

  it('staff sees active-only with all=1', async () => {
    vi.mocked(getMemberForUser).mockResolvedValue({ userId: 'u2', organizationId: 's1', role: 'member', name: 'Staff', username: '09120000001' } as never)
    vi.mocked(db.getAllServiceFamilies).mockResolvedValue([] as never)
    await app.request('/api/v1/service-families?all=1', { headers: authHeaders })
    expect(db.getAllServiceFamilies).toHaveBeenCalledWith('s1', false)
  })

  it('manager includes inactive with all=1', async () => {
    vi.mocked(db.getAllServiceFamilies).mockResolvedValue([{ id: 'f1' }] as never)
    const res = await app.request('/api/v1/service-families?all=1', { headers: authHeaders })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ families: [{ id: 'f1' }] })
    expect(db.getAllServiceFamilies).toHaveBeenCalledWith('s1', true)
  })

  it('staff is 403 on POST', async () => {
    vi.mocked(getMemberForUser).mockResolvedValue({ userId: 'u2', organizationId: 's1', role: 'member', name: 'Staff', username: '09120000001' } as never)
    const res = await app.request('/api/v1/service-families', {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ categoryId: 'cat1', name: 'Cut' }),
    })
    expect(res.status).toBe(403)
  })

  it('200 on create', async () => {
    vi.mocked(db.createServiceFamily).mockResolvedValue({ id: 'f1', name: 'Cut' } as never)
    const res = await app.request('/api/v1/service-families', {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ categoryId: 'cat1', name: 'Cut' }),
    })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ family: { id: 'f1', name: 'Cut' } })
  })

  it('409 on duplicate', async () => {
    vi.mocked(db.createServiceFamily).mockRejectedValue(new Error('unique violation'))
    const res = await app.request('/api/v1/service-families', {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ categoryId: 'cat1', name: 'Cut' }),
    })
    expect(res.status).toBe(409)
    expect(await res.json()).toEqual({
      error: 'این نام گروه برای این بخش قبلاً ثبت شده است',
    })
  })

  it('400 when category not found', async () => {
    vi.mocked(db.createServiceFamily).mockRejectedValue(new Error('category not found'))
    const res = await app.request('/api/v1/service-families', {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ categoryId: 'missing', name: 'Cut' }),
    })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'بخش خدمات یافت نشد' })
  })

  it('404 on PATCH of missing family', async () => {
    vi.mocked(db.updateServiceFamily).mockResolvedValue(undefined as never)
    const res = await app.request('/api/v1/service-families/missing', {
      method: 'PATCH',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'New' }),
    })
    expect(res.status).toBe(404)
  })
})
