import { eq, and, or, gte, lte, asc, inArray } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { getDb } from '@/db'
import {
  users,
  services,
  clients,
  appointments,
  businessSettings,
  pushSubscriptions,
  staffServices,
} from '@/db/schema'
import type { User, Service, Client, Appointment, BusinessHours } from './types'
import { normalizePhone } from './phone'
import { detectScheduleOverlaps } from './appointment-conflict'

function rowToUser(row: typeof users.$inferSelect): User {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    role: row.role,
    color: row.color,
    createdAt: row.createdAt,
  }
}

function rowToService(row: typeof services.$inferSelect): Service {
  return {
    id: row.id,
    name: row.name,
    category: row.category as Service['category'],
    duration: row.duration,
    price: row.price,
    color: row.color,
    active: row.active,
  }
}

function rowToClient(row: typeof clients.$inferSelect): Client {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    notes: row.notes ?? undefined,
    createdAt: row.createdAt,
  }
}

function rowToAppointment(row: typeof appointments.$inferSelect): Appointment {
  return {
    id: row.id,
    clientId: row.clientId,
    staffId: row.staffId,
    serviceId: row.serviceId,
    date: row.date,
    startTime: row.startTime,
    endTime: row.endTime,
    status: row.status as Appointment['status'],
    notes: row.notes ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export async function getUserByPhone(phone: string): Promise<User | undefined> {
  const db = getDb()
  const normalized = normalizePhone(phone)
  const rows = await db
    .select()
    .from(users)
    .where(and(eq(users.phone, normalized), eq(users.active, true)))
    .limit(1)
  const row = rows[0]
  return row ? rowToUser(row) : undefined
}

export async function getUserWithPasswordByPhone(
  phone: string
): Promise<(User & { passwordHash: string }) | undefined> {
  const db = getDb()
  const normalized = normalizePhone(phone)
  const rows = await db
    .select()
    .from(users)
    .where(and(eq(users.phone, normalized), eq(users.active, true)))
    .limit(1)
  const row = rows[0]
  if (!row) return undefined
  return { ...rowToUser(row), passwordHash: row.passwordHash }
}

export async function getUserById(id: string): Promise<User | undefined> {
  const db = getDb()
  const rows = await db
    .select()
    .from(users)
    .where(and(eq(users.id, id), eq(users.active, true)))
    .limit(1)
  const row = rows[0]
  return row ? rowToUser(row) : undefined
}

export async function getAllStaff(): Promise<User[]> {
  const db = getDb()
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.active, true))
    .orderBy(asc(users.name))
  if (rows.length === 0) return []

  const ids = rows.map((r) => r.id)
  const links = await db
    .select({
      staffUserId: staffServices.staffUserId,
      serviceId: staffServices.serviceId,
    })
    .from(staffServices)
    .where(inArray(staffServices.staffUserId, ids))

  const byUser = new Map<string, string[]>()
  for (const row of links) {
    const cur = byUser.get(row.staffUserId) ?? []
    cur.push(row.serviceId)
    byUser.set(row.staffUserId, cur)
  }

  return rows.map((row) => {
    const base = rowToUser(row)
    const assigned = byUser.get(row.id)
    if (assigned === undefined) {
      return { ...base, serviceIds: null as string[] | null }
    }
    const unique = [...new Set(assigned)].sort()
    return { ...base, serviceIds: unique }
  })
}

export async function staffMayPerformService(staffId: string, serviceId: string): Promise<boolean> {
  const db = getDb()
  const rows = await db
    .select({ serviceId: staffServices.serviceId })
    .from(staffServices)
    .where(eq(staffServices.staffUserId, staffId))
  if (rows.length === 0) return true
  return rows.some((r) => r.serviceId === serviceId)
}

export async function getUserWithServiceIds(id: string): Promise<User | undefined> {
  const base = await getUserById(id)
  if (!base) return undefined
  const db = getDb()
  const links = await db
    .select({ serviceId: staffServices.serviceId })
    .from(staffServices)
    .where(eq(staffServices.staffUserId, id))
  if (links.length === 0) {
    return { ...base, serviceIds: null as string[] | null }
  }
  const unique = [...new Set(links.map((r) => r.serviceId))].sort()
  return { ...base, serviceIds: unique }
}

/** `null` or empty after delete = unrestricted (همه خدمات فعال). */
export async function setStaffServiceIds(
  staffUserId: string,
  serviceIds: string[] | null
): Promise<void> {
  const db = getDb()
  await db.transaction(async (tx) => {
    await tx.delete(staffServices).where(eq(staffServices.staffUserId, staffUserId))
    if (serviceIds != null && serviceIds.length > 0) {
      await tx.insert(staffServices).values(
        serviceIds.map((serviceId) => ({
          staffUserId,
          serviceId,
        }))
      )
    }
  })
}

