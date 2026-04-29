import { and, asc, desc, eq, gte, lte, or } from 'drizzle-orm'
import type { Appointment, AppointmentWithDetails } from '@repo/salon-core/types'
import { detectScheduleOverlaps } from '@repo/salon-core/appointment-conflict'
import { getDb } from '../client'
import { appointments, clients, services, users } from '../schema'
import { attachAppointmentDetails, rowToAppointment } from './row-mappers'
import { isClientProvidedEntityId } from './client-queries'

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

  return rows.map(attachAppointmentDetails)
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

  return rows.map(attachAppointmentDetails)
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
