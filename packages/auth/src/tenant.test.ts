import { describe, expect, it } from 'vitest'

import { hasTenantPermission } from './tenant'

describe('tenant permissions', () => {
  it.each(['view_support_tickets', 'manage_support_tickets'] as const)(
    'allows managers to use %s',
    (permission) => {
      expect(hasTenantPermission('manager', permission)).toBe(true)
    },
  )

  it.each(['view_support_tickets', 'manage_support_tickets'] as const)(
    'denies staff access to %s',
    (permission) => {
      expect(hasTenantPermission('staff', permission)).toBe(false)
    },
  )
})
