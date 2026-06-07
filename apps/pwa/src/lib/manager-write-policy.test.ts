import { describe, it, expect } from 'vitest'

import {
  MANAGER_WRITE_OPERATIONS,
  MANAGER_WRITE_POLICIES,
  assertOnlineForWrite,
  getWritePolicy,
  OFFLINE_WRITE_BLOCKED_MESSAGE,
  writePolicyQueuesOffline,
  writePolicyRequiresOnline,
  writePolicyUsesDataClient,
} from './manager-write-policy'

describe('manager-write-policy', () => {
  it('defines a policy for every known operation', () => {
    for (const operation of MANAGER_WRITE_OPERATIONS) {
      expect(MANAGER_WRITE_POLICIES[operation]).toBeDefined()
    }
  })

  it('keeps appointment request approve/reject online-only (ADR)', () => {
    expect(getWritePolicy('appointmentRequest.approve')).toBe('require-online')
    expect(getWritePolicy('appointmentRequest.reject')).toBe('require-online')
    expect(writePolicyRequiresOnline('appointmentRequest.approve')).toBe(true)
    expect(writePolicyQueuesOffline('appointmentRequest.approve')).toBe(false)
  })

  it('assertOnlineForWrite throws when require-online and offline', () => {
    expect(() =>
      assertOnlineForWrite('appointmentRequest.approve', false),
    ).toThrow(OFFLINE_WRITE_BLOCKED_MESSAGE)
  })

  it('does not use data-client for remaining operations', () => {
    for (const operation of MANAGER_WRITE_OPERATIONS) {
      expect(writePolicyUsesDataClient(operation)).toBe(false)
    }
  })
})
