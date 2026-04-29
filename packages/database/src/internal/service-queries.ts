import { and, asc, eq, inArray } from 'drizzle-orm'
import type { Service } from '@repo/salon-core/types'
import { getDb } from '../client'
import { services } from '../schema'
import { rowToService } from './row-mappers'
import { isClientProvidedEntityId } from './client-queries'

export async function validateActiveServiceIds(ids: string[], salonId: string): Promise<boolean> {
  if (ids.length === 0) return true
  const db = getDb()
  const rows = await db
    .select({ id: services.id })
    .from(services)
    .where(and(eq(services.salonId, salonId), eq(services.active, true), inArray(services.id, ids)))
  return rows.length === ids.length
}

export async function getAllServices(salonId: string, includeInactive = false): Promise<Service[]> {
  const db = getDb()
  const rows = includeInactive
    ? await db
        .select()
        .from(services)
        .where(eq(services.salonId, salonId))
        .orderBy(asc(services.category), asc(services.name))
    : await db
        .select()
        .from(services)
        .where(and(eq(services.salonId, salonId), eq(services.active, true)))
        .orderBy(asc(services.category), asc(services.name))
  return rows.map(rowToService)
}

export async function getServiceById(id: string, salonId: string): Promise<Service | undefined> {
  const db = getDb()
  const rows = await db
    .select()
    .from(services)
    .where(and(eq(services.id, id), eq(services.salonId, salonId)))
    .limit(1)
  const row = rows[0]
  return row ? rowToService(row) : undefined
}

export async function createService(
  input: Omit<Service, 'id' | 'active'> & { active?: boolean; salonId: string; id?: string }
): Promise<Service> {
  const db = getDb()
  const values: typeof services.$inferInsert = {
    salonId: input.salonId,
    name: input.name,
    category: input.category,
    duration: input.duration,
    price: input.price,
    color: input.color,
    active: input.active ?? true,
  }
  if (isClientProvidedEntityId(input.id)) {
    values.id = input.id
  }
  const [row] = await db.insert(services).values(values).returning()
  return rowToService(row)
}

export async function updateService(
  id: string,
  salonId: string,
  data: Partial<Omit<Service, 'id'>>
): Promise<Service | undefined> {
  const db = getDb()
  const [row] = await db
    .update(services)
    .set({
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.category !== undefined ? { category: data.category } : {}),
      ...(data.duration !== undefined ? { duration: data.duration } : {}),
      ...(data.price !== undefined ? { price: data.price } : {}),
      ...(data.color !== undefined ? { color: data.color } : {}),
      ...(data.active !== undefined ? { active: data.active } : {}),
    })
    .where(and(eq(services.id, id), eq(services.salonId, salonId)))
    .returning()
  return row ? rowToService(row) : undefined
}
