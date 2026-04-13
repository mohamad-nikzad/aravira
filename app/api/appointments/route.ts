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
import { AppointmentWithDetails } from '@/lib/types'
import { endTimeFromDuration, validateAppointmentWindow } from '@/lib/appointment-time'

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

    const appointments = getAppointmentsByDateRange(startDate, endDate)

    // Enrich with related data
    const enrichedAppointments: AppointmentWithDetails[] = appointments
      .map((apt) => {
        const client = getClientById(apt.clientId)
        const staff = getUserById(apt.staffId)
        const service = getServiceById(apt.serviceId)

        if (!client || !staff || !service) return null

        return {
          ...apt,
          client,
          staff,
          service,
        }
      })
      .filter((apt): apt is AppointmentWithDetails => apt !== null)

    return NextResponse.json({ appointments: enrichedAppointments })
  } catch (error) {
    console.error('Get appointments error:', error)
    return NextResponse.json({ error: 'خطای سرور. لطفاً دوباره تلاش کنید.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 401 })
    }

    const body = await request.json()
    const { clientId, staffId, serviceId, date, startTime, endTime: endTimeRaw, durationMinutes, notes } =
      body

    if (!clientId || !staffId || !serviceId || !date || !startTime) {
      return NextResponse.json(
        { error: 'فیلدهای الزامی کامل نیست' },
        { status: 400 }
      )
    }

    const service = getServiceById(serviceId)
    if (!service) {
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

    // Check for conflicts
    if (hasConflict(staffId, date, startTime, endTime)) {
      return NextResponse.json(
        { error: 'این زمان با نوبت دیگری تداخل دارد' },
        { status: 409 }
      )
    }

    const appointment = createAppointment({
      clientId,
      staffId,
      serviceId,
      date,
      startTime,
      endTime,
      status: 'scheduled',
      notes,
    })

    // Enrich with related data
    const client = getClientById(appointment.clientId)
    const staff = getUserById(appointment.staffId)

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
