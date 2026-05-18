import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@repo/database/clients', () => ({
  getAllClients: vi.fn(),
  getClientById: vi.fn(),
  getClientTags: vi.fn(),
  setClientTags: vi.fn(),
  createClient: vi.fn(),
  updateClient: vi.fn(),
  isClientProvidedEntityId: (id: string | undefined) => typeof id === 'string' && id.length > 0,
  getClientSummary: vi.fn(),
  createClientFollowUp: vi.fn(),
}))

vi.mock('@repo/auth/auth', () => ({
  verifySession: vi.fn(),
}))

vi.mock('@repo/database/auth-users', () => ({
  getUserById: vi.fn(),
}))

import * as db from '@repo/database/clients'
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

function authHeaders() {
  return { Authorization: 'Bearer testtoken' }
}

beforeEach(() => {
  vi.mocked(verifySession).mockResolvedValue('u1')
  vi.mocked(getUserById).mockResolvedValue(managerUser as never)
  vi.clearAllMocks()
  vi.mocked(verifySession).mockResolvedValue('u1')
  vi.mocked(getUserById).mockResolvedValue(managerUser as never)
})

describe('clients router', () => {
  it('returns 401 without auth', async () => {
    const res = await app.request('/api/v1/clients')
    expect(res.status).toBe(401)
  })

  it('returns 200 list shape with stubbed getAllClients', async () => {
    vi.mocked(db.getAllClients).mockResolvedValue([{ id: 'c1' }] as never)
    const res = await app.request('/api/v1/clients', { headers: authHeaders() })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ clients: [{ id: 'c1' }] })
  })

  it('returns 400 on invalid create body', async () => {
    const res = await app.request('/api/v1/clients', {
      method: 'POST',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '', phone: 'bogus' }),
    })
    expect(res.status).toBe(400)
    const body = (await res.json()) as { error: string }
    expect(typeof body.error).toBe('string')
  })

  it('returns 409 duplicate-phone code', async () => {
    vi.mocked(db.createClient).mockRejectedValue(new Error('duplicate key value'))
    const res = await app.request('/api/v1/clients', {
      method: 'POST',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Ali', phone: '09121234567', tags: [] }),
    })
    expect(res.status).toBe(409)
    expect(await res.json()).toEqual({
      error: 'این شماره تماس برای این سالن قبلاً ثبت شده است',
      code: 'duplicate-phone',
    })
  })
})
