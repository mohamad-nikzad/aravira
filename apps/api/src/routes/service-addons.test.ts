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

vi.mock('@repo/auth/auth', () => ({
  verifySession: vi.fn(),
}))

vi.mock('@repo/database/auth-users', () => ({
  getUserById: vi.fn(),
}))

import * as db from '@repo/database/services'
import { verifySession } from '@repo/auth/auth'
import { getUserById } from '@repo/database/auth-users'

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

const validCreate = {
  name: 'Wash',
  priceDelta: 1000,
  durationDelta: 5,
  scopes: [],
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(verifySession).mockResolvedValue('u1')
  vi.mocked(getUserById).mockResolvedValue(managerUser as never)
})

describe('service-addons router', () => {
  it('returns 401 without auth', async () => {
    const res = await app.request('/api/v1/service-addons')
    expect(res.status).toBe(401)
  })

  it('staff sees active-only with all=1', async () => {
    vi.mocked(getUserById).mockResolvedValue(staffUser as never)
    vi.mocked(db.getAllServiceAddons).mockResolvedValue([] as never)
    await app.request('/api/v1/service-addons?all=1', { headers: authHeaders })
    expect(db.getAllServiceAddons).toHaveBeenCalledWith('s1', false)
  })

  it('manager includes inactive with all=1', async () => {
    vi.mocked(db.getAllServiceAddons).mockResolvedValue([{ id: 'a1' }] as never)
    const res = await app.request('/api/v1/service-addons?all=1', { headers: authHeaders })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ addons: [{ id: 'a1' }] })
    expect(db.getAllServiceAddons).toHaveBeenCalledWith('s1', true)
  })

  it('staff is 403 on POST', async () => {
    vi.mocked(getUserById).mockResolvedValue(staffUser as never)
    const res = await app.request('/api/v1/service-addons', {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify(validCreate),
    })
    expect(res.status).toBe(403)
  })

  it('400 when both deltas zero (refine)', async () => {
    const res = await app.request('/api/v1/service-addons', {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Zero', priceDelta: 0, durationDelta: 0, scopes: [] }),
    })
    expect(res.status).toBe(400)
  })

  it('200 on create', async () => {
    vi.mocked(db.createServiceAddon).mockResolvedValue({ id: 'a1' } as never)
    const res = await app.request('/api/v1/service-addons', {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify(validCreate),
    })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ addon: { id: 'a1' } })
  })

  it('maps unique-per-salon error to 409', async () => {
    vi.mocked(db.createServiceAddon).mockRejectedValue(
      new Error('active service add-on name must be unique per salon'),
    )
    const res = await app.request('/api/v1/service-addons', {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify(validCreate),
    })
    expect(res.status).toBe(409)
    expect(await res.json()).toEqual({
      error: 'این نام افزودنی برای این سالن قبلاً ثبت شده است',
    })
  })

  it('maps scope not found to 400', async () => {
    vi.mocked(db.createServiceAddon).mockRejectedValue(new Error('scope not found'))
    const res = await app.request('/api/v1/service-addons', {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify(validCreate),
    })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'یکی از محدوده‌های انتخاب‌شده پیدا نشد' })
  })

  it('404 on PATCH of missing addon', async () => {
    vi.mocked(db.updateServiceAddon).mockResolvedValue(undefined as never)
    const res = await app.request('/api/v1/service-addons/missing', {
      method: 'PATCH',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'New' }),
    })
    expect(res.status).toBe(404)
  })
})
