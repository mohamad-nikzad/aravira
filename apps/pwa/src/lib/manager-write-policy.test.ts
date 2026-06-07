import { describe, it, expect } from 'vitest'

import {
  MANAGER_WRITE_OPERATIONS,
  MANAGER_WRITE_POLICIES,
  writePolicyUsesDataClient,
} from './manager-write-policy'

describe('manager-write-policy', () => {
  it('has no remaining write operations after migration slices', () => {
    expect(MANAGER_WRITE_OPERATIONS).toEqual([])
    expect(MANAGER_WRITE_POLICIES).toEqual({})
  })

  it('does not use data-client for remaining operations', () => {
    for (const operation of MANAGER_WRITE_OPERATIONS) {
      expect(writePolicyUsesDataClient(operation)).toBe(false)
    }
  })
})
