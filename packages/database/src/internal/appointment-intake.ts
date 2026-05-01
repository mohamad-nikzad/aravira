import type { Appointment, Client, Service, User } from '@repo/salon-core/types'
import { SCHEDULE_CONFLICT_CODES, isBlockingAppointmentStatus } from '@repo/salon-core/appointment-conflict'
import {
  durationMinutesFromRange,
  endTimeFromDuration,
  validateAppointmentWindow,
} from '@repo/salon-core/appointment-time'
import { isClientProvidedEntityId } from './client-queries'
import { getClientById } from './client-queries'
import { validatePlaceholderClientUsage } from './placeholder-client-queries'
import { getServiceById } from './service-queries'
import {
  checkStaffAvailabilityForAppointment,
  staffMayPerformService,
} from './staff-queries'
import { getUserById } from './user-queries'
import { getScheduleOverlapFlags } from './appointment-queries'

type AppointmentCommand = Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
type AppointmentPatch = Partial<Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>>

type AppointmentIntakeFailure = {
  ok: false
  status: number
  error: string
  code?: string
}

export type CreateAppointmentIntakeResult =
  | {
      ok: true
      command: AppointmentCommand
      client: Client
      staff: User
      service: Service
    }
  | AppointmentIntakeFailure

export type UpdateAppointmentIntakeResult =
  | {
      ok: true
      patch: AppointmentPatch
      client: Client
      staff: User
      service: Service
    }
  | AppointmentIntakeFailure

function fail(status: number, error: string, code?: string): AppointmentIntakeFailure {
  return { ok: false, status, error, ...(code ? { code } : {}) }
}

function positiveDurationMinutes(raw: unknown): number | null {
  const value =
    typeof raw === 'number'
      ? raw
      : typeof raw === 'string'
        ? Number(raw)
        : NaN

  return Number.isFinite(value) && value > 0 ? value : null
}

function explicitEndTime(raw: unknown): string | null {
  return typeof raw === 'string' && raw.trim() !== '' ? raw.trim() : null
}

async function validateReferences(input: {
  salonId: string
  clientId: string
  staffId: string
  serviceId: string
}): Promise<
  | { ok: true; client: Client; staff: User; service: Service }
  | AppointmentIntakeFailure
> {
  const service = await getServiceById(input.serviceId, input.salonId)
  if (!service || !service.active) {
    return fail(404, 'خدمت یافت نشد')
  }

  const staff = await getUserById(input.staffId)
  if (!staff || staff.salonId !== input.salonId || staff.role !== 'staff') {
    return fail(404, 'پرسنل یافت نشد')
  }

  const client = await getClientById(input.clientId, input.salonId)
  if (!client) {
    return fail(404, 'مشتری یافت نشد')
  }

  const staffOk = await staffMayPerformService(input.staffId, input.serviceId, input.salonId)
  if (!staffOk) {
    return fail(400, 'این پرسنل برای خدمت انتخاب‌شده تعریف نشده است.')
  }

  return { ok: true, client, staff, service }
}

async function validateBlockingSchedule(input: {
  salonId: string
  staffId: string
  clientId: string
  date: string
  startTime: string
  endTime: string
  excludeId?: string
}): Promise<true | AppointmentIntakeFailure> {
  const availability = await checkStaffAvailabilityForAppointment(
    input.salonId,
    input.staffId,
    input.date,
    input.startTime,
    input.endTime
  )
  if (!availability.ok) {
    return fail(409, availability.error, availability.code)
  }

  const overlaps = await getScheduleOverlapFlags(
    input.salonId,
    input.staffId,
    input.clientId,
    input.date,
    input.startTime,
    input.endTime,
    input.excludeId
  )
  if (overlaps.staffConflict) {
    return fail(
      409,
      'پرسنل انتخاب‌شده در این بازه زمانی نوبت فعال دیگری دارد.',
      SCHEDULE_CONFLICT_CODES.STAFF_OVERLAP
    )
  }
  if (overlaps.clientConflict) {
    return fail(
      409,
      'این مشتری در این بازه زمانی نوبت فعال دیگری دارد.',
      SCHEDULE_CONFLICT_CODES.CLIENT_OVERLAP
    )
  }

  return true
}

