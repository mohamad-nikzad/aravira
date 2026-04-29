import { eq, and, or, gte, lte, lt, asc, desc, inArray, count, sql } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { getDb } from '../client'
import {
  users,
  salons,
  services,
  clients,
  clientTags,
  clientFollowUps,
  appointments,
  businessSettings,
  pushSubscriptions,
  staffServices,
  staffSchedules,
  salonOnboarding,
} from '../schema'
import type {
  User,
  Service,
  Client,
  ClientTag,
  ClientFollowUp,
  Appointment,
  AppointmentWithDetails,
  BusinessHours,
  StaffSchedule,
  ClientSummary,
  TodayData,
  TodayAttentionItem,
  RetentionItem,
  FollowUpReason,
  FollowUpStatus,
} from '@repo/salon-core/types'
import { normalizePhone } from '@repo/salon-core/phone'
import { addDaysYmd, salonCurrentHm, salonHmAfterMinutes, salonTodayYmd } from '@repo/salon-core/salon-local-time'
import { detectScheduleOverlaps } from '@repo/salon-core/appointment-conflict'
import {
  dayOfWeekFromDate,
  validateStaffAvailability,
  type StaffAvailabilityResult,
} from '@repo/salon-core/staff-availability'
import { durationMinutesFromRange } from '@repo/salon-core/appointment-time'

