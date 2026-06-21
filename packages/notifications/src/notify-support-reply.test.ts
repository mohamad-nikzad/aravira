import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@repo/database/support-tickets', () => ({
  listActiveSalonManagerUserIds: vi.fn(),
}))
vi.mock('@repo/database/notifications', () => ({
  createNotificationForUser: vi.fn(),
  dispatchNotification: vi.fn(),
}))

import {
  createNotificationForUser,
  dispatchNotification,
} from '@repo/database/notifications'
import { listActiveSalonManagerUserIds } from '@repo/database/support-tickets'
import { notifyManagersOfSupportReply } from './notify-support-reply'

beforeEach(() => vi.resetAllMocks())

describe('notifyManagersOfSupportReply', () => {
  it('fans out in-app-only support_reply notifications to all active managers', async () => {
    vi.mocked(listActiveSalonManagerUserIds).mockResolvedValue([
      'manager-1',
      'manager-2',
    ])
    vi.mocked(createNotificationForUser)
      .mockResolvedValueOnce({ id: 'notification-1' } as never)
      .mockResolvedValueOnce({ id: 'notification-2' } as never)

    await notifyManagersOfSupportReply({
      salonId: 'salon-1',
      ticketId: 'ticket-1',
    })

    expect(createNotificationForUser).toHaveBeenCalledTimes(2)
    expect(createNotificationForUser).toHaveBeenCalledWith({
      salonId: 'salon-1',
      userId: 'manager-1',
      type: 'support_reply',
      title: 'پاسخ جدید پشتیبانی',
      body: 'پشتیبانی سالونا به درخواست شما پاسخ داد.',
      route: '/support/ticket-1',
      data: { ticketId: 'ticket-1' },
    })
    expect(dispatchNotification).toHaveBeenCalledWith(
      'notification-1',
      'in_app',
    )
    expect(dispatchNotification).toHaveBeenCalledWith(
      'notification-2',
      'in_app',
    )
    expect(
      vi.mocked(dispatchNotification).mock.calls.map((call) => call[1]),
    ).toEqual(['in_app', 'in_app'])
  })

  it('settles every manager independently and logs failures', async () => {
    vi.mocked(listActiveSalonManagerUserIds).mockResolvedValue([
      'manager-1',
      'manager-2',
    ])
    vi.mocked(createNotificationForUser)
      .mockRejectedValueOnce(new Error('insert failed'))
      .mockResolvedValueOnce({ id: 'notification-2' } as never)
    const errorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)

    await expect(
      notifyManagersOfSupportReply({
        salonId: 'salon-1',
        ticketId: 'ticket-1',
      }),
    ).resolves.toBeUndefined()
    expect(createNotificationForUser).toHaveBeenCalledTimes(2)
    expect(errorSpy).toHaveBeenCalledWith(
      '[notifications] support reply fanout failed',
      expect.objectContaining({ userId: 'manager-1' }),
    )
    errorSpy.mockRestore()
  })

  it('continues fanout when one in-app dispatch fails', async () => {
    vi.mocked(listActiveSalonManagerUserIds).mockResolvedValue([
      'manager-1',
      'manager-2',
    ])
    vi.mocked(createNotificationForUser)
      .mockResolvedValueOnce({ id: 'notification-1' } as never)
      .mockResolvedValueOnce({ id: 'notification-2' } as never)
    vi.mocked(dispatchNotification)
      .mockRejectedValueOnce(new Error('dispatch failed'))
      .mockResolvedValueOnce(undefined as never)
    const errorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)

    await expect(
      notifyManagersOfSupportReply({
        salonId: 'salon-1',
        ticketId: 'ticket-1',
      }),
    ).resolves.toBeUndefined()

    expect(dispatchNotification).toHaveBeenCalledTimes(2)
    expect(dispatchNotification).toHaveBeenNthCalledWith(
      1,
      'notification-1',
      'in_app',
    )
    expect(dispatchNotification).toHaveBeenNthCalledWith(
      2,
      'notification-2',
      'in_app',
    )
    expect(errorSpy).toHaveBeenCalledWith(
      '[notifications] support reply fanout failed',
      expect.objectContaining({ userId: 'manager-1' }),
    )
    errorSpy.mockRestore()
  })
})
