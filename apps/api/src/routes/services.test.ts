import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@repo/database/services', () => ({
  getAllServices: vi.fn(),
  createService: vi.fn(),
  getServiceById: vi.fn(),
  updateService: vi.fn(),
  getActiveServiceAddonsForService: vi.fn(),
  getComboComponents: vi.fn(),
  replaceComboComponents: vi.fn(),
  importStarterServiceTemplates: vi.fn(),
}))

vi.mock('@repo/database/clients', () => ({
  isClientProvidedEntityId: (id: string | undefined) =>
    typeof id === 'string' && id.length > 0,
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

const validCreate = {
  name: 'Haircut',
  categoryId: 'cat1',
  familyId: 'fam1',
  duration: 30,
  price: 100000,
  color: 'staff-1',
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(authServer.api.getSession).mockImplementation(async (args: any) => (args?.headers?.get?.('Authorization') ? { user: { id: 'u1' } } : null) as never)
  vi.mocked(getMemberForUser).mockResolvedValue({ userId: 'u1', organizationId: 's1', role: 'owner', name: 'Manager', username: '09120000000' } as never)
})

describe('services router', () => {
  it('returns 401 without auth', async () => {
    const res = await app.request('/api/v1/services')
    expect(res.status).toBe(401)
  })

  it('staff sees active-only with all=1', async () => {
    vi.mocked(getMemberForUser).mockResolvedValue({ userId: 'u2', organizationId: 's1', role: 'member', name: 'Staff', username: '09120000001' } as never)
    vi.mocked(db.getAllServices).mockResolvedValue([] as never)
    await app.request('/api/v1/services?all=1', { headers: authHeaders })
    expect(db.getAllServices).toHaveBeenCalledWith('s1', false)
  })

  it('manager includes inactive with all=1', async () => {
    vi.mocked(db.getAllServices).mockResolvedValue([{ id: 's1' }] as never)
    const res = await app.request('/api/v1/services?all=1', { headers: authHeaders })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ services: [{ id: 's1' }] })
    expect(db.getAllServices).toHaveBeenCalledWith('s1', true)
  })

  it('staff is 403 on POST', async () => {
    vi.mocked(getMemberForUser).mockResolvedValue({ userId: 'u2', organizationId: 's1', role: 'member', name: 'Staff', username: '09120000001' } as never)
    const res = await app.request('/api/v1/services', {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify(validCreate),
    })
    expect(res.status).toBe(403)
  })

  it('400 when categoryId missing on create', async () => {
    const res = await app.request('/api/v1/services', {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validCreate, categoryId: undefined }),
    })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'بخش خدمات را انتخاب کنید' })
  })

  it('200 on create without a family', async () => {
    vi.mocked(db.createService).mockResolvedValue({ id: 'svc2', name: 'Haircut' } as never)
    const res = await app.request('/api/v1/services', {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validCreate, familyId: undefined }),
    })
    expect(res.status).toBe(200)
  })

  it('200 on create', async () => {
    vi.mocked(db.createService).mockResolvedValue({ id: 'svc1', name: 'Haircut' } as never)
    const res = await app.request('/api/v1/services', {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify(validCreate),
    })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ service: { id: 'svc1', name: 'Haircut' } })
  })

  it('409 on duplicate name', async () => {
    vi.mocked(db.createService).mockRejectedValue(new Error('unique violation'))
    const res = await app.request('/api/v1/services', {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify(validCreate),
    })
    expect(res.status).toBe(409)
    expect(await res.json()).toEqual({
      error: 'این نام خدمت برای این سالن قبلاً ثبت شده است',
    })
  })

  it('400 when active combo missing components on create', async () => {
    vi.mocked(db.createService).mockRejectedValue(
      new Error('active combo service must have at least one component'),
    )
    const res = await app.request('/api/v1/services', {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validCreate, kind: 'combo' }),
    })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({
      error: 'پکیج فعال باید حداقل یک خدمت در ترکیب خود داشته باشد',
    })
  })

  it('200 on GET /:id', async () => {
    vi.mocked(db.getServiceById).mockResolvedValue({ id: 'svc1' } as never)
    const res = await app.request('/api/v1/services/svc1', { headers: authHeaders })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ service: { id: 'svc1' } })
  })

  it('404 on GET /:id missing', async () => {
    vi.mocked(db.getServiceById).mockResolvedValue(undefined as never)
    const res = await app.request('/api/v1/services/missing', { headers: authHeaders })
    expect(res.status).toBe(404)
  })

  it('PATCH with familyId: null clears the family', async () => {
    vi.mocked(db.updateService).mockResolvedValue({ id: 'svc1', familyId: null } as never)
    const res = await app.request('/api/v1/services/svc1', {
      method: 'PATCH',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ familyId: null }),
    })
    expect(res.status).toBe(200)
    expect(db.updateService).toHaveBeenCalledWith(
      'svc1',
      's1',
      expect.objectContaining({ familyId: null }),
    )
  })

  it('PATCH without familyId omits the field from the patch', async () => {
    vi.mocked(db.updateService).mockResolvedValue({ id: 'svc1' } as never)
    const res = await app.request('/api/v1/services/svc1', {
      method: 'PATCH',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Renamed' }),
    })
    expect(res.status).toBe(200)
    const patch = vi.mocked(db.updateService).mock.calls[0]?.[2] as Record<string, unknown>
    expect('familyId' in patch).toBe(false)
  })

  it('404 on PATCH missing', async () => {
    vi.mocked(db.updateService).mockResolvedValue(undefined as never)
    const res = await app.request('/api/v1/services/missing', {
      method: 'PATCH',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'New' }),
    })
    expect(res.status).toBe(404)
  })

  it('200 on GET /:id/addons', async () => {
    vi.mocked(db.getActiveServiceAddonsForService).mockResolvedValue([
      { id: 'a1' },
    ] as never)
    const res = await app.request('/api/v1/services/svc1/addons', {
      headers: authHeaders,
    })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ addons: [{ id: 'a1' }] })
  })

  it('200 on GET /:id/combo-components', async () => {
    vi.mocked(db.getComboComponents).mockResolvedValue({
      comboServiceId: 'svc1',
      components: [],
      totalDuration: 0,
      totalPrice: 0,
    } as never)
    const res = await app.request('/api/v1/services/svc1/combo-components', {
      headers: authHeaders,
    })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      combo: {
        comboServiceId: 'svc1',
        components: [],
        totalDuration: 0,
        totalPrice: 0,
      },
    })
  })

  it('404 on GET /:id/combo-components missing', async () => {
    vi.mocked(db.getComboComponents).mockResolvedValue(undefined as never)
    const res = await app.request('/api/v1/services/missing/combo-components', {
      headers: authHeaders,
    })
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'پکیج یافت نشد' })
  })

  it('staff is 403 on PUT /:id/combo-components', async () => {
    vi.mocked(getMemberForUser).mockResolvedValue({ userId: 'u2', organizationId: 's1', role: 'member', name: 'Staff', username: '09120000001' } as never)
    const res = await app.request('/api/v1/services/svc1/combo-components', {
      method: 'PUT',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ componentServiceIds: ['x'] }),
    })
    expect(res.status).toBe(403)
  })

  it('200 on PUT /:id/combo-components', async () => {
    vi.mocked(db.replaceComboComponents).mockResolvedValue({
      comboServiceId: 'svc1',
      components: [{ id: 'c1' }],
      totalDuration: 30,
      totalPrice: 1000,
    } as never)
    const res = await app.request('/api/v1/services/svc1/combo-components', {
      method: 'PUT',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ componentServiceIds: ['c1'] }),
    })
    expect(res.status).toBe(200)
  })

  it('maps combo-cannot-contain-itself to 400', async () => {
    vi.mocked(db.replaceComboComponents).mockRejectedValue(
      new Error('combo service cannot contain itself'),
    )
    const res = await app.request('/api/v1/services/svc1/combo-components', {
      method: 'PUT',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ componentServiceIds: ['svc1'] }),
    })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'پکیج نمی‌تواند شامل خودش باشد' })
  })

  it('maps combo-duplicates to 400', async () => {
    vi.mocked(db.replaceComboComponents).mockRejectedValue(
      new Error('combo components cannot contain duplicates'),
    )
    const res = await app.request('/api/v1/services/svc1/combo-components', {
      method: 'PUT',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ componentServiceIds: ['a', 'a'] }),
    })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({
      error: 'هر خدمت فقط یک بار می‌تواند در پکیج باشد',
    })
  })

  it('staff is 403 on POST /import-starter-templates', async () => {
    vi.mocked(getMemberForUser).mockResolvedValue({ userId: 'u2', organizationId: 's1', role: 'member', name: 'Staff', username: '09120000001' } as never)
    const res = await app.request('/api/v1/services/import-starter-templates', {
      method: 'POST',
      headers: authHeaders,
    })
    expect(res.status).toBe(403)
  })

  it('200 on POST /import-starter-templates', async () => {
    vi.mocked(db.importStarterServiceTemplates).mockResolvedValue({
      categories: [],
      families: [],
      services: [],
    } as never)
    const res = await app.request('/api/v1/services/import-starter-templates', {
      method: 'POST',
      headers: authHeaders,
    })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ categories: [], families: [], services: [] })
  })
})
