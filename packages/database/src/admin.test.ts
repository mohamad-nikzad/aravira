import { beforeEach, describe, expect, it, vi } from 'vitest'

const inserted = vi.hoisted(
  () => [] as Array<{ table: unknown; values: Record<string, unknown> }>,
)

vi.mock('./client', () => ({
  getDb: () => ({
    transaction: async (run: (tx: unknown) => unknown) =>
      run({
        insert: (table: unknown) => ({
          values: (values: Record<string, unknown>) => {
            inserted.push({ table, values })
            return {
              returning: async () => [
                {
                  id: values.id,
                  name: values.name,
                  slug: values.slug,
                  createdAt: new Date('2026-06-23T00:00:00.000Z'),
                },
              ],
            }
          },
        }),
      }),
  }),
}))

import { createSetupSalon } from './admin'
import {
  businessSettings,
  member,
  organization,
  salonOnboarding,
  salonProfile,
  salonPublicSettings,
  user,
} from './schema'

describe('createSetupSalon', () => {
  beforeEach(() => inserted.splice(0))

  it('creates the baseline sidecars without a user or membership', async () => {
    const salon = await createSetupSalon({
      name: 'Aftab',
      intendedOwnerPhone: '09121234567',
    })

    expect(salon).toMatchObject({
      name: 'Aftab',
      status: 'setup',
      intendedOwnerPhone: '09121234567',
      publicEnabled: false,
      appointmentRequestsEnabled: false,
    })
    expect(inserted.map((entry) => entry.table)).toEqual([
      organization,
      salonProfile,
      businessSettings,
      salonPublicSettings,
      salonOnboarding,
    ])
    expect(inserted).toContainEqual({
      table: salonProfile,
      values: expect.objectContaining({
        status: 'setup',
        intendedOwnerPhone: '09121234567',
      }),
    })
    expect(inserted).toContainEqual({
      table: salonPublicSettings,
      values: expect.objectContaining({
        enabled: false,
        appointmentRequestsEnabled: false,
      }),
    })
    expect(inserted.some((entry) => entry.table === user)).toBe(false)
    expect(inserted.some((entry) => entry.table === member)).toBe(false)
  })
})
