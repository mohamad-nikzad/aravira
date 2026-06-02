const PREFIX = 'aravira-offline-v1'

export const SESSION_USER_CACHE_KEY = 'session-user'

export type OfflineSnapshot<T> = {
  data: T
  updatedAt: string
}

function storageKey(key: string) {
  return `${PREFIX}:${key}`
}

export function readSnapshot<T>(key: string): OfflineSnapshot<T> | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(storageKey(key))
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !('updatedAt' in parsed)
    ) {
      return null
    }
    return parsed as OfflineSnapshot<T>
  } catch {
    return null
  }
}

export function writeSnapshot<T>(
  key: string,
  data: T,
): OfflineSnapshot<T> | null {
  if (typeof window === 'undefined') return null
  const snapshot: OfflineSnapshot<T> = {
    data,
    updatedAt: new Date().toISOString(),
  }
  try {
    window.localStorage.setItem(storageKey(key), JSON.stringify(snapshot))
  } catch {
    /* ignore quota / private mode failures */
  }
  return snapshot
}

export function clearSnapshot(key: string) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(storageKey(key))
  } catch {
    /* ignore */
  }
}
