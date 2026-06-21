import { isRedirect } from '@tanstack/react-router'
import { describe, expect, it } from 'vitest'

import { requireManagerSupportAccess } from '#/routes/_authed/support'

describe('Support route guard', () => {
  it('allows managers to open Support', () => {
    expect(() => requireManagerSupportAccess('manager')).not.toThrow()
  })

  it('redirects staff direct URLs to today', () => {
    try {
      requireManagerSupportAccess('staff')
      throw new Error('Expected the Support guard to redirect')
    } catch (error) {
      expect(isRedirect(error)).toBe(true)
      expect(error).toMatchObject({ options: { to: '/today' } })
    }
  })
})
