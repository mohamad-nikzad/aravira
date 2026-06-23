import { describe, expect, it } from 'vitest'

import { isPublicSalonStatus } from './public-queries'

describe('public salon status gate', () => {
  it('keeps Setup Salons out of public salon, availability, and AppointmentRequest flows', () => {
    expect(isPublicSalonStatus('setup')).toBe(false)
    expect(isPublicSalonStatus('suspended')).toBe(false)
    expect(isPublicSalonStatus('archived')).toBe(false)
    expect(isPublicSalonStatus('active')).toBe(true)
  })
})
