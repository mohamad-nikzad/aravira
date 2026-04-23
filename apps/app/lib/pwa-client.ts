'use client'

import { useEffect, useState } from 'react'

const OFFLINE_CACHE_PREFIX = 'aravira-offline-v1'

export type OfflineSnapshot<T> = {
  data: T
  updatedAt: string
}

export class HttpError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'HttpError'
    this.status = status
  }
}

function getStorageKey(key: string) {
  return `${OFFLINE_CACHE_PREFIX}:${key}`
}

function getErrorMessage(payload: unknown, status: number) {
  if (payload && typeof payload === 'object' && 'error' in payload) {
    const errorMessage = payload.error
    if (typeof errorMessage === 'string' && errorMessage.trim()) {
      return errorMessage
    }
  }

  return `Request failed with status ${status}`
}

export async function fetchJsonOrThrow<T>(
  url: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(url, {
    credentials: 'include',
    ...init,
  })

  const isJson = response.headers.get('content-type')?.includes('application/json')
  const payload = isJson
    ? await response.json().catch(() => null)
    : await response.text().catch(() => null)

  if (!response.ok) {
    throw new HttpError(getErrorMessage(payload, response.status), response.status)
  }

  return payload as T
}

export function readOfflineSnapshot<T>(key: string | null): OfflineSnapshot<T> | null {
  if (!key || typeof window === 'undefined') {
    return null
  }

  try {
    const raw = window.localStorage.getItem(getStorageKey(key))
    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw) as OfflineSnapshot<T>
    if (!parsed || typeof parsed !== 'object' || !('updatedAt' in parsed)) {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

export function writeOfflineSnapshot<T>(
  key: string | null,
  data: T
): OfflineSnapshot<T> | null {
  if (!key || typeof window === 'undefined') {
    return null
  }

  const snapshot: OfflineSnapshot<T> = {
    data,
    updatedAt: new Date().toISOString(),
  }

  try {
    window.localStorage.setItem(getStorageKey(key), JSON.stringify(snapshot))
  } catch {
    return snapshot
  }

  return snapshot
}

export function clearOfflineSnapshot(key: string | null) {
  if (!key || typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.removeItem(getStorageKey(key))
  } catch {
    /* ignore localStorage failures */
  }
}

export function useOfflineSnapshot<T>(
  key: string | null,
  liveData: T | undefined
) {
  const [snapshot, setSnapshot] = useState<OfflineSnapshot<T> | null>(null)

  useEffect(() => {
    setSnapshot(readOfflineSnapshot<T>(key))
  }, [key])

  useEffect(() => {
    if (!key || liveData === undefined) {
      return
    }

    const nextSnapshot = writeOfflineSnapshot(key, liveData)
    if (nextSnapshot) {
      setSnapshot(nextSnapshot)
    }
  }, [key, liveData])

  return snapshot
}

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    const updateStatus = () => {
      setIsOnline(window.navigator.onLine)
    }

    updateStatus()
    window.addEventListener('online', updateStatus)
    window.addEventListener('offline', updateStatus)

    return () => {
      window.removeEventListener('online', updateStatus)
      window.removeEventListener('offline', updateStatus)
    }
  }, [])

  return isOnline
}

export function formatSnapshotAge(updatedAt: string | null | undefined) {
  if (!updatedAt) {
    return null
  }

  const timestamp = new Date(updatedAt).getTime()
  if (Number.isNaN(timestamp)) {
    return null
  }

  const diffMs = timestamp - Date.now()
  const diffMinutes = Math.round(diffMs / 60000)
  const formatter = new Intl.RelativeTimeFormat('fa', { numeric: 'auto' })

  if (Math.abs(diffMinutes) < 1) {
    return 'چند لحظه پیش'
  }

  if (Math.abs(diffMinutes) < 60) {
    return formatter.format(diffMinutes, 'minute')
  }

  const diffHours = Math.round(diffMinutes / 60)
  if (Math.abs(diffHours) < 24) {
    return formatter.format(diffHours, 'hour')
  }

  const diffDays = Math.round(diffHours / 24)
  return formatter.format(diffDays, 'day')
}
