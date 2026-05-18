import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@repo/auth/auth', () => ({
  login: vi.fn(),
  createSession: vi.fn(),
  getCurrentUserFromRequest: vi.fn(),
  verifySession: vi.fn(),
}))

vi.mock('@repo/auth/signup', () => ({
  createSalonWorkspace: vi.fn(),
  SignupConflictError: class SignupConflictError extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'SignupConflictError'
    }
  },
  SignupValidationError: class SignupValidationError extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'SignupValidationError'
    }
  },
}))

vi.mock('@repo/database/auth-users', () => ({
  getUserById: vi.fn(),
}))

import {
  createSession,
  getCurrentUserFromRequest,
  login,
} from '@repo/auth/auth'
import {
  createSalonWorkspace,
  SignupConflictError,
  SignupValidationError,
} from '@repo/auth/signup'

process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = 'postgres://stub'
process.env.JWT_SECRET = 'test-secret'

const { app } = await import('../app')

const sampleUser = {
  id: 'u1',
  salonId: 's1',
  name: 'Manager',
  phone: '09120000000',
  role: 'manager' as const,
  color: 'blue',
  createdAt: new Date(),
}

beforeEach(() => {
  vi.clearAllMocks()
})

function jsonHeaders() {
  return { 'Content-Type': 'application/json' }
}

describe('auth router', () => {
  describe('POST /login', () => {
    it('returns 400 on invalid body', async () => {
      const res = await app.request('/api/v1/auth/login', {
        method: 'POST',
        headers: jsonHeaders(),
        body: JSON.stringify({ phone: '', password: '' }),
      })
      expect(res.status).toBe(400)
    })

    it('returns 401 when login fails', async () => {
      vi.mocked(login).mockResolvedValue(null)
      const res = await app.request('/api/v1/auth/login', {
        method: 'POST',
        headers: jsonHeaders(),
        body: JSON.stringify({ phone: '09121234567', password: 'secret123' }),
      })
      expect(res.status).toBe(401)
      expect(await res.json()).toEqual({
        error: 'شماره موبایل یا رمز عبور اشتباه است',
      })
    })

    it('returns 200 with user/token and sets session cookie', async () => {
      vi.mocked(login).mockResolvedValue({ user: sampleUser, token: 'tok-abc' } as never)
      const res = await app.request('/api/v1/auth/login', {
        method: 'POST',
        headers: jsonHeaders(),
        body: JSON.stringify({ phone: '09121234567', password: 'secret123' }),
      })
      expect(res.status).toBe(200)
      const body = (await res.json()) as { user: typeof sampleUser; token: string }
      expect(body.token).toBe('tok-abc')
      expect(body.user.id).toBe('u1')
      const setCookie = res.headers.get('set-cookie') ?? ''
      expect(setCookie).toContain('session=tok-abc')
      expect(setCookie.toLowerCase()).toContain('httponly')
    })
  })

  describe('POST /logout', () => {
    it('returns 200 and deletes the session cookie', async () => {
      const res = await app.request('/api/v1/auth/logout', { method: 'POST' })
      expect(res.status).toBe(200)
      expect(await res.json()).toEqual({ success: true })
      const setCookie = res.headers.get('set-cookie') ?? ''
      expect(setCookie).toContain('session=')
    })
  })

  describe('GET /me', () => {
    it('returns 401 when unauthenticated', async () => {
      vi.mocked(getCurrentUserFromRequest).mockResolvedValue(null)
      const res = await app.request('/api/v1/auth/me')
      expect(res.status).toBe(401)
      expect(await res.json()).toEqual({ error: 'وارد نشده‌اید' })
    })

    it('returns 200 with user when authenticated', async () => {
      vi.mocked(getCurrentUserFromRequest).mockResolvedValue(sampleUser as never)
      const res = await app.request('/api/v1/auth/me')
      expect(res.status).toBe(200)
      expect(await res.json()).toEqual({ user: { ...sampleUser, createdAt: sampleUser.createdAt.toISOString() } })
    })
  })

  describe('POST /signup', () => {
    const validBody = {
      salonName: 'My Salon',
      slug: 'my-salon',
      managerName: 'Ali',
      managerPhone: '09121234567',
      password: 'secret123',
    }

    it('returns 400 on invalid body', async () => {
      const res = await app.request('/api/v1/auth/signup', {
        method: 'POST',
        headers: jsonHeaders(),
        body: JSON.stringify({ ...validBody, slug: '' }),
      })
      expect(res.status).toBe(400)
    })

    it('returns 409 on conflict', async () => {
      vi.mocked(createSalonWorkspace).mockRejectedValue(
        new SignupConflictError('این آدرس سالن قبلاً ثبت شده است'),
      )
      const res = await app.request('/api/v1/auth/signup', {
        method: 'POST',
        headers: jsonHeaders(),
        body: JSON.stringify(validBody),
      })
      expect(res.status).toBe(409)
      expect(await res.json()).toEqual({
        error: 'این آدرس سالن قبلاً ثبت شده است',
      })
    })

    it('returns 400 on validation error from workspace', async () => {
      vi.mocked(createSalonWorkspace).mockRejectedValue(
        new SignupValidationError('شماره موبایل مدیر معتبر نیست'),
      )
      const res = await app.request('/api/v1/auth/signup', {
        method: 'POST',
        headers: jsonHeaders(),
        body: JSON.stringify(validBody),
      })
      expect(res.status).toBe(400)
    })

    it('returns 200 with salon, user, token, and redirectTo', async () => {
      vi.mocked(createSalonWorkspace).mockResolvedValue({
        salon: { id: 's1', name: 'My Salon', slug: 'my-salon' },
        user: sampleUser,
      } as never)
      vi.mocked(createSession).mockResolvedValue('tok-new')
      const res = await app.request('/api/v1/auth/signup', {
        method: 'POST',
        headers: jsonHeaders(),
        body: JSON.stringify(validBody),
      })
      expect(res.status).toBe(200)
      const body = (await res.json()) as { token: string; redirectTo: string }
      expect(body.token).toBe('tok-new')
      expect(body.redirectTo).toBe('/onboarding')
      const setCookie = res.headers.get('set-cookie') ?? ''
      expect(setCookie).toContain('session=tok-new')
    })
  })
})
