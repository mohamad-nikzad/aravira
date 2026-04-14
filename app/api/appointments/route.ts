import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import {
  getAppointmentsByDateRange,
  createAppointment,
  getClientById,
  getUserById,
  getServiceById,
  hasConflict,
} from '@/lib/db'
import type { Appointment, AppointmentWithDetails } from '@/lib/types'
import { endTimeFromDuration, validateAppointmentWindow } from '@/lib/appointment-time'

async function enrichAppointment(apt: Appointment): Promise<AppointmentWithDetails | null> {
  const [client, staff, service] = await Promise.all([
    getClientById(apt.clientId),
    getUserById(apt.staffId),
    getServiceById(apt.serviceId),
  ])
  if (!client || !staff || !service) return null
  return { ...apt, client, staff, service }
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'تاریخ شروع و پایان الزامی است' },
        { status: 400 }
      )
    }

    const staffFilter = user.role === 'staff' ? user.id : undefined
    const list = await getAppointmentsByDateRange(startDate, endDate, staffFilter)

    const enriched = (
      await Promise.all(list.map((apt) => enrichAppointment(apt)))
    ).filter((a): a is AppointmentWithDetails => a !== null)

    return NextResponse.json({ appointments: enriched })
  } catch (error) {
    console.error('Get appointments error:', error)
    return NextResponse.json({ error: 'خطای سرور. لطفاً دوباره تلاش کنید.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'manager') {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
    }

    const body = await request.json()
    const {
      clientId,
      staffId,
      serviceId,
      date,
      startTime,
      endTime: endTimeRaw,
      durationMinutes,
      notes,
    } = body

    if (!clientId || !staffId || !serviceId || !date || !startTime) {
      return NextResponse.json({ error: 'فیلدهای الزامی کامل نیست' }, { status: 400 })
    }

    const service = await getServiceById(serviceId)
    if (!service || !service.active) {
      return NextResponse.json({ error: 'خدمت یافت نشد' }, { status: 404 })
    }

    const endExplicit =
      typeof endTimeRaw === 'string' && endTimeRaw.trim() !== '' ? endTimeRaw.trim() : null
    const durNum =
      typeof durationMinutes === 'number'
        ? durationMinutes
        : typeof durationMinutes === 'string'
          ? Number(durationMinutes)
          : NaN

    let endTime: string
    if (endExplicit) {
      endTime = endExplicit
    } else if (Number.isFinite(durNum) && durNum > 0) {
      endTime = endTimeFromDuration(startTime, durNum)
    } else {
      endTime = endTimeFromDuration(startTime, service.duration)
    }

    const windowCheck = validateAppointmentWindow(startTime, endTime)
    if (!windowCheck.ok) {
      return NextResponse.json({ error: windowCheck.error }, { status: 400 })
    }

    if (await hasConflict(staffId, date, startTime, endTime)) {
      return NextResponse.json(
        { error: 'این زمان با نوبت دیگری تداخل دارد' },
        { status: 409 }
      )
    }

    const appointment = await createAppointment(
      {
        clientId,
        staffId,
        serviceId,
        date,
        startTime,
        endTime,
        status: 'scheduled',
        notes,
      },
      user.id
    )

    const client = await getClientById(appointment.clientId)
    const staff = await getUserById(appointment.staffId)

    return NextResponse.json({
      appointment: {
        ...appointment,
        client,
        staff,
        service,
      },
    })
  } catch (error) {
    console.error('Create appointment error:', error)
    return NextResponse.json({ error: 'خطای سرور. لطفاً دوباره تلاش کنید.' }, { status: 500 })
  }
}