export async function validateActiveServiceIds(ids: string[]): Promise<boolean> {
  if (ids.length === 0) return true
  const db = getDb()
  const rows = await db
    .select({ id: services.id })
    .from(services)
    .where(and(eq(services.active, true), inArray(services.id, ids)))
  return rows.length === ids.length
}

export async function createUser(
  input: Omit<User, 'id' | 'createdAt'> & { password: string }
): Promise<User> {
  const db = getDb()
  const normalized = normalizePhone(input.phone)
  const hashedPassword = bcrypt.hashSync(input.password, 10)
  const [row] = await db
    .insert(users)
    .values({
      name: input.name,
      phone: normalized,
      passwordHash: hashedPassword,
      role: input.role,
      color: input.color,
      active: true,
    })
    .returning()
  return rowToUser(row)
}

export async function getAllServices(includeInactive = false): Promise<Service[]> {
  const db = getDb()
  const rows = includeInactive
    ? await db.select().from(services).orderBy(asc(services.category), asc(services.name))
    : await db
        .select()
        .from(services)
        .where(eq(services.active, true))
        .orderBy(asc(services.category), asc(services.name))
  return rows.map(rowToService)
}

export async function getServiceById(id: string): Promise<Service | undefined> {
  const db = getDb()
  const rows = await db.select().from(services).where(eq(services.id, id)).limit(1)
  const row = rows[0]
  return row ? rowToService(row) : undefined
}

export async function createService(
  input: Omit<Service, 'id' | 'active'> & { active?: boolean }
): Promise<Service> {
  const db = getDb()
  const [row] = await db
    .insert(services)
    .values({
      name: input.name,
      category: input.category,
      duration: input.duration,
      price: input.price,
      color: input.color,
      active: input.active ?? true,
    })
    .returning()
  return rowToService(row)
}

export async function updateService(
  id: string,
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
    .where(eq(services.id, id))
    .returning()
  return row ? rowToService(row) : undefined
}

export async function getAllClients(): Promise<Client[]> {
  const db = getDb()
  const rows = await db.select().from(clients).orderBy(asc(clients.name))
  return rows.map(rowToClient)
}

export async function getClientById(id: string): Promise<Client | undefined> {
  const db = getDb()
  const rows = await db.select().from(clients).where(eq(clients.id, id)).limit(1)
  const row = rows[0]
  return row ? rowToClient(row) : undefined
}

export async function createClient(input: Omit<Client, 'id' | 'createdAt'>): Promise<Client> {
  const db = getDb()
  const normalized = normalizePhone(input.phone)
  const [row] = await db
    .insert(clients)
    .values({
      name: input.name,
      phone: normalized,
      notes: input.notes,
    })
    .returning()
  return rowToClient(row)
}

export async function updateClient(
  id: string,
  data: Partial<Omit<Client, 'id' | 'createdAt'>>
): Promise<Client | undefined> {
  const db = getDb()
  const patch: Partial<typeof clients.$inferInsert> = {}
  if (data.name !== undefined) patch.name = data.name
  if (data.phone !== undefined) patch.phone = normalizePhone(data.phone)
  if (data.notes !== undefined) patch.notes = data.notes

  const [row] = await db.update(clients).set(patch).where(eq(clients.id, id)).returning()
  return row ? rowToClient(row) : undefined
}

export async function getAppointmentsByDateRange(
  startDate: string,
  endDate: string,
  staffIdFilter?: string
): Promise<Appointment[]> {
  const db = getDb()
  const conditions = [
    gte(appointments.date, startDate),
    lte(appointments.date, endDate),
  ]
  if (staffIdFilter) {
    conditions.push(eq(appointments.staffId, staffIdFilter))
  }
  const rows = await db
    .select()
    .from(appointments)
    .where(and(...conditions))
    .orderBy(asc(appointments.date), asc(appointments.startTime))
  return rows.map(rowToAppointment)
}

export async function getAppointmentById(id: string): Promise<Appointment | undefined> {
  const db = getDb()
  const rows = await db
    .select()
    .from(appointments)
    .where(eq(appointments.id, id))
    .limit(1)
  const row = rows[0]
  return row ? rowToAppointment(row) : undefined
}

export async function createAppointment(
  apt: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>,
  createdByUserId?: string
): Promise<Appointment> {
  const db = getDb()
  const [row] = await db
    .insert(appointments)
    .values({
      clientId: apt.clientId,
      staffId: apt.staffId,
      serviceId: apt.serviceId,
      date: apt.date,
      startTime: apt.startTime,
      endTime: apt.endTime,
      status: apt.status,
      notes: apt.notes,
      createdByUserId: createdByUserId ?? null,
    })
    .returning()
  return rowToAppointment(row)
}

