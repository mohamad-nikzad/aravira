import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { QueryKey } from '@tanstack/react-query'
import type { MessagingProviderId } from '@repo/api-client/types'

import { useCreateMessagingLinkMutation } from '#/lib/messaging-queries'
import { getMutationErrorMessage } from '#/lib/query-client'

export function useMessagingConnect(
  provider: MessagingProviderId,
  options?: {
    /** Custom error message fallback */
    errorMessage?: string
    /** Query keys to invalidate after opening deep link (with optional delay) */
    invalidateQueries?: ReadonlyArray<QueryKey>
    invalidateDelayMs?: number
    skipErrorToast?: boolean
    skipSuccessToast?: boolean
  },
) {
  const queryClient = useQueryClient()
  const [linkError, setLinkError] = useState<string | null>(null)

  const {
    errorMessage = 'اتصال پیام‌رسان انجام نشد',
    invalidateQueries = [],
    invalidateDelayMs = 4000,
    skipErrorToast = false,
    skipSuccessToast = true,
  } = options ?? {}

  const connect = useCreateMessagingLinkMutation({
    skipSuccessToast,
    skipErrorToast,
    errorMessage,
  })

  return {
    connect: () =>
      connect.mutate(provider, {
        onSuccess: (data) => {
          setLinkError(null)
          window.open(data.deepLink, '_blank', 'noopener,noreferrer')
          if (invalidateQueries.length > 0) {
            const invalidate = () => {
              for (const queryKey of invalidateQueries) {
                void queryClient.invalidateQueries({ queryKey })
              }
            }
            if (invalidateDelayMs > 0) {
              window.setTimeout(invalidate, invalidateDelayMs)
            } else {
              invalidate()
            }
          }
        },
        onError: (err) => {
          setLinkError(getMutationErrorMessage(err, errorMessage))
        },
      }),
    isPending: connect.isPending,
    linkError,
    clearError: () => setLinkError(null),
  }
}
