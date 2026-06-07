// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient } from '@tanstack/react-query'

import {
  getApiV1RetentionQueryKey,
  retentionListQueryOptions,
} from '#/lib/retention-queries'

const getApiV1Retention = vi.fn()

vi.mock('@repo/api-client/sdk', () => ({
  getApiV1Retention: (...args: unknown[]) => getApiV1Retention(...args),
}))

beforeEach(() => {
  getApiV1Retention.mockReset()
})

describe('retention-queries', () => {
  it('exposes generated retention query keys', () => {
    expect(getApiV1RetentionQueryKey()[0]._id).toBe('getApiV1Retention')
  })

  it('maps retention list from the generated response', async () => {
    getApiV1Retention.mockResolvedValue({
      data: {
        items: [
          {
            id: 'f1',
            client: {
              id: 'c1',
              name: 'Ali',
              phone: '09121234567',
              isPlaceholder: false,
              createdAt: '2026-01-01T00:00:00.000Z',
            },
            reason: 'manual',
            status: 'open',
            dueDate: '2026-06-15',
            lastVisitDate: null,
            lastServiceName: null,
            completedCount: 0,
            estimatedSpend: 0,
            noShowCount: 0,
            suggestedReason: 'Follow up',
          },
        ],
      },
    })

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    const data = await queryClient.fetchQuery(retentionListQueryOptions())

    expect(data.items).toHaveLength(1)
    expect(data.items[0]?.client.name).toBe('Ali')
  })
})
