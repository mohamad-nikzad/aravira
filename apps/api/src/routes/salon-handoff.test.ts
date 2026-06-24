import { beforeEach, describe, expect, it, vi } from 'vitest'

const { authHandler, getSession, setPassword } = vi.hoisted(() => ({
  authHandler: vi.fn(),
  getSession: vi.fn(),
  setPassword: vi.fn(),
}))

vi.mock('@repo/auth/server', () => ({
  auth: { api: { getSession, setPassword } },
  getAuthForRequest: () => ({ handler: authHandler }),
}))

vi.mock('@repo/database/salon-handoff', () => ({
  getActiveSalonHandoff: vi.fn(),
  completeSalonHandoff: vi.fn(),
  getSalonIdentityConflictForPhone: vi.fn(),
  hasCredentialPassword: vi.fn(),
}))

import {
  completeSalonHandoff,
  getActiveSalonHandoff,
  getSalonIdentityConflictForPhone,
  hasCredentialPassword,
} from '@repo/database/salon-handoff'
import { salonHandoffRoute } from './salon-handoff'

const token = 'a'.repeat(43)
const phone = '09121234567'

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(getActiveSalonHandoff).mockResolvedValue({
    handoffId: 'handoff-1',
    salonId: 'salon-1',
    intendedOwnerPhone: phone,
    expiresAt: new Date('2026-06-24T12:00:00.000Z'),
    credentialPassword: null,
  })
  vi.mocked(getSalonIdentityConflictForPhone).mockResolvedValue(undefined)
  vi.mocked(hasCredentialPassword).mockResolvedValue(false)
})

describe('Salon Handoff route', () => {
  it('never exposes the recorded phone and sends OTP only to that phone', async () => {
    authHandler.mockResolvedValue(
      new Response(JSON.stringify({ status: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )

    const statusRes = await salonHandoffRoute.request(`/${token}`)
    const sendRes = await salonHandoffRoute.request(`/${token}/send-otp`, {
      method: 'POST',
      headers: { origin: 'http://localhost:3000' },
    })

    expect(statusRes.status).toBe(200)
    expect(await statusRes.json()).toEqual({
      phone: '0912•••4567',
      expiresAt: '2026-06-24T12:00:00.000Z',
      requiresPassword: true,
    })
    expect(sendRes.status).toBe(200)
    const proxied = authHandler.mock.calls[0]?.[0] as Request
    expect(await proxied.json()).toEqual({ phoneNumber: phone })
  })

  it('preserves OTP failure and rejects weak passwords before activation', async () => {
    authHandler.mockResolvedValue(
      new Response(JSON.stringify({ code: 'INVALID_OTP' }), { status: 400 }),
    )
    const otpRes = await salonHandoffRoute.request(`/${token}/verify-otp`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code: '000000' }),
    })
    const passwordRes = await salonHandoffRoute.request(`/${token}/complete`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ displayName: 'Sara', password: 'short' }),
    })

    expect(otpRes.status).toBe(400)
    expect(passwordRes.status).toBe(400)
    expect(completeSalonHandoff).not.toHaveBeenCalled()
  })

  it('activates for the verified session and returns the manager redirect', async () => {
    getSession.mockResolvedValue({
      user: { id: 'owner-1', phoneNumber: phone },
    })
    setPassword.mockResolvedValue(undefined)
    vi.mocked(completeSalonHandoff).mockResolvedValue({
      status: 'completed',
      salonId: 'salon-1',
      publicEnabled: false,
    })

    const res = await salonHandoffRoute.request(`/${token}/complete`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ displayName: 'Sara', password: 'safe-pass-123' }),
    })

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      salonId: 'salon-1',
      redirectTo: '/dashboard',
      publicEnabled: false,
    })
    expect(completeSalonHandoff).toHaveBeenCalledWith(
      expect.objectContaining({
        token,
        userId: 'owner-1',
        displayName: 'Sara',
      }),
    )
  })

  it('reuses an existing credentialed identity without replacing its password', async () => {
    vi.mocked(getActiveSalonHandoff).mockResolvedValue({
      handoffId: 'handoff-1',
      salonId: 'salon-1',
      intendedOwnerPhone: phone,
      expiresAt: new Date('2026-06-24T12:00:00.000Z'),
      credentialPassword: 'hashed-password',
    })
    vi.mocked(hasCredentialPassword).mockResolvedValue(true)
    getSession.mockResolvedValue({
      user: { id: 'owner-1', phoneNumber: phone },
    })
    vi.mocked(completeSalonHandoff).mockResolvedValue({
      status: 'completed',
      salonId: 'salon-1',
      publicEnabled: true,
    })

    const res = await salonHandoffRoute.request(`/${token}/complete`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ displayName: 'Sara' }),
    })

    expect(res.status).toBe(200)
    expect(setPassword).not.toHaveBeenCalled()
    expect(await res.json()).toMatchObject({
      salonId: 'salon-1',
      publicEnabled: true,
    })
  })

  it('returns the same completed state when the successful request is retried', async () => {
    vi.mocked(getActiveSalonHandoff).mockResolvedValue(undefined as never)
    getSession.mockResolvedValue({
      user: { id: 'owner-1', phoneNumber: phone },
    })
    vi.mocked(completeSalonHandoff).mockResolvedValue({
      status: 'completed',
      salonId: 'salon-1',
      publicEnabled: false,
    })

    const res = await salonHandoffRoute.request(`/${token}/complete`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ displayName: 'Sara' }),
    })

    expect(res.status).toBe(200)
    expect(setPassword).not.toHaveBeenCalled()
    expect(await res.json()).toEqual({
      salonId: 'salon-1',
      redirectTo: '/dashboard',
      publicEnabled: false,
    })
  })

  it('rejects an identity already attached to another salon', async () => {
    getSession.mockResolvedValue({
      user: { id: 'owner-1', phoneNumber: phone },
    })
    vi.mocked(getSalonIdentityConflictForPhone).mockResolvedValue({
      salonId: 'salon-2',
      salonName: 'Mehr',
      salonStatus: 'active',
    })

    const res = await salonHandoffRoute.request(`/${token}/complete`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        displayName: 'Sara',
        password: 'safe-pass-123',
      }),
    })

    expect(res.status).toBe(409)
    expect(await res.json()).toMatchObject({
      code: 'HANDOFF_IDENTITY_CONFLICT',
    })
    expect(setPassword).not.toHaveBeenCalled()
    expect(completeSalonHandoff).not.toHaveBeenCalled()
  })

  it('does not accept a consumed or superseded link for another identity', async () => {
    vi.mocked(getActiveSalonHandoff).mockResolvedValue(undefined as never)
    getSession.mockResolvedValue({
      user: { id: 'other-user', phoneNumber: phone },
    })
    vi.mocked(completeSalonHandoff).mockResolvedValue({ status: 'invalid' })

    const res = await salonHandoffRoute.request(`/${token}/complete`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ displayName: 'Other' }),
    })

    expect(res.status).toBe(409)
    expect(await res.json()).toMatchObject({ code: 'HANDOFF_INVALID' })
  })
})
