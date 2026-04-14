import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import type { Appointment } from '@/lib/types'
import {
  getAppointmentById,
  updateAppointment,
  deleteAppointment,
  getClientById,
  getUserById,
  getServiceById,
  hasConflict,
} from '@/lib/db'
import {
  endTimeFromDuration,
  validateAppointmentWindow,
  durationMinutesFromRange,
} from '@/lib/appointment-time'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 401 })
    }

    const { id } = await params
    const appointment = await getAppointmentById(id)

    if (!appointment) {
      return NextResponse.json({ error: 'نوبت یافت نشد' }, { status: 404 })
    }

    if (user.role === 'staff' && appointment.staffId !== user.id) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
    }

    const client = await getClientById(appointment.clientId)
    const staff = await getUserById(appointment.staffId)
    const service = await getServiceById(appointment.serviceId)

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
    const user = await getCurrentUser()
    if (!user || user.role !== 'manager') {
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

    const existing = await getAppointmentById(id)
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
      const svc = await getServiceById(serviceId)
      if (svc) {
        endTime = endTimeFromDuration(effectiveStart, svc.duration)
      }
    }

    const windowCheck = validateAppointmentWindow(effectiveStart, endTime)
    if (!windowCheck.ok) {
      return NextResponse.json({ error: windowCheck.error }, { status: 400 })
    }

    const checkStaffId = staffId || existing.staffId
    const checkDate = date || existing.date

    if (
      status !== 'cancelled' &&
      (await hasConflict(checkStaffId, checkDate, effectiveStart, endTime, id))
    ) {
      return NextResponse.json(
        { error: 'این زمان با نوبت دیگری تداخل دارد' },
        { status: 409 }
      )
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

    const appointment = await updateAppointment(id, patch)

    if (!appointment) {
      return NextResponse.json({ error: 'به‌روزرسانی انجام نشد' }, { status: 500 })
    }

    const client = await getClientById(appointment.clientId)
    const staff = await getUserById(appointment.staffId)
    const service = await getServiceById(appointment.serviceId)

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
    const user = await getCurrentUser()
    if (!user || user.role !== 'manager') {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
    }

    const { id } = await params
    const deleted = await deleteAppointment(id)

    if (!deleted) {
      return NextResponse.json({ error: 'نوبت یافت نشد' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete appointment error:', error)
    return NextResponse.json({ error: 'خطای سرور. لطفاً دوباره تلاش کنید.' }, { status: 500 })
  }
}
