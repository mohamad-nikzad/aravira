import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { QueryKey } from '@tanstack/react-query'

export function useTelegramFocusRefresh(queryKeys: ReadonlyArray<QueryKey>) {
  const queryClient = useQueryClient()
  const queryKeysRef = useRef(queryKeys)
  queryKeysRef.current = queryKeys

  useEffect(() => {
    const onFocus = () => {
      for (const queryKey of queryKeysRef.current) {
        void queryClient.invalidateQueries({ queryKey })
      }
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [queryClient])
}
