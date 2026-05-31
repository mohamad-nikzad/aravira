import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@repo/notifications', () => ({
  getMessagingProvider: vi.fn(),
  getTelegramConfig: vi.fn(),
  listNotificationsForUser: vi.fn(),
  markAllNotificationsRead: vi.fn(),
  markNotificationRead: vi.fn(),
  createNotificationForUser: vi.fn(),
  isWebPushConfigured: vi.fn(() => false),
  renderAppointmentRequestPending: vi.fn(),
  messagingCommands: {
    handleLinkStart: vi.fn(),
    handleUnlink: vi.fn(),
  },
  sendTelegramMessage: vi.fn(),
  answerTelegramCallback: vi.fn(),
}))

vi.mock('@repo/database/messaging', () => ({
  checkMessagingLinkRateLimit: vi.fn(),
  createLinkToken: vi.fn(),
  deleteAccount: vi.fn(),
  listAccountsForUser: vi.fn(),
  setAccountEnabled: vi.fn(),
}))

vi.mock('@repo/database/public', () => ({
  getEnabledMessagingProvidersForSalon: vi.fn(),
}))

vi.mock('@repo/auth/server', () => ({
  auth: { api: { getSession: vi.fn() } },
}))

vi.mock('@repo/database/members', () => ({
  getMemberForUser: vi.fn(),
}))

import * as notif from '@repo/notifications'
import * as messagingDb from '@repo/database/messaging'
import { auth as authServer } from '@repo/auth/server'
import { getMemberForUser } from '@repo/database/members'

process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = 'postgres://stub'
process.env.JWT_SECRET = 'test-secret'
process.env.TELEGRAM_BOT_USERNAME = 'TestBot'

const { app } = await import('../app')

const authHeaders = { Authorization: 'Bearer testtoken' }

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(authServer.api.getSession).mockImplementation(
    async (args: any) =>
      (args?.headers?.get?.('Authorization') ? { user: { id: 'u1' } } : null) as never
  )
  vi.mocked(getMemberForUser).mockResolvedValue({
    userId: 'u1',
    organizationId: 's1',
    role: 'owner',
    name: 'Manager',
    username: '09120000000',
  } as never)
  vi.mocked(messagingDb.checkMessagingLinkRateLimit).mockResolvedValue({ allowed: true })
  vi.mocked(notif.getTelegramConfig).mockReturnValue(null)
})

