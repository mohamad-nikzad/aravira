// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient } from '@tanstack/react-query'

import {
  businessSettingsQueryOptions,
  getApiV1SettingsBusinessQueryKey,
} from '#/lib/settings-queries'

const getApiV1SettingsBusiness = vi.fn()

vi.mock('@repo/api-client/sdk', () => ({
  getApiV1SettingsBusiness: (...args: unknown[]) =>
    getApiV1SettingsBusiness(...args),
}))

beforeEach(() => {
  getApiV1SettingsBusiness.mockReset()
})

describe('settings-queries', () => {
  it('exposes generated business settings query keys', () => {
    expect(getApiV1SettingsBusinessQueryKey()[0]._id).toBe(
      'getApiV1SettingsBusiness',
    )
  })

  it('maps business settings from the generated response', async () => {
    getApiV1SettingsBusiness.mockResolvedValue({
      data: {
        settings: {
          workingStart: '09:00',
          workingEnd: '19:00',
          slotDurationMinutes: 30,
          workingDays: 126,
        },
      },
    })

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    const data = await queryClient.fetchQuery(businessSettingsQueryOptions())

    expect(data).toEqual({
      workingStart: '09:00',
      workingEnd: '19:00',
      slotDurationMinutes: 30,
      workingDays: 126,
    })
  })
})
