import { describe, it, expect } from 'vitest'

import {
  offlineProjectionMeta,
  selectOfflineProjectionPhase,
  toOfflineProjectionDisplay,
} from './offline-projection'
import type { OfflineProjectionResult } from './offline-projection'

function nullToUndefined<T>(snapshot: T | null): T | undefined {
  if (snapshot === null) return undefined
  return snapshot
}

describe('selectOfflineProjectionPhase', () => {
  it('shows live data without loading when disabled', () => {
    expect(
      selectOfflineProjectionPhase({
        enabled: false,
        hasClient: true,
        isOnline: true,
        loaded: false,
      }),
    ).toEqual({ phase: 'live', idbLoading: false })
  })

  it('shows live data without loading when the client is absent', () => {
    expect(
      selectOfflineProjectionPhase({
        enabled: true,
        hasClient: false,
        isOnline: false,
        loaded: false,
      }),
    ).toEqual({ phase: 'live', idbLoading: false })
  })

  it('shows live data while the snapshot hydrates online', () => {
    expect(
      selectOfflineProjectionPhase({
        enabled: true,
        hasClient: true,
        isOnline: true,
        loaded: false,
      }),
    ).toEqual({ phase: 'live', idbLoading: true })
  })

  it('shows nothing while the snapshot hydrates offline', () => {
    expect(
      selectOfflineProjectionPhase({
        enabled: true,
        hasClient: true,
        isOnline: false,
        loaded: false,
      }),
    ).toEqual({ phase: 'empty', idbLoading: true })
  })

  it('shows the snapshot once loaded, regardless of connectivity', () => {
    expect(
      selectOfflineProjectionPhase({
        enabled: true,
        hasClient: true,
        isOnline: true,
        loaded: true,
      }),
    ).toEqual({ phase: 'snapshot', idbLoading: false })
    expect(
      selectOfflineProjectionPhase({
        enabled: true,
        hasClient: true,
        isOnline: false,
        loaded: true,
      }),
    ).toEqual({ phase: 'snapshot', idbLoading: false })
  })
})

describe('toOfflineProjectionDisplay', () => {
  const base = {
    snapshotUpdatedAt: '2026-01-01T00:00:00.000Z',
    idbLoading: false,
  } satisfies Partial<OfflineProjectionResult<{ count: number }>>

  it('uses live data in the live phase', () => {
    expect(
      toOfflineProjectionDisplay(
        { ...base, phase: 'live', snapshot: null },
        {
          live: { count: 3 },
          fromSnapshot: nullToUndefined,
        },
      ),
    ).toEqual({
      phase: 'live',
      value: { count: 3 },
      snapshotUpdatedAt: null,
      hasSnapshot: false,
      idbLoading: false,
    })
  })

  it('clears value in the empty phase', () => {
    expect(
      toOfflineProjectionDisplay(
        { ...base, phase: 'empty', snapshot: null, idbLoading: true },
        {
          live: { count: 3 },
          fromSnapshot: nullToUndefined,
        },
      ),
    ).toEqual({
      phase: 'empty',
      value: undefined,
      snapshotUpdatedAt: null,
      hasSnapshot: false,
      idbLoading: true,
    })
  })

  it('maps snapshot data and metadata in the snapshot phase', () => {
    expect(
      toOfflineProjectionDisplay(
        {
          ...base,
          phase: 'snapshot',
          snapshot: { count: 5 },
        },
        {
          live: { count: 3 },
          fromSnapshot: nullToUndefined,
        },
      ),
    ).toEqual({
      phase: 'snapshot',
      value: { count: 5 },
      snapshotUpdatedAt: '2026-01-01T00:00:00.000Z',
      hasSnapshot: true,
      idbLoading: false,
    })
  })

  it('honours a custom hasSnapshot predicate', () => {
    expect(
      toOfflineProjectionDisplay(
        {
          ...base,
          phase: 'snapshot',
          snapshot: null,
        },
        {
          live: undefined,
          fromSnapshot: nullToUndefined,
          hasSnapshot: () => false,
        },
      ),
    ).toMatchObject({
      phase: 'snapshot',
      value: undefined,
      hasSnapshot: false,
    })
  })
})

describe('offlineProjectionMeta', () => {
  it('exposes snapshot timestamp only in the snapshot phase', () => {
    expect(
      offlineProjectionMeta(
        {
          phase: 'live',
          idbLoading: true,
          snapshotUpdatedAt: 'ignored',
        },
        false,
      ),
    ).toEqual({
      phase: 'live',
      idbLoading: true,
      snapshotUpdatedAt: null,
      hasSnapshot: false,
    })

    expect(
      offlineProjectionMeta(
        {
          phase: 'snapshot',
          idbLoading: false,
          snapshotUpdatedAt: '2026-06-02T12:00:00.000Z',
        },
        true,
      ),
    ).toEqual({
      phase: 'snapshot',
      idbLoading: false,
      snapshotUpdatedAt: '2026-06-02T12:00:00.000Z',
      hasSnapshot: true,
    })
  })
})