export async function updateAppointment(
  id: string,
  data: Partial<Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<Appointment | undefined> {
  const db = getDb()
  const patch: Partial<typeof appointments.$inferInsert> = {
    updatedAt: new Date(),
  }
  if (data.clientId !== undefined) patch.clientId = data.clientId
  if (data.staffId !== undefined) patch.staffId = data.staffId
  if (data.serviceId !== undefined) patch.serviceId = data.serviceId
  if (data.date !== undefined) patch.date = data.date
  if (data.startTime !== undefined) patch.startTime = data.startTime
  if (data.endTime !== undefined) patch.endTime = data.endTime
  if (data.status !== undefined) patch.status = data.status
  if (data.notes !== undefined) patch.notes = data.notes

  const [row] = await db
    .update(appointments)
    .set(patch)
    .where(eq(appointments.id, id))
    .returning()
  return row ? rowToAppointment(row) : undefined
}

export async function deleteAppointment(id: string): Promise<boolean> {
  const db = getDb()
  const deleted = await db.delete(appointments).where(eq(appointments.id, id)).returning()
  return deleted.length > 0
}

export async function getScheduleOverlapFlags(
  staffId: string,
  clientId: string,
  date: string,
  startTime: string,
  endTime: string,
  excludeId?: string
) {
  const db = getDb()
  const rows = await db
    .select({
      id: appointments.id,
      staffId: appointments.staffId,
      clientId: appointments.clientId,
      date: appointments.date,
      startTime: appointments.startTime,
      endTime: appointments.endTime,
      status: appointments.status,
    })
    .from(appointments)
    .where(
      and(
        eq(appointments.date, date),
        or(eq(appointments.staffId, staffId), eq(appointments.clientId, clientId))
      )
    )

  return detectScheduleOverlaps(rows, {
    staffId,
    clientId,
    date,
    startTime,
    endTime,
    excludeId,
  })
}

const defaultBusinessHours: BusinessHours = {
  workingStart: '09:00',
  workingEnd: '19:00',
  slotDurationMinutes: 30,
}

export async function getBusinessSettings(): Promise<BusinessHours> {
  const db = getDb()
  const rows = await db
    .select()
    .from(businessSettings)
    .where(eq(businessSettings.id, 1))
    .limit(1)
  const row = rows[0]
  if (!row) return defaultBusinessHours
  return {
    workingStart: row.workingStart,
    workingEnd: row.workingEnd,
    slotDurationMinutes: row.slotDurationMinutes,
  }
}

export type PushSubscriptionKeys = {
  endpoint: string
  p256dh: string
  auth: string
}

export async function upsertPushSubscription(
  userId: string,
  keys: PushSubscriptionKeys
): Promise<void> {
  const db = getDb()
  await db
    .insert(pushSubscriptions)
    .values({
      userId,
      endpoint: keys.endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: {
        userId,
        p256dh: keys.p256dh,
        auth: keys.auth,
        createdAt: new Date(),
      },
    })
}

export async function getPushSubscriptionsForUser(
  userId: string
): Promise<PushSubscriptionKeys[]> {
  const db = getDb()
  const rows = await db
    .select({
      endpoint: pushSubscriptions.endpoint,
      p256dh: pushSubscriptions.p256dh,
      auth: pushSubscriptions.auth,
    })
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId))
  return rows
}

export async function deletePushSubscriptionByEndpoint(endpoint: string): Promise<void> {
  const db = getDb()
  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint))
}

export async function deletePushSubscriptionForUser(
  userId: string,
  endpoint: string
): Promise<boolean> {
  const db = getDb()
  const removed = await db
    .delete(pushSubscriptions)
    .where(
      and(eq(pushSubscriptions.userId, userId), eq(pushSubscriptions.endpoint, endpoint))
    )
    .returning({ id: pushSubscriptions.id })
  return removed.length > 0
}

export async function updateBusinessSettings(
  data: Partial<BusinessHours>
): Promise<BusinessHours> {
  const db = getDb()
  const current = await getBusinessSettings()
  const next = { ...current, ...data }
  await db
    .insert(businessSettings)
    .values({
      id: 1,
      workingStart: next.workingStart,
      workingEnd: next.workingEnd,
      slotDurationMinutes: next.slotDurationMinutes,
    })
    .onConflictDoUpdate({
      target: businessSettings.id,
      set: {
        workingStart: next.workingStart,
        workingEnd: next.workingEnd,
        slotDurationMinutes: next.slotDurationMinutes,
      },
    })
  return next
}
