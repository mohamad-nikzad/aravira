import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { QueryKey } from '@tanstack/react-query'

import { api } from '#/lib/api-client'
import { getMutationErrorMessage } from '#/lib/query-client'

export function useTelegramConnect(options?: {
  /** Custom error message fallback */
  errorMessage?: string
  /** Query keys to invalidate after opening deep link (with optional delay) */
  invalidateQueries?: ReadonlyArray<QueryKey>
  invalidateDelayMs?: number
  skipErrorToast?: boolean
  skipSuccessToast?: boolean
}) {
  const queryClient = useQueryClient()
  const [linkError, setLinkError] = useState<string | null>(null)

  const {
    errorMessage = 'اتصال تلگرام انجام نشد',
    invalidateQueries = [],
    invalidateDelayMs = 4000,
    skipErrorToast = false,
    skipSuccessToast = true,
  } = options ?? {}

  const connectTelegram = useMutation({
    mutationFn: () => api.messaging.createLink({ provider: 'telegram' }),
    meta: {
      skipSuccessToast,
      skipErrorToast,
      errorMessage,
    },
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
  })

  return {
    connect: () => connectTelegram.mutate(),
    isPending: connectTelegram.isPending,
    linkError,
    clearError: () => setLinkError(null),
  }
}
