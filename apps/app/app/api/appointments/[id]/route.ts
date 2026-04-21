import { NextResponse } from 'next/server'
import type { Appointment } from '@repo/salon-core/types'
import {
  getAppointmentById,
  updateAppointment,
  deleteAppointment,
  getClientById,
  getUserById,
  getServiceById,
  getScheduleOverlapFlags,
  staffMayPerformService,
  checkStaffAvailabilityForAppointment,
} from '@repo/database/appointments'
import { isBlockingAppointmentStatus, SCHEDULE_CONFLICT_CODES } from '@repo/salon-core/appointment-conflict'
import {
  endTimeFromDuration,
  validateAppointmentWindow,
  durationMinutesFromRange,
} from '@repo/salon-core/appointment-time'
import { getTenantUser, isManagerRole } from '@repo/auth/tenant'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getTenantUser()
    if (!user) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 401 })
    }

    const { id } = await params
    const appointment = await getAppointmentById(id, user.salonId)

    if (!appointment) {
      return NextResponse.json({ error: 'نوبت یافت نشد' }, { status: 404 })
    }

    if (user.role === 'staff' && appointment.staffId !== user.userId) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
    }

    const client = await getClientById(appointment.clientId, user.salonId)
    const staff = await getUserById(appointment.staffId)
    const service = await getServiceById(appointment.serviceId, user.salonId)

    return NextResponse.json({
      appointment: {
        ...appointment,
        client,
        staff,
        service,
      },
    })
  } catch (error) {
    console.error('Get appointment error:', error)
    return NextResponse.json({ error: 'خطای سرور. لطفاً دوباره تلاش کنید.' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getTenantUser()
    if (!user || !isManagerRole(user.role)) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const {
      clientId,
      staffId,
      serviceId,
      date,
      startTime,
      endTime: endTimeRaw,
      durationMinutes,
      status,
      notes,
    } = body

    const existing = await getAppointmentById(id, user.salonId)
    if (!existing) {
      return NextResponse.json({ error: 'نوبت یافت نشد' }, { status: 404 })
    }

    const effectiveStart = typeof startTime === 'string' ? startTime : existing.startTime
    const endExplicit =
      typeof endTimeRaw === 'string' && endTimeRaw.trim() !== '' ? endTimeRaw.trim() : null
    const durNum =
      typeof durationMinutes === 'number'
        ? durationMinutes
        : typeof durationMinutes === 'string'
          ? Number(durationMinutes)
          : NaN
    const hasDur = Number.isFinite(durNum) && durNum > 0

    const startChanged = typeof startTime === 'string' && startTime !== existing.startTime
    const serviceChanged = typeof serviceId === 'string' && serviceId !== existing.serviceId

    let endTime = existing.endTime

    if (endExplicit) {
      endTime = endExplicit
    } else if (hasDur) {
      endTime = endTimeFromDuration(effectiveStart, durNum)
    } else if (startChanged) {
      const prevLen = durationMinutesFromRange(existing.startTime, existing.endTime)
      const keep = Math.max(5, prevLen)
      endTime = endTimeFromDuration(effectiveStart, keep)
    } else if (serviceChanged) {
      const svc = await getServiceById(serviceId, user.salonId)
      if (svc) {
        endTime = endTimeFromDuration(effectiveStart, svc.duration)
      }
    }

    const windowCheck = validateAppointmentWindow(effectiveStart, endTime)
    if (!windowCheck.ok) {
      return NextResponse.json({ error: windowCheck.error }, { status: 400 })
    }

    const resolvedServiceId = typeof serviceId === 'string' ? serviceId : existing.serviceId
    const resolvedStaffId = typeof staffId === 'string' ? staffId : existing.staffId
    const checkStaffId = typeof staffId === 'string' ? staffId : existing.staffId
    const checkClientId = typeof clientId === 'string' ? clientId : existing.clientId
    const checkDate = typeof date === 'string' ? date : existing.date
    const svcForPair = await getServiceById(resolvedServiceId, user.salonId)
    if (!svcForPair || !svcForPair.active) {
      return NextResponse.json({ error: 'خدمت یافت نشد' }, { status: 404 })
    }
    const staffForPair = await getUserById(resolvedStaffId)
    if (!staffForPair || staffForPair.salonId !== user.salonId || staffForPair.role !== 'staff') {
      return NextResponse.json({ error: 'پرسنل یافت نشد' }, { status: 404 })
    }

    const clientForPair = await getClientById(checkClientId, user.salonId)
    if (!clientForPair) {
      return NextResponse.json({ error: 'مشتری یافت نشد' }, { status: 404 })
    }

    const pairOk = await staffMayPerformService(resolvedStaffId, resolvedServiceId, user.salonId)
    if (!pairOk) {
      return NextResponse.json(
        { error: 'این پرسنل برای خدمت انتخاب‌شده تعریف نشده است.' },
        { status: 400 }
      )
    }

    const resolvedStatus: Appointment['status'] =
      typeof status === 'string' ? (status as Appointment['status']) : existing.status

    if (isBlockingAppointmentStatus(resolvedStatus)) {
      const availability = await checkStaffAvailabilityForAppointment(
        user.salonId,
        checkStaffId,
        checkDate,
        effectiveStart,
        endTime
      )
      if (!availability.ok) {
        return NextResponse.json(
          { error: availability.error, code: availability.code },
          { status: 409 }
        )
      }

      const overlaps = await getScheduleOverlapFlags(
        user.salonId,
        checkStaffId,
        checkClientId,
        checkDate,
        effectiveStart,
        endTime,
        id
      )
      if (overlaps.staffConflict) {
        return NextResponse.json(
          {
            error: 'پرسنل انتخاب‌شده در این بازه زمانی نوبت فعال دیگری دارد.',
            code: SCHEDULE_CONFLICT_CODES.STAFF_OVERLAP,
          },
          { status: 409 }
        )
      }
      if (overlaps.clientConflict) {
        return NextResponse.json(
          {
            error: 'این مشتری در این بازه زمانی نوبت فعال دیگری دارد.',
            code: SCHEDULE_CONFLICT_CODES.CLIENT_OVERLAP,
          },
          { status: 409 }
        )
      }
    }

    const patch: Partial<Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>> = {
      endTime,
    }
    if (clientId !== undefined) patch.clientId = clientId
    if (staffId !== undefined) patch.staffId = staffId
    if (serviceId !== undefined) patch.serviceId = serviceId
    if (date !== undefined) patch.date = date
    if (typeof startTime === 'string') patch.startTime = startTime
    if (status !== undefined) patch.status = status
    if (notes !== undefined) patch.notes = notes

    const appointment = await updateAppointment(id, user.salonId, patch)

    if (!appointment) {
      return NextResponse.json({ error: 'به‌روزرسانی انجام نشد' }, { status: 500 })
    }

    const client = await getClientById(appointment.clientId, user.salonId)
    const staff = await getUserById(appointment.staffId)
    const service = await getServiceById(appointment.serviceId, user.salonId)

    return NextResponse.json({
      appointment: {
        ...appointment,
        client,
        staff,
        service,
      },
    })
  } catch (error) {
    console.error('Update appointment error:', error)
    return NextResponse.json({ error: 'خطای سرور. لطفاً دوباره تلاش کنید.' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getTenantUser()
    if (!user || !isManagerRole(user.role)) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
    }

    const { id } = await params
    const deleted = await deleteAppointment(id, user.salonId)

    if (!deleted) {
      return NextResponse.json({ error: 'نوبت یافت نشد' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete appointment error:', error)
    return NextResponse.json({ error: 'خطای سرور. لطفاً دوباره تلاش کنید.' }, { status: 500 })
  }
}