function rowToUser(row: typeof users.$inferSelect): User {
  return {
    id: row.id,
    salonId: row.salonId,
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

function rowToClientTag(row: typeof clientTags.$inferSelect): ClientTag {
  return {
    id: row.id,
    salonId: row.salonId,
    clientId: row.clientId,
    label: row.label,
    color: row.color,
    createdAt: row.createdAt,
  }
}

function rowToClientFollowUp(row: typeof clientFollowUps.$inferSelect): ClientFollowUp {
  return {
    id: row.id,
    salonId: row.salonId,
    clientId: row.clientId,
    reason: row.reason,
    status: row.status,
    dueDate: row.dueDate,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    reviewedAt: row.reviewedAt,
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

function rowToStaffSchedule(row: typeof staffSchedules.$inferSelect): StaffSchedule {
  return {
    id: row.id,
    salonId: row.salonId,
    staffId: row.staffId,
    dayOfWeek: row.dayOfWeek,
    workingStart: row.workingStart,
    workingEnd: row.workingEnd,
    active: row.active,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

function attachDetails(row: {
  appointment: typeof appointments.$inferSelect
  client: typeof clients.$inferSelect
  staff: typeof users.$inferSelect
  service: typeof services.$inferSelect
}): AppointmentWithDetails {
  return {
    ...rowToAppointment(row.appointment),
    client: rowToClient(row.client),
    staff: rowToUser(row.staff),
    service: rowToService(row.service),
  }
}

function todayIsoDate() {
  return salonTodayYmd()
}

function monthBounds(date = new Date()) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0))
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  }
}

function mapTagsByClient(rows: ClientTag[]): Map<string, ClientTag[]> {
  const byClient = new Map<string, ClientTag[]>()
  for (const tag of rows) {
    const list = byClient.get(tag.clientId) ?? []
    list.push(tag)
    byClient.set(tag.clientId, list)
  }
  return byClient
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

export async function getAllStaff(salonId: string): Promise<User[]> {
  const db = getDb()
  const rows = await db
    .select()
    .from(users)
    .where(and(eq(users.salonId, salonId), eq(users.active, true)))
    .orderBy(asc(users.name))
  if (rows.length === 0) return []

  const ids = rows.map((r) => r.id)
  const links = await db
    .select({
      staffUserId: staffServices.staffUserId,
      serviceId: staffServices.serviceId,
    })
    .from(staffServices)
    .where(and(eq(staffServices.salonId, salonId), inArray(staffServices.staffUserId, ids)))

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

export async function staffMayPerformService(
  staffId: string,
  serviceId: string,
  salonId: string
): Promise<boolean> {
  const db = getDb()
  const rows = await db
    .select({ serviceId: staffServices.serviceId })
    .from(staffServices)
    .where(and(eq(staffServices.salonId, salonId), eq(staffServices.staffUserId, staffId)))
  if (rows.length === 0) return true
  return rows.some((r) => r.serviceId === serviceId)
}

export async function getUserWithServiceIds(
  id: string,
  salonId: string
): Promise<User | undefined> {
  const base = await getUserById(id)
  if (!base || base.salonId !== salonId) return undefined
  const db = getDb()
  const links = await db
    .select({ serviceId: staffServices.serviceId })
    .from(staffServices)
    .where(and(eq(staffServices.salonId, salonId), eq(staffServices.staffUserId, id)))
  if (links.length === 0) {
    return { ...base, serviceIds: null as string[] | null }
  }
  const unique = [...new Set(links.map((r) => r.serviceId))].sort()
  return { ...base, serviceIds: unique }
}

/** `null` or empty after delete = unrestricted (همه خدمات فعال). */
export async function setStaffServiceIds(
  staffUserId: string,
  serviceIds: string[] | null,
  salonId: string
): Promise<void> {
  const db = getDb()
  await db.transaction(async (tx) => {
    await tx
      .delete(staffServices)
      .where(and(eq(staffServices.salonId, salonId), eq(staffServices.staffUserId, staffUserId)))
    if (serviceIds != null && serviceIds.length > 0) {
      await tx.insert(staffServices).values(
        serviceIds.map((serviceId) => ({
          staffUserId,
          serviceId,
          salonId,
        }))
      )
    }
  })
}

export async function validateActiveServiceIds(ids: string[], salonId: string): Promise<boolean> {
  if (ids.length === 0) return true
  const db = getDb()
  const rows = await db
    .select({ id: services.id })
    .from(services)
    .where(and(eq(services.salonId, salonId), eq(services.active, true), inArray(services.id, ids)))
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
      salonId: input.salonId,
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

export async function getAllClients(salonId: string): Promise<Client[]> {
  const db = getDb()
  const rows = await db
    .select()
    .from(clients)
    .where(eq(clients.salonId, salonId))
    .orderBy(asc(clients.name))
  if (rows.length === 0) return []

  const tagRows = await db
    .select()
    .from(clientTags)
    .where(and(eq(clientTags.salonId, salonId), inArray(clientTags.clientId, rows.map((r) => r.id))))
    .orderBy(asc(clientTags.label))
  const tagsByClient = mapTagsByClient(tagRows.map(rowToClientTag))

  return rows.map((row) => ({
    ...rowToClient(row),
    tags: tagsByClient.get(row.id) ?? [],
  }))
}

export async function getClientById(id: string, salonId: string): Promise<Client | undefined> {
  const db = getDb()
  const rows = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, id), eq(clients.salonId, salonId)))
    .limit(1)
  const row = rows[0]
  return row ? rowToClient(row) : undefined
}

/** Accepts caller-provided UUIDs for offline-first clients (must be a valid UUID v4 string). */
export function isClientProvidedEntityId(id: string | undefined): id is string {
  return (
    typeof id === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
  )
}

export async function createClient(
  input: Omit<Client, 'id' | 'createdAt'> & { salonId: string; id?: string }
): Promise<Client> {
  const db = getDb()
  const normalized = normalizePhone(input.phone)
  const values: typeof clients.$inferInsert = {
    salonId: input.salonId,
    name: input.name,
    phone: normalized,
    notes: input.notes,
  }
  if (isClientProvidedEntityId(input.id)) {
    values.id = input.id
  }
  const [row] = await db.insert(clients).values(values).returning()
  return rowToClient(row)
}

export async function updateClient(
  id: string,
  salonId: string,
  data: Partial<Omit<Client, 'id' | 'createdAt'>>
): Promise<Client | undefined> {
  const db = getDb()
  const patch: Partial<typeof clients.$inferInsert> = {}
  if (data.name !== undefined) patch.name = data.name
  if (data.phone !== undefined) patch.phone = normalizePhone(data.phone)
  if (data.notes !== undefined) patch.notes = data.notes

  const [row] = await db
    .update(clients)
    .set(patch)
    .where(and(eq(clients.id, id), eq(clients.salonId, salonId)))
    .returning()
  return row ? rowToClient(row) : undefined
}

const tagColors: Record<string, string> = {
  VIP: 'bg-amber-100 text-amber-800 border-amber-200',
  'حساسیت': 'bg-rose-100 text-rose-800 border-rose-200',
  'رنگ خاص': 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200',
  'نیاز به پیگیری': 'bg-cyan-100 text-cyan-800 border-cyan-200',
  'بدقول': 'bg-orange-100 text-orange-800 border-orange-200',
}

export async function getClientTags(clientId: string, salonId: string): Promise<ClientTag[]> {
  const db = getDb()
  const rows = await db
    .select()
    .from(clientTags)
    .where(and(eq(clientTags.salonId, salonId), eq(clientTags.clientId, clientId)))
    .orderBy(asc(clientTags.label))
  return rows.map(rowToClientTag)
}

export async function getClientTagsForClients(
  clientIds: string[],
  salonId: string
): Promise<Map<string, ClientTag[]>> {
  if (clientIds.length === 0) return new Map()
  const db = getDb()
  const rows = await db
    .select()
    .from(clientTags)
    .where(and(eq(clientTags.salonId, salonId), inArray(clientTags.clientId, clientIds)))
    .orderBy(asc(clientTags.label))
  return mapTagsByClient(rows.map(rowToClientTag))
}

export async function setClientTags(
  clientId: string,
  salonId: string,
  labels: string[]
): Promise<ClientTag[]> {
  const db = getDb()
  const normalized = [...new Set(labels.map((l) => l.trim()).filter(Boolean))].slice(0, 8)

  await db.transaction(async (tx) => {
    await tx
      .delete(clientTags)
      .where(and(eq(clientTags.salonId, salonId), eq(clientTags.clientId, clientId)))

    if (normalized.length > 0) {
      await tx.insert(clientTags).values(
        normalized.map((label) => ({
          salonId,
          clientId,
          label,
          color: tagColors[label] ?? 'bg-muted text-foreground border-border',
        }))
      )
    }
  })

  return getClientTags(clientId, salonId)
}

export async function getAppointmentsByDateRange(
  salonId: string,
  startDate: string,
  endDate: string,
  staffIdFilter?: string
): Promise<Appointment[]> {
  const db = getDb()
  const conditions = [
    eq(appointments.salonId, salonId),
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

export async function getAppointmentsWithDetailsByDateRange(
  salonId: string,
  startDate: string,
  endDate: string,
  staffIdFilter?: string
): Promise<AppointmentWithDetails[]> {
  const db = getDb()
  const conditions = [
    eq(appointments.salonId, salonId),
    gte(appointments.date, startDate),
    lte(appointments.date, endDate),
  ]
  if (staffIdFilter) {
    conditions.push(eq(appointments.staffId, staffIdFilter))
  }

  const rows = await db
    .select({
      appointment: appointments,
      client: clients,
      staff: users,
      service: services,
    })
    .from(appointments)
    .innerJoin(clients, and(eq(appointments.clientId, clients.id), eq(clients.salonId, salonId)))
    .innerJoin(users, and(eq(appointments.staffId, users.id), eq(users.salonId, salonId)))
    .innerJoin(services, and(eq(appointments.serviceId, services.id), eq(services.salonId, salonId)))
    .where(and(...conditions))
    .orderBy(asc(appointments.date), asc(appointments.startTime))

  return rows.map(attachDetails)
}

export async function getClientAppointmentsWithDetails(
  salonId: string,
  clientId: string
): Promise<AppointmentWithDetails[]> {
  const db = getDb()
  const rows = await db
    .select({
      appointment: appointments,
      client: clients,
      staff: users,
      service: services,
    })
    .from(appointments)
    .innerJoin(clients, and(eq(appointments.clientId, clients.id), eq(clients.salonId, salonId)))
    .innerJoin(users, and(eq(appointments.staffId, users.id), eq(users.salonId, salonId)))
    .innerJoin(services, and(eq(appointments.serviceId, services.id), eq(services.salonId, salonId)))
    .where(and(eq(appointments.salonId, salonId), eq(appointments.clientId, clientId)))
    .orderBy(desc(appointments.date), desc(appointments.startTime))

  return rows.map(attachDetails)
}

export async function getAppointmentById(
  id: string,
  salonId: string
): Promise<Appointment | undefined> {
  const db = getDb()
  const rows = await db
    .select()
    .from(appointments)
    .where(and(eq(appointments.id, id), eq(appointments.salonId, salonId)))
    .limit(1)
  const row = rows[0]
  return row ? rowToAppointment(row) : undefined
}

export async function createAppointment(
  apt: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
  salonId: string,
  createdByUserId?: string
): Promise<Appointment> {
  const db = getDb()
  const values: typeof appointments.$inferInsert = {
    salonId,
    clientId: apt.clientId,
    staffId: apt.staffId,
    serviceId: apt.serviceId,
    date: apt.date,
    startTime: apt.startTime,
    endTime: apt.endTime,
    status: apt.status,
    notes: apt.notes,
    createdByUserId: createdByUserId ?? null,
  }
  if (isClientProvidedEntityId(apt.id)) {
    values.id = apt.id
  }
  const [row] = await db.insert(appointments).values(values).returning()
  return rowToAppointment(row)
}

export async function updateAppointment(
  id: string,
  salonId: string,
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
    .where(and(eq(appointments.id, id), eq(appointments.salonId, salonId)))
    .returning()
  return row ? rowToAppointment(row) : undefined
}

export async function deleteAppointment(id: string, salonId: string): Promise<boolean> {
  const db = getDb()
  const deleted = await db
    .delete(appointments)
    .where(and(eq(appointments.id, id), eq(appointments.salonId, salonId)))
    .returning()
  return deleted.length > 0
}

export async function getScheduleOverlapFlags(
  salonId: string,
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
      salonId: appointments.salonId,
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
        eq(appointments.salonId, salonId),
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
    salonId,
  })
}

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

export async function getStaffScheduleForDay(
  salonId: string,
  staffId: string,
  dayOfWeek: number
): Promise<StaffSchedule | undefined> {
  const db = getDb()
  const rows = await db
    .select()
    .from(staffSchedules)
    .where(
      and(
        eq(staffSchedules.salonId, salonId),
        eq(staffSchedules.staffId, staffId),
        eq(staffSchedules.dayOfWeek, dayOfWeek),
        eq(staffSchedules.active, true)
      )
    )
    .limit(1)
  const row = rows[0]
  return row ? rowToStaffSchedule(row) : undefined
}

export async function getStaffScheduleForDayAnyStatus(
  salonId: string,
  staffId: string,
  dayOfWeek: number
): Promise<StaffSchedule | undefined> {
  const db = getDb()
  const rows = await db
    .select()
    .from(staffSchedules)
    .where(
      and(
        eq(staffSchedules.salonId, salonId),
        eq(staffSchedules.staffId, staffId),
        eq(staffSchedules.dayOfWeek, dayOfWeek)
      )
    )
    .limit(1)
  const row = rows[0]
  return row ? rowToStaffSchedule(row) : undefined
}

export async function getStaffSchedules(
  salonId: string,
  staffId: string
): Promise<StaffSchedule[]> {
  const db = getDb()
  const rows = await db
    .select()
    .from(staffSchedules)
    .where(and(eq(staffSchedules.salonId, salonId), eq(staffSchedules.staffId, staffId)))
    .orderBy(asc(staffSchedules.dayOfWeek))
  return rows.map(rowToStaffSchedule)
}

export async function setStaffSchedules(
  salonId: string,
  staffId: string,
  schedule: Array<{
    dayOfWeek: number
    active: boolean
    workingStart: string
    workingEnd: string
  }>
): Promise<StaffSchedule[]> {
  const db = getDb()
  await db.transaction(async (tx) => {
    for (const row of schedule) {
      await tx
        .insert(staffSchedules)
        .values({
          salonId,
          staffId,
          dayOfWeek: row.dayOfWeek,
          active: row.active,
          workingStart: row.workingStart,
          workingEnd: row.workingEnd,
        })
        .onConflictDoUpdate({
          target: [staffSchedules.salonId, staffSchedules.staffId, staffSchedules.dayOfWeek],
          set: {
            active: row.active,
            workingStart: row.workingStart,
            workingEnd: row.workingEnd,
            updatedAt: new Date(),
          },
        })
    }
  })

  return getStaffSchedules(salonId, staffId)
}

export async function checkStaffAvailabilityForAppointment(
  salonId: string,
  staffId: string,
  date: string,
  startTime: string,
  endTime: string
): Promise<StaffAvailabilityResult> {
  const businessHours = await getBusinessSettings(salonId)
  const dayOfWeek = dayOfWeekFromDate(date)
  const schedules = dayOfWeek >= 0 ? await getStaffSchedules(salonId, staffId) : []
  const schedule = schedules.find((row) => row.dayOfWeek === dayOfWeek)

  return validateStaffAvailability({
    schedule,
    hasAnyScheduleRows: schedules.length > 0,
    businessHours,
    startTime,
    endTime,
  })
}

export async function getStaffBookingAvailabilityForSlot(
  salonId: string,
  date: string,
  startTime: string,
  endTime: string
): Promise<Array<{ staffId: string; available: boolean; reason?: string }>> {
  const everyone = await getAllStaff(salonId)
  const staffMembers = everyone.filter((u) => u.role === 'staff')
  return Promise.all(
    staffMembers.map(async (u) => {
      const r = await checkStaffAvailabilityForAppointment(salonId, u.id, date, startTime, endTime)
      return {
        staffId: u.id,
        available: r.ok,
        ...(r.ok ? {} : { reason: r.error }),
      }
    })
  )
}

export async function getClientSummary(
  salonId: string,
  clientId: string
): Promise<ClientSummary | null> {
  const [client, tags, allAppointments, openFollowUps] = await Promise.all([
    getClientById(clientId, salonId),
    getClientTags(clientId, salonId),
    getClientAppointmentsWithDetails(salonId, clientId),
    getClientFollowUps(salonId, { clientId, status: 'open' }),
  ])
  if (!client) return null

  const today = todayIsoDate()
  const upcomingAppointment =
    allAppointments
      .filter((apt) => apt.date >= today && apt.status !== 'cancelled' && apt.status !== 'no-show')
      .sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`))[0] ??
    null

  const completed = allAppointments.filter((apt) => apt.status === 'completed')
  const cancelled = allAppointments.filter((apt) => apt.status === 'cancelled')
  const noShows = allAppointments.filter((apt) => apt.status === 'no-show')
  const estimatedSpend = completed.reduce((sum, apt) => sum + apt.service.price, 0)
  const lastCompleted = completed
    .slice()
    .sort((a, b) => `${b.date} ${b.startTime}`.localeCompare(`${a.date} ${a.startTime}`))[0]

  const serviceCounts = new Map<string, { name: string; count: number }>()
  for (const apt of completed) {
    const cur = serviceCounts.get(apt.serviceId) ?? { name: apt.service.name, count: 0 }
    cur.count += 1
    serviceCounts.set(apt.serviceId, cur)
  }
  const favoriteService = [...serviceCounts.values()].sort((a, b) => b.count - a.count)[0]

  return {
    client: { ...client, tags },
    tags,
    upcomingAppointment,
    history: allAppointments,
    stats: {
      completedCount: completed.length,
      cancelledCount: cancelled.length,
      noShowCount: noShows.length,
      estimatedSpend,
      lastVisitDate: lastCompleted?.date ?? null,
      favoriteServiceName: favoriteService?.name ?? null,
      lastStaffName: lastCompleted?.staff.name ?? null,
      totalCompletedVisits: completed.length,
    },
    openFollowUps,
  }
}

export async function getClientFollowUps(
  salonId: string,
  options?: { clientId?: string; status?: FollowUpStatus }
): Promise<ClientFollowUp[]> {
  const db = getDb()
  const conditions = [eq(clientFollowUps.salonId, salonId)]
  if (options?.clientId) conditions.push(eq(clientFollowUps.clientId, options.clientId))
  if (options?.status) conditions.push(eq(clientFollowUps.status, options.status))

  const rows = await db
    .select()
    .from(clientFollowUps)
    .where(and(...conditions))
    .orderBy(asc(clientFollowUps.dueDate), desc(clientFollowUps.createdAt))
  return rows.map(rowToClientFollowUp)
}

export async function createClientFollowUp(
  salonId: string,
  clientId: string,
  reason: FollowUpReason,
  dueDate = todayIsoDate()
): Promise<ClientFollowUp> {
  const db = getDb()
  const [row] = await db
    .insert(clientFollowUps)
    .values({
      salonId,
      clientId,
      reason,
      status: 'open',
      dueDate,
    })
    .onConflictDoUpdate({
      target: [clientFollowUps.salonId, clientFollowUps.clientId, clientFollowUps.reason],
      set: {
        status: 'open',
        dueDate,
        reviewedAt: null,
        updatedAt: new Date(),
      },
    })
    .returning()
  return rowToClientFollowUp(row)
}

export async function updateClientFollowUpStatus(
  salonId: string,
  id: string,
  status: FollowUpStatus
): Promise<ClientFollowUp | undefined> {
  const db = getDb()
  const [row] = await db
    .update(clientFollowUps)
    .set({
      status,
      reviewedAt: status === 'reviewed' ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(and(eq(clientFollowUps.salonId, salonId), eq(clientFollowUps.id, id)))
    .returning()
  return row ? rowToClientFollowUp(row) : undefined
}

export async function getTodayData(
  salonId: string,
  date = todayIsoDate(),
  staffIdFilter?: string
): Promise<TodayData> {
  const salonListToday = salonTodayYmd()
  const useLiveClock = date === salonListToday

  const appointmentsForDay = await getAppointmentsWithDetailsByDateRange(
    salonId,
    date,
    date,
    staffIdFilter
  )
  const [staff, tagsByClient, allClientAppointments, businessHours] = await Promise.all([
    getAllStaff(salonId),
    getClientTagsForClients(
      [...new Set(appointmentsForDay.map((apt) => apt.clientId))],
      salonId
    ),
    getAppointmentsWithDetailsByDateRange(salonId, '1900-01-01', date),
    getBusinessSettings(salonId),
  ])

  const counts: TodayData['counts'] = {
    scheduled: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    'no-show': 0,
  }
  for (const apt of appointmentsForDay) counts[apt.status] += 1

  const historyByClient = new Map<string, AppointmentWithDetails[]>()
  for (const apt of allClientAppointments) {
    const list = historyByClient.get(apt.clientId) ?? []
    list.push(apt)
    historyByClient.set(apt.clientId, list)
  }

  const current = useLiveClock ? salonCurrentHm() : ''
  const plusTwo = useLiveClock ? salonHmAfterMinutes(120) : ''
  const attentionItems: TodayAttentionItem[] = []
  for (const apt of appointmentsForDay) {
    const clientHistory = historyByClient.get(apt.clientId) ?? []
    const previousCompleted = clientHistory.filter(
      (row) =>
        row.id !== apt.id &&
        row.status === 'completed' &&
        `${row.date} ${row.startTime}` < `${apt.date} ${apt.startTime}`
    )
    const noShowCount = clientHistory.filter((row) => row.status === 'no-show').length
    const tags = tagsByClient.get(apt.clientId) ?? []
    const isVip = tags.some((tag) => tag.label.toLowerCase() === 'vip')

    if (
      useLiveClock &&
      apt.status === 'scheduled' &&
      apt.startTime >= current &&
      apt.startTime <= plusTwo
    ) {
      attentionItems.push({
        id: `${apt.id}:soon`,
        type: 'soon',
        title: `${apt.client.name} نزدیک است`,
        detail: `${apt.startTime} با ${apt.staff.name}`,
        appointmentId: apt.id,
        clientId: apt.clientId,
        priority: 2,
      })
    }
    if (useLiveClock && apt.status === 'confirmed' && apt.endTime < current) {
      attentionItems.push({
        id: `${apt.id}:overdue`,
        type: 'overdue',
        title: `${apt.client.name} نیاز به ثبت نتیجه دارد`,
        detail: `پایان نوبت ${apt.endTime}`,
        appointmentId: apt.id,
        clientId: apt.clientId,
        priority: 1,
      })
    }
    if (noShowCount >= 2) {
      attentionItems.push({
        id: `${apt.id}:no-show-risk`,
        type: 'no-show-risk',
        title: `${apt.client.name} سابقه بدقولی دارد`,
        detail: `${noShowCount} غیبت ثبت شده`,
        appointmentId: apt.id,
        clientId: apt.clientId,
        priority: 3,
      })
    }
    if (previousCompleted.length === 0) {
      attentionItems.push({
        id: `${apt.id}:first-time`,
        type: 'first-time',
        title: `${apt.client.name} مشتری بار اول است`,
        detail: apt.service.name,
        appointmentId: apt.id,
        clientId: apt.clientId,
        priority: 4,
      })
    }
    if (isVip) {
      attentionItems.push({
        id: `${apt.id}:vip`,
        type: 'vip',
        title: `${apt.client.name} VIP است`,
        detail: apt.service.name,
        appointmentId: apt.id,
        clientId: apt.clientId,
        priority: 2,
      })
    }
  }

  const staffLoad = staff
    .filter((member) => member.role === 'staff' && (!staffIdFilter || member.id === staffIdFilter))
    .map((member) => {
      const rows = appointmentsForDay.filter(
        (apt) => apt.staffId === member.id && apt.status !== 'cancelled' && apt.status !== 'no-show'
      )
      return {
        staffId: member.id,
        staffName: member.name,
        appointmentCount: rows.length,
        bookedMinutes: rows.reduce(
          (sum, apt) => sum + durationMinutesFromRange(apt.startTime, apt.endTime),
          0
        ),
      }
    })

  const scheduleRows = await Promise.all(
    staffLoad.map(async (load) => [load.staffId, await getStaffSchedules(salonId, load.staffId)] as const)
  )
  const schedulesByStaff = new Map(scheduleRows)

  const openSlots = staffLoad.map((load) => {
    const memberSchedules = schedulesByStaff.get(load.staffId) ?? []
    const schedule = memberSchedules.find((row) => row.dayOfWeek === dayOfWeekFromDate(date))
    if (schedule && !schedule.active) {
      return { staffId: load.staffId, staffName: load.staffName, ranges: [] }
    }
    if (memberSchedules.length > 0 && !schedule) {
      return { staffId: load.staffId, staffName: load.staffName, ranges: [] }
    }
    const start = schedule?.active ? schedule.workingStart : businessHours.workingStart
    const end = schedule?.active ? schedule.workingEnd : businessHours.workingEnd
    const booked = appointmentsForDay
      .filter((apt) => apt.staffId === load.staffId && (apt.status === 'scheduled' || apt.status === 'confirmed'))
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
    const ranges: Array<{ startTime: string; endTime: string }> = []
    let cursor = start
    for (const apt of booked) {
      if (cursor < apt.startTime) ranges.push({ startTime: cursor, endTime: apt.startTime })
      if (cursor < apt.endTime) cursor = apt.endTime
    }
    if (cursor < end) ranges.push({ startTime: cursor, endTime: end })
    return { staffId: load.staffId, staffName: load.staffName, ranges }
  })

  return {
    date,
    counts,
    appointments: appointmentsForDay,
    attentionItems: attentionItems.sort((a, b) => a.priority - b.priority),
    staffLoad,
    openSlots,
  }
}

export async function getRetentionQueue(salonId: string): Promise<RetentionItem[]> {
  const db = getDb()
  const today = todayIsoDate()
  const inactiveCutoff = addDaysYmd(today, -60)
  const [clientRows, appointmentRows, existingRows] = await Promise.all([
    getAllClients(salonId),
    getAppointmentsWithDetailsByDateRange(salonId, '1900-01-01', today),
    getClientFollowUps(salonId),
  ])

  const byClient = new Map<string, AppointmentWithDetails[]>()
  for (const apt of appointmentRows) {
    const list = byClient.get(apt.clientId) ?? []
    list.push(apt)
    byClient.set(apt.clientId, list)
  }

  const candidates = new Map<string, {
    client: Client
    reason: FollowUpReason
    dueDate: string
    suggestedReason: string
    completedCount: number
    estimatedSpend: number
    noShowCount: number
    lastVisitDate: string | null
    lastServiceName: string | null
  }>()

  const enriched = clientRows.map((client) => {
    const rows = byClient.get(client.id) ?? []
    const completed = rows.filter((apt) => apt.status === 'completed')
    const noShows = rows.filter((apt) => apt.status === 'no-show')
    const lastCompleted = completed
      .slice()
      .sort((a, b) => `${b.date} ${b.startTime}`.localeCompare(`${a.date} ${a.startTime}`))[0]
    return {
      client,
      rows,
      completed,
      noShows,
      lastCompleted,
      estimatedSpend: completed.reduce((sum, apt) => sum + apt.service.price, 0),
    }
  })

  for (const item of enriched) {
    const lastVisitDate = item.lastCompleted?.date ?? null
    const base = {
      client: item.client,
      dueDate: today,
      completedCount: item.completed.length,
      estimatedSpend: item.estimatedSpend,
      noShowCount: item.noShows.length,
      lastVisitDate,
      lastServiceName: item.lastCompleted?.service.name ?? null,
    }
    if (item.completed.length > 0 && lastVisitDate && lastVisitDate < inactiveCutoff) {
      candidates.set(`${item.client.id}:inactive`, {
        ...base,
        reason: 'inactive',
        suggestedReason: '۶۰ روز از آخرین مراجعه گذشته است.',
      })
    }
    if (item.completed.length === 1 && !item.rows.some((apt) => apt.date > today && apt.status !== 'cancelled')) {
      candidates.set(`${item.client.id}:new-client`, {
        ...base,
        reason: 'new-client',
        suggestedReason: 'بعد از اولین مراجعه هنوز نوبت دوم ثبت نشده است.',
      })
    }
    if (item.noShows.length > 0) {
      candidates.set(`${item.client.id}:no-show`, {
        ...base,
        reason: 'no-show',
        suggestedReason: `${item.noShows.length} غیبت نیاز به بررسی دارد.`,
      })
    }
  }

  for (const item of enriched
    .filter((row) => row.completed.length > 0)
    .sort((a, b) => b.estimatedSpend - a.estimatedSpend || b.completed.length - a.completed.length)
    .slice(0, 5)) {
    candidates.set(`${item.client.id}:vip`, {
      client: item.client,
      reason: 'vip',
      dueDate: today,
      completedCount: item.completed.length,
      estimatedSpend: item.estimatedSpend,
      noShowCount: item.noShows.length,
      lastVisitDate: item.lastCompleted?.date ?? null,
      lastServiceName: item.lastCompleted?.service.name ?? null,
      suggestedReason: 'جزو مشتریان ارزشمند سالن است.',
    })
  }

  const existingByKey = new Map(existingRows.map((row) => [`${row.clientId}:${row.reason}`, row]))
  const result: RetentionItem[] = []

  for (const candidate of candidates.values()) {
    const existing = existingByKey.get(`${candidate.client.id}:${candidate.reason}`)
    if (existing && existing.status !== 'open') continue

    const followUp =
      existing ??
      rowToClientFollowUp(
        (
          await db
            .insert(clientFollowUps)
            .values({
              salonId,
              clientId: candidate.client.id,
              reason: candidate.reason,
              status: 'open',
              dueDate: candidate.dueDate,
            })
            .onConflictDoUpdate({
              target: [clientFollowUps.salonId, clientFollowUps.clientId, clientFollowUps.reason],
              set: { updatedAt: new Date() },
            })
            .returning()
        )[0]
      )

    result.push({
      id: followUp.id,
      client: candidate.client,
      reason: candidate.reason,
      status: followUp.status,
      dueDate: followUp.dueDate,
      lastVisitDate: candidate.lastVisitDate,
      lastServiceName: candidate.lastServiceName,
      completedCount: candidate.completedCount,
      estimatedSpend: candidate.estimatedSpend,
      noShowCount: candidate.noShowCount,
      suggestedReason: candidate.suggestedReason,
    })
  }

  return result.sort((a, b) => a.dueDate.localeCompare(b.dueDate))
}

export async function getEffectiveBusinessHours(
  salonId: string,
  options?: { staffId?: string; dayOfWeek?: number }
): Promise<BusinessHours> {
  const salonHours = await getBusinessSettings(salonId)
  if (options?.staffId == null || options.dayOfWeek == null) {
    return salonHours
  }

  const schedule = await getStaffScheduleForDay(salonId, options.staffId, options.dayOfWeek)
  if (!schedule) {
    return salonHours
  }

  return {
    workingStart: schedule.workingStart,
    workingEnd: schedule.workingEnd,
    slotDurationMinutes: salonHours.slotDurationMinutes,
  }
}

export type PushSubscriptionKeys = {
  endpoint: string
  p256dh: string
  auth: string
}

export async function upsertPushSubscription(
  userId: string,
  salonId: string,
  keys: PushSubscriptionKeys
): Promise<void> {
  const db = getDb()
  await db
    .insert(pushSubscriptions)
    .values({
      salonId,
      userId,
      endpoint: keys.endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: {
        userId,
        salonId,
        p256dh: keys.p256dh,
        auth: keys.auth,
        createdAt: new Date(),
      },
    })
}

export async function getPushSubscriptionsForUser(
  userId: string,
  salonId?: string
): Promise<PushSubscriptionKeys[]> {
  const db = getDb()
  const rows = await db
    .select({
      endpoint: pushSubscriptions.endpoint,
      p256dh: pushSubscriptions.p256dh,
      auth: pushSubscriptions.auth,
    })
    .from(pushSubscriptions)
    .where(
      salonId
        ? and(eq(pushSubscriptions.userId, userId), eq(pushSubscriptions.salonId, salonId))
        : eq(pushSubscriptions.userId, userId)
    )
  return rows
}

export async function deletePushSubscriptionByEndpoint(endpoint: string): Promise<void> {
  const db = getDb()
  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint))
}

export async function deletePushSubscriptionForUser(
  userId: string,
  salonId: string,
  endpoint: string
): Promise<boolean> {
  const db = getDb()
  const removed = await db
    .delete(pushSubscriptions)
    .where(
      and(
        eq(pushSubscriptions.userId, userId),
        eq(pushSubscriptions.salonId, salonId),
        eq(pushSubscriptions.endpoint, endpoint)
      )
    )
    .returning({ id: pushSubscriptions.id })
  return removed.length > 0
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

export type OnboardingStatus = {
  salon: {
    id: string
    name: string
    slug: string
    phone: string | null
    address: string | null
  } | null
  steps: {
    profileConfirmed: boolean
    businessHoursSet: boolean
    servicesAdded: boolean
    staffAdded: boolean
    firstAppointmentCreated: boolean
  }
  completedAt: Date | null
  skippedAt: Date | null
}

export type OnboardingAction = 'confirm-profile' | 'complete' | 'skip' | 'reopen'

export async function getOnboardingStatus(salonId: string): Promise<OnboardingStatus> {
  const db = getDb()

  const [
    salonRows,
    onboardingRows,
    settingsCount,
    serviceCount,
    staffCount,
    appointmentCount,
  ] = await Promise.all([
    db
      .select({
        id: salons.id,
        name: salons.name,
        slug: salons.slug,
        phone: salons.phone,
        address: salons.address,
      })
      .from(salons)
      .where(eq(salons.id, salonId))
      .limit(1),

    db
      .select()
      .from(salonOnboarding)
      .where(eq(salonOnboarding.salonId, salonId))
      .limit(1),

    db
      .select({ value: count() })
      .from(businessSettings)
      .where(eq(businessSettings.salonId, salonId)),

    db
      .select({ value: count() })
      .from(services)
      .where(and(eq(services.salonId, salonId), eq(services.active, true))),

    db
      .select({ value: count() })
      .from(users)
      .where(and(eq(users.salonId, salonId), eq(users.role, 'staff'), eq(users.active, true))),

    db
      .select({ value: count() })
      .from(appointments)
      .where(eq(appointments.salonId, salonId)),
  ])

  const onboarding = onboardingRows[0]

  return {
    salon: salonRows[0] ?? null,
    steps: {
      profileConfirmed: !!onboarding?.profileConfirmedAt,
      businessHoursSet: (settingsCount[0]?.value ?? 0) > 0,
      servicesAdded: (serviceCount[0]?.value ?? 0) > 0,
      staffAdded: (staffCount[0]?.value ?? 0) > 0,
      firstAppointmentCreated: (appointmentCount[0]?.value ?? 0) > 0,
    },
    completedAt: onboarding?.completedAt ?? null,
    skippedAt: onboarding?.skippedAt ?? null,
  }
}

export async function updateOnboardingState(
  salonId: string,
  action: OnboardingAction
): Promise<OnboardingStatus> {
  const db = getDb()
  const now = new Date()

  if (action === 'reopen') {
    await db
      .insert(salonOnboarding)
      .values({
        salonId,
        completedAt: null,
        skippedAt: null,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: salonOnboarding.salonId,
        set: {
          completedAt: null,
          skippedAt: null,
          updatedAt: now,
        },
      })
    return getOnboardingStatus(salonId)
  }

  await db
    .insert(salonOnboarding)
    .values({
      salonId,
      profileConfirmedAt: action === 'confirm-profile' ? now : null,
      completedAt: action === 'complete' ? now : null,
      skippedAt: action === 'skip' ? now : null,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: salonOnboarding.salonId,
      set: {
        ...(action === 'confirm-profile' ? { profileConfirmedAt: now } : {}),
        ...(action === 'complete' ? { completedAt: now, skippedAt: null } : {}),
        ...(action === 'skip' ? { skippedAt: now, completedAt: null } : {}),
        updatedAt: now,
      },
    })

  return getOnboardingStatus(salonId)
}
