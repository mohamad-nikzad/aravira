import { createContext, useCallback, useContext, useMemo } from 'react'
import type { ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'
import { ApiError } from '@repo/api-client'
import { clearOfflineDatabase } from '@repo/data-client'
import type { User } from '@repo/salon-core/types'

import { api } from '#/lib/api-client'
import {
  SESSION_USER_CACHE_KEY,
  clearSnapshot,
  readSnapshot,
  writeSnapshot,
} from '#/lib/offline-snapshot'

export const authQueryKey = ['auth', 'me'] as const

async function fetchSessionUser({
  signal,
}: { signal?: AbortSignal } = {}): Promise<User | null> {
  try {
    const res = await api.auth.me({ signal })
    writeSnapshot(SESSION_USER_CACHE_KEY, res.user)
    return res.user
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      clearSnapshot(SESSION_USER_CACHE_KEY)
      return null
    }
    // Network/offline: fall back to cached user so the app stays usable.
    return readSnapshot<User>(SESSION_USER_CACHE_KEY)?.data ?? null
  }
}

export function registerAuthQueryDefaults(queryClient: QueryClient) {
  queryClient.setQueryDefaults(authQueryKey, {
    queryFn: ({ signal }) => fetchSessionUser({ signal }),
    staleTime: 60_000,
    retry: 1,
  })

  const cached = readSnapshot<User>(SESSION_USER_CACHE_KEY)?.data ?? null
  if (cached) {
    queryClient.setQueryData(authQueryKey, cached)
  }
}

export type AuthContextValue = {
  user: User | null
  loading: boolean
  logout: () => Promise<void>
  refresh: () => Promise<User | null>
  setUser: (user: User | null) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()

  const query = useQuery<User | null>({
    queryKey: authQueryKey,
    queryFn: ({ signal }) => fetchSessionUser({ signal }),
    refetchOnMount: 'always',
  })

  const setUser = useCallback(
    (user: User | null) => {
      queryClient.setQueryData(authQueryKey, user)
      if (user) {
        writeSnapshot(SESSION_USER_CACHE_KEY, user)
      } else {
        clearSnapshot(SESSION_USER_CACHE_KEY)
      }
    },
    [queryClient],
  )

  const refresh = useCallback(
    () =>
      queryClient.fetchQuery({
        queryKey: authQueryKey,
        queryFn: ({ signal }) => fetchSessionUser({ signal }),
      }),
    [queryClient],
  )

  const logout = useCallback(async () => {
    try {
      await api.auth.logout()
    } catch {
      /* ignore — clear local state regardless */
    }
    setUser(null)
    await clearOfflineDatabase()
    await queryClient.invalidateQueries()
  }, [queryClient, setUser])

  const value = useMemo<AuthContextValue>(
    () => ({
      user: query.data ?? null,
      loading: query.isLoading,
      logout,
      refresh,
      setUser,
    }),
    [query.data, query.isPending, logout, refresh, setUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
