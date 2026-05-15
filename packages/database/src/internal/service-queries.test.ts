import { describe, expect, it } from 'vitest'
import { validateComboComponentReplacement } from './service-queries'

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