export async function validateCreateAppointmentIntake(input: {
  salonId: string
  clientId: unknown
  staffId: unknown
  serviceId: unknown
  date: unknown
  startTime: unknown
  endTime?: unknown
  durationMinutes?: unknown
  notes?: string
  requestedAppointmentId?: unknown
}): Promise<CreateAppointmentIntakeResult> {
  if (
    typeof input.clientId !== 'string' ||
    typeof input.staffId !== 'string' ||
    typeof input.serviceId !== 'string' ||
    typeof input.date !== 'string' ||
    typeof input.startTime !== 'string'
  ) {
    return fail(400, 'فیلدهای الزامی کامل نیست')
  }

  const refs = await validateReferences({
    salonId: input.salonId,
    clientId: input.clientId,
    staffId: input.staffId,
    serviceId: input.serviceId,
  })
  if (!refs.ok) return refs

  const placeholderUsage = await validatePlaceholderClientUsage({
    salonId: input.salonId,
    clientId: refs.client.id,
  })
  if (!placeholderUsage.ok) {
    return fail(placeholderUsage.status, placeholderUsage.error, placeholderUsage.code)
  }

  const duration = positiveDurationMinutes(input.durationMinutes)
  const endTime = explicitEndTime(input.endTime) ?? endTimeFromDuration(input.startTime, duration ?? refs.service.duration)
  const windowCheck = validateAppointmentWindow(input.startTime, endTime)
  if (!windowCheck.ok) {
    return fail(400, windowCheck.error)
  }

  const schedule = await validateBlockingSchedule({
    salonId: input.salonId,
    staffId: input.staffId,
    clientId: input.clientId,
    date: input.date,
    startTime: input.startTime,
    endTime,
  })
  if (schedule !== true) return schedule

  return {
    ok: true,
    command: {
      clientId: input.clientId,
      staffId: input.staffId,
      serviceId: input.serviceId,
      date: input.date,
      startTime: input.startTime,
      endTime,
      status: 'scheduled',
      notes: input.notes,
      ...(typeof input.requestedAppointmentId === 'string' &&
      isClientProvidedEntityId(input.requestedAppointmentId)
        ? { id: input.requestedAppointmentId }
        : {}),
    },
    client: refs.client,
    staff: refs.staff,
    service: refs.service,
  }
}

export async function validateUpdateAppointmentIntake(input: {
  salonId: string
  appointmentId: string
  existing: Appointment
  body: {
    clientId?: unknown
    staffId?: unknown
    serviceId?: unknown
    date?: unknown
    startTime?: unknown
    endTime?: unknown
    durationMinutes?: unknown
    status?: unknown
    notes?: unknown
  }
}): Promise<UpdateAppointmentIntakeResult> {
  const { existing, body } = input
  const effectiveStart = typeof body.startTime === 'string' ? body.startTime : existing.startTime
  const resolvedServiceId = typeof body.serviceId === 'string' ? body.serviceId : existing.serviceId
  const resolvedStaffId = typeof body.staffId === 'string' ? body.staffId : existing.staffId
  const resolvedClientId = typeof body.clientId === 'string' ? body.clientId : existing.clientId
  const resolvedDate = typeof body.date === 'string' ? body.date : existing.date

  const duration = positiveDurationMinutes(body.durationMinutes)
  const startChanged = typeof body.startTime === 'string' && body.startTime !== existing.startTime
  const serviceChanged = typeof body.serviceId === 'string' && body.serviceId !== existing.serviceId

  let endTime = existing.endTime
  const endExplicit = explicitEndTime(body.endTime)
  if (endExplicit) {
    endTime = endExplicit
  } else if (duration != null) {
    endTime = endTimeFromDuration(effectiveStart, duration)
  } else if (startChanged) {
    endTime = endTimeFromDuration(
      effectiveStart,
      Math.max(5, durationMinutesFromRange(existing.startTime, existing.endTime))
    )
  } else if (serviceChanged) {
    const service = await getServiceById(resolvedServiceId, input.salonId)
    if (service) {
      endTime = endTimeFromDuration(effectiveStart, service.duration)
    }
  }

  const windowCheck = validateAppointmentWindow(effectiveStart, endTime)
  if (!windowCheck.ok) {
    return fail(400, windowCheck.error)
  }

  const refs = await validateReferences({
    salonId: input.salonId,
    clientId: resolvedClientId,
    staffId: resolvedStaffId,
    serviceId: resolvedServiceId,
  })
  if (!refs.ok) return refs

  const placeholderUsage = await validatePlaceholderClientUsage({
    salonId: input.salonId,
    clientId: refs.client.id,
    appointmentId: input.appointmentId,
  })
  if (!placeholderUsage.ok) {
    return fail(placeholderUsage.status, placeholderUsage.error, placeholderUsage.code)
  }

  const resolvedStatus =
    typeof body.status === 'string' ? (body.status as Appointment['status']) : existing.status

  if (isBlockingAppointmentStatus(resolvedStatus)) {
    const schedule = await validateBlockingSchedule({
      salonId: input.salonId,
      staffId: resolvedStaffId,
      clientId: resolvedClientId,
      date: resolvedDate,
      startTime: effectiveStart,
      endTime,
      excludeId: input.appointmentId,
    })
    if (schedule !== true) return schedule
  }

  const patch: AppointmentPatch = { endTime }
  if (body.clientId !== undefined) patch.clientId = body.clientId as string
  if (body.staffId !== undefined) patch.staffId = body.staffId as string
  if (body.serviceId !== undefined) patch.serviceId = body.serviceId as string
  if (body.date !== undefined) patch.date = body.date as string
  if (typeof body.startTime === 'string') patch.startTime = body.startTime
  if (body.status !== undefined) patch.status = body.status as Appointment['status']
  if (body.notes !== undefined) patch.notes = body.notes as string | undefined

  return {
    ok: true,
    patch,
    client: refs.client,
    staff: refs.staff,
    service: refs.service,
  }
}
