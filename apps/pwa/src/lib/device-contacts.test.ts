import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  CONTACT_PICK_BLOCKED_TOAST,
  pickDeviceContacts,
} from './device-contacts'

const toast = vi.hoisted(() => vi.fn())

vi.mock('@repo/ui/use-toast', () => ({
  toast,
}))

function stubNavigator(
  contacts: { select: ReturnType<typeof vi.fn> } | undefined,
  permissionState?: PermissionState,
) {
  vi.stubGlobal('navigator', {
    contacts,
    permissions:
      permissionState === undefined
        ? undefined
        : {
            query: vi.fn().mockResolvedValue({ state: permissionState }),
          },
  })
}

describe('pickDeviceContacts', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    toast.mockReset()
  })

  it('returns null when user cancels or selects nothing', async () => {
    stubNavigator({
      select: vi.fn().mockResolvedValue([]),
    })

    await expect(pickDeviceContacts({ multiple: false })).resolves.toBeNull()
    expect(toast).not.toHaveBeenCalled()
  })

  it('returns mapped rows on success', async () => {
    stubNavigator({
      select: vi
        .fn()
        .mockResolvedValue([{ name: ['مریم احمدی'], tel: ['09123456789'] }]),
    })

    await expect(pickDeviceContacts({ multiple: false })).resolves.toEqual([
      { name: ['مریم احمدی'], tel: ['09123456789'] },
    ])
    expect(toast).not.toHaveBeenCalled()
  })

  it('returns null when contacts API is unavailable', async () => {
    vi.stubGlobal('navigator', {})

    await expect(pickDeviceContacts({ multiple: true })).resolves.toBeNull()
    expect(toast).not.toHaveBeenCalled()
  })

  it('shows blocked toast when select throws', async () => {
    stubNavigator({
      select: vi.fn().mockRejectedValue(new Error('denied')),
    })

    await expect(pickDeviceContacts({ multiple: false })).resolves.toBeNull()
    expect(toast).toHaveBeenCalledWith(CONTACT_PICK_BLOCKED_TOAST)
  })

  it('shows blocked toast when contacts permission is denied', async () => {
    const select = vi.fn()
    stubNavigator({ select }, 'denied')

    await expect(pickDeviceContacts({ multiple: false })).resolves.toBeNull()
    expect(toast).toHaveBeenCalledWith(CONTACT_PICK_BLOCKED_TOAST)
    expect(CONTACT_PICK_BLOCKED_TOAST.description).toContain('app.saluna.ir')
    expect(CONTACT_PICK_BLOCKED_TOAST.description).toContain('Chrome')
    expect(select).not.toHaveBeenCalled()
  })

  it('shows blocked toast when select returns empty after permission denial', async () => {
    const query = vi
      .fn()
      .mockResolvedValueOnce({ state: 'prompt' })
      .mockResolvedValueOnce({ state: 'denied' })

    vi.stubGlobal('navigator', {
      contacts: {
        select: vi.fn().mockResolvedValue([]),
      },
      permissions: { query },
    })

    await expect(pickDeviceContacts({ multiple: false })).resolves.toBeNull()
    expect(toast).toHaveBeenCalledWith(CONTACT_PICK_BLOCKED_TOAST)
  })
})
