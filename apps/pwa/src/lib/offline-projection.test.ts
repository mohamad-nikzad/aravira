import { describe, it, expect } from 'vitest'

import { selectOfflineProjectionPhase } from './offline-projection'

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