describe('messaging router', () => {
  it('401 without auth', async () => {
    const res = await app.request('/api/v1/messaging/accounts')
    expect(res.status).toBe(401)
  })

  it('403 for staff without manage_settings', async () => {
    vi.mocked(getMemberForUser).mockResolvedValue({
      userId: 'u2',
      organizationId: 's1',
      role: 'member',
      name: 'Staff',
      username: '09121111111',
    } as never)
    const res = await app.request('/api/v1/messaging/accounts', { headers: authHeaders })
    expect(res.status).toBe(403)
  })

  it('POST /link returns a deep link for telegram', async () => {
    vi.mocked(notif.getMessagingProvider).mockReturnValue({
      id: 'telegram',
      displayName: 'Telegram',
      supportsInlineButtons: true,
      supportsInbound: true,
      isConfigured: () => true,
      buildAccountLinkUrl: (token: string) => `https://t.me/TestBot?start=${token}`,
      send: vi.fn(),
    } as never)
    const expiresAt = new Date(Date.now() + 60000)
    vi.mocked(messagingDb.createLinkToken).mockResolvedValue({
      token: 'tok-1',
      userId: 'u1',
      salonId: 's1',
      provider: 'telegram',
      createdAt: new Date(),
      expiresAt,
      consumedAt: null,
    } as never)

    const res = await app.request('/api/v1/messaging/link', {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'telegram' }),
    })
    expect(res.status).toBe(201)
    const body = (await res.json()) as { deepLink: string; expiresAt: string }
    expect(body.deepLink).toBe('https://t.me/TestBot?start=tok-1')
    expect(body.expiresAt).toBe(expiresAt.toISOString())
  })

  it('POST /link returns 429 when rate-limited', async () => {
    vi.mocked(messagingDb.checkMessagingLinkRateLimit).mockResolvedValue({
      allowed: false,
      retryAfterMs: 60_000,
    })
    const res = await app.request('/api/v1/messaging/link', {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'telegram' }),
    })
    expect(res.status).toBe(429)
    expect(messagingDb.createLinkToken).not.toHaveBeenCalled()
  })

  it('POST /link 400 when provider not configured', async () => {
    vi.mocked(notif.getMessagingProvider).mockReturnValue(undefined as never)
    const res = await app.request('/api/v1/messaging/link', {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'telegram' }),
    })
    expect(res.status).toBe(400)
  })

  it('GET /accounts returns the user accounts', async () => {
    vi.mocked(messagingDb.listAccountsForUser).mockResolvedValue([
      {
        id: 'acc-1',
        userId: 'u1',
        provider: 'telegram',
        externalId: '42',
        displayName: '@x',
        enabled: true,
        linkedAt: new Date('2026-05-31T10:00:00Z'),
        updatedAt: new Date(),
      },
    ] as never)
    const res = await app.request('/api/v1/messaging/accounts', { headers: authHeaders })
    expect(res.status).toBe(200)
    const body = (await res.json()) as { accounts: Array<{ id: string }> }
    expect(body.accounts).toHaveLength(1)
    expect(body.accounts[0]!.id).toBe('acc-1')
  })

  it('DELETE /accounts/:id passes ownership through', async () => {
    vi.mocked(messagingDb.deleteAccount).mockResolvedValue(true as never)
    const res = await app.request(
      '/api/v1/messaging/accounts/11111111-1111-1111-1111-111111111111',
      { method: 'DELETE', headers: authHeaders }
    )
    expect(res.status).toBe(200)
    expect(messagingDb.deleteAccount).toHaveBeenCalledWith(
      '11111111-1111-1111-1111-111111111111',
      'u1'
    )
  })

  it('PATCH /accounts/:id toggles enabled', async () => {
    vi.mocked(messagingDb.setAccountEnabled).mockResolvedValue({
      id: 'acc-1',
      userId: 'u1',
      provider: 'telegram',
      externalId: '42',
      displayName: null,
      enabled: false,
      linkedAt: new Date(),
      updatedAt: new Date(),
    } as never)
    const res = await app.request(
      '/api/v1/messaging/accounts/11111111-1111-1111-1111-111111111111',
      {
        method: 'PATCH',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: false }),
      }
    )
    expect(res.status).toBe(200)
  })
})

describe('messaging telegram webhook', () => {
  it('200 no-op when telegram is not configured', async () => {
    vi.mocked(notif.getTelegramConfig).mockReturnValue(null)
    const res = await app.request('/api/v1/messaging/telegram/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-telegram-bot-api-secret-token': 'any',
      },
      body: JSON.stringify({ update_id: 1 }),
    })
    expect(res.status).toBe(200)
    expect(notif.messagingCommands.handleLinkStart).not.toHaveBeenCalled()
  })

  it('200 no-op when secret does not match (does NOT call commands)', async () => {
    vi.mocked(notif.getTelegramConfig).mockReturnValue({
      botToken: 'token',
      botUsername: 'TestBot',
      webhookSecret: 'real-secret',
    })
    const res = await app.request('/api/v1/messaging/telegram/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-telegram-bot-api-secret-token': 'wrong',
      },
      body: JSON.stringify({ update_id: 1 }),
    })
    expect(res.status).toBe(200)
    expect(notif.messagingCommands.handleLinkStart).not.toHaveBeenCalled()
  })

  it('routes /start <token> to handleLinkStart with the chat id', async () => {
    vi.mocked(notif.getTelegramConfig).mockReturnValue({
      botToken: 'token',
      botUsername: 'TestBot',
      webhookSecret: 'real-secret',
    })
    vi.mocked(notif.messagingCommands.handleLinkStart).mockResolvedValue({
      status: 'ok',
      message: 'متصل شد',
    } as never)
    vi.mocked(notif.sendTelegramMessage).mockResolvedValue({ status: 'sent' } as never)

    const res = await app.request('/api/v1/messaging/telegram/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-telegram-bot-api-secret-token': 'real-secret',
      },
      body: JSON.stringify({
        update_id: 1,
        message: {
          message_id: 99,
          from: { id: 42, username: 'mo', first_name: 'Mo' },
          chat: { id: 42, type: 'private' },
          text: '/start abc-123',
        },
      }),
    })
    expect(res.status).toBe(200)
    expect(notif.messagingCommands.handleLinkStart).toHaveBeenCalledWith({
      provider: 'telegram',
      token: 'abc-123',
      externalId: '42',
      displayName: '@mo',
    })
    expect(notif.sendTelegramMessage).toHaveBeenCalledWith({
      chatId: '42',
      text: 'متصل شد',
    })
  })
})
