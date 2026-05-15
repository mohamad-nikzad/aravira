import { describe, expect, it } from 'vitest'
import {
  normalizeServiceAddonName,
  normalizeServiceAddonScopes,
  validateComboComponentReplacement,
  validateServiceAddonDeltas,
} from './service-queries'

describe('combo component replacement validation', () => {
  it('allows inactive combo drafts without components', () => {
    expect(() =>
      validateComboComponentReplacement({
        comboServiceId: 'combo-1',
        comboActive: false,
        componentServiceIds: [],
        foundComponents: [],
      })
    ).not.toThrow()
  })

  it('rejects active combos without components', () => {
    expect(() =>
      validateComboComponentReplacement({
        comboServiceId: 'combo-1',
        comboActive: true,
        componentServiceIds: [],
        foundComponents: [],
      })
    ).toThrow('active combo service must have at least one component')
  })

  it('rejects self references, duplicates, nested combos, and missing services', () => {
    expect(() =>
      validateComboComponentReplacement({
        comboServiceId: 'combo-1',
        comboActive: true,
        componentServiceIds: ['combo-1'],
        foundComponents: [{ id: 'combo-1', kind: 'standard' }],
      })
    ).toThrow('combo service cannot contain itself')

    expect(() =>
      validateComboComponentReplacement({
        comboServiceId: 'combo-1',
        comboActive: true,
        componentServiceIds: ['svc-1', 'svc-1'],
        foundComponents: [{ id: 'svc-1', kind: 'standard' }],
      })
    ).toThrow('combo components cannot contain duplicates')

    expect(() =>
      validateComboComponentReplacement({
        comboServiceId: 'combo-1',
        comboActive: true,
        componentServiceIds: ['svc-1', 'svc-2'],
        foundComponents: [{ id: 'svc-1', kind: 'standard' }],
      })
    ).toThrow('combo component service not found')

    expect(() =>
      validateComboComponentReplacement({
        comboServiceId: 'combo-1',
        comboActive: true,
        componentServiceIds: ['svc-1'],
        foundComponents: [{ id: 'svc-1', kind: 'combo' }],
      })
    ).toThrow('combo service cannot contain another combo service')
  })
})

describe('service add-on core validation', () => {
  it('requires non-negative deltas with at least one positive value', () => {
    expect(() => validateServiceAddonDeltas({ priceDelta: 0, durationDelta: 15 })).not.toThrow()
    expect(() => validateServiceAddonDeltas({ priceDelta: 50000, durationDelta: 0 })).not.toThrow()
    expect(() => validateServiceAddonDeltas({ priceDelta: 0, durationDelta: 0 })).toThrow(
      'service add-on price or duration delta must be positive'
    )
    expect(() => validateServiceAddonDeltas({ priceDelta: -1, durationDelta: 0 })).toThrow(
      'service add-on price and duration deltas must be non-negative'
    )
  })

  it('normalizes active add-on names for uniqueness checks', () => {
    expect(normalizeServiceAddonName('  فرنچ   ناخن  ')).toBe('فرنچ ناخن')
  })

  it('removes redundant child scopes covered by broader scopes', () => {
    const scopes = normalizeServiceAddonScopes(
      [
        { type: 'category', categoryId: 'category-1' },
        { type: 'family', familyId: 'family-1' },
        { type: 'service', serviceId: 'service-1' },
        { type: 'family', familyId: 'family-2' },
        { type: 'service', serviceId: 'service-2' },
        { type: 'service', serviceId: 'service-3' },
      ],
      {
        families: [
          { id: 'family-1', categoryId: 'category-1' },
          { id: 'family-2', categoryId: 'category-2' },
          { id: 'family-3', categoryId: 'category-3' },
        ],
        services: [
          { id: 'service-1', familyId: 'family-1' },
          { id: 'service-2', familyId: 'family-2' },
          { id: 'service-3', familyId: 'family-3' },
        ],
      }
    )

    expect(scopes).toEqual([
      { type: 'category', categoryId: 'category-1' },
      { type: 'family', familyId: 'family-2' },
      { type: 'service', serviceId: 'service-3' },
    ])
  })
})
