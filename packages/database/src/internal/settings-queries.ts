import { eq } from 'drizzle-orm'
import type { BusinessHours } from '@repo/salon-core/types'
import { getDb } from '../client'
import { businessSettings } from '../schema'

const defaultBusinessHours: BusinessHours = {
  workingStart: '09:00',
  workingEnd: '19:00',
  slotDurationMinutes: 30,
}

export async function getBusinessSettings(salonId: string): Promise<BusinessHours> {
  const db = getDb()
  const rows = await db
    .select()
    .from(businessSettings)
    .where(eq(businessSettings.salonId, salonId))
    .limit(1)
  const row = rows[0]
  if (!row) return defaultBusinessHours
  return {
    workingStart: row.workingStart,
    workingEnd: row.workingEnd,
    slotDurationMinutes: row.slotDurationMinutes,
  }
}

export async function updateBusinessSettings(
  salonId: string,
  data: Partial<BusinessHours>
): Promise<BusinessHours> {
  const db = getDb()
  const current = await getBusinessSettings(salonId)
  const next = { ...current, ...data }
  await db
    .insert(businessSettings)
    .values({
      salonId,
      workingStart: next.workingStart,
      workingEnd: next.workingEnd,
      slotDurationMinutes: next.slotDurationMinutes,
    })
    .onConflictDoUpdate({
      target: businessSettings.salonId,
      set: {
        workingStart: next.workingStart,
        workingEnd: next.workingEnd,
        slotDurationMinutes: next.slotDurationMinutes,
      },
    })
  return next
}
