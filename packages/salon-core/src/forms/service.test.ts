import { describe, expect, it } from 'vitest'

import { serviceFormSchema } from './service'

describe('serviceFormSchema', () => {
  it('trims name and normalizes numeric Persian-digit strings', () => {
    const result = serviceFormSchema.parse({
      name: '  کوتاهی مو  ',
      category: 'hair',
      duration: '۶۰',
      price: '۲۵۰۰۰۰',
      color: 'mint',
      active: true,
    })

    expect(result).toEqual({
      name: 'کوتاهی مو',
      category: 'hair',
      duration: 60,
      price: 250000,
      color: 'mint',
      active: true,
      kind: 'standard',
    })
  })

  it('defaults active to true and legacy color ids to calendar color ids', () => {
    const result = serviceFormSchema.parse({
      name: 'مانیکور',
      category: 'nails',
      duration: 45,
      price: 0,
      color: 'bg-staff-2',
    })

    expect(result.active).toBe(true)
    expect(result.color).toBe('violet')
  })

  it('rejects empty name', () => {
    const result = serviceFormSchema.safeParse({
      name: '   ',
      category: 'hair',
      duration: 45,
      price: 0,
      color: 'rose',
    })

    expect(result.success).toBe(false)
  })

  it('rejects invalid category', () => {
    const result = serviceFormSchema.safeParse({
      name: 'x',
      category: 'massage',
      duration: 45,
      price: 0,
      color: 'rose',
    })

    expect(result.success).toBe(false)
  })

  it('rejects invalid duration and negative price', () => {
    expect(
      serviceFormSchema.safeParse({
        name: 'x',
        category: 'hair',
        duration: 0,
        price: 100,
        color: 'rose',
      }).success,
    ).toBe(false)

    expect(
      serviceFormSchema.safeParse({
        name: 'x',
        category: 'hair',
        duration: 45,
        price: -1,
        color: 'rose',
      }).success,
    ).toBe(false)
  })
})
