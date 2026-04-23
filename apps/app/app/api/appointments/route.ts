import { NextResponse } from 'next/server'
import {
  getAppointmentsByDateRange,
  createAppointment,
  getClientById,
  getUserById,
  getServiceById,
  getScheduleOverlapFlags,
  staffMayPerformService,
  checkStaffAvailabilityForAppointment,
} from '@repo/database/appointments'
import { SCHEDULE_CONFLICT_CODES } from '@repo/salon-core/appointment-conflict'
import type { Appointment, AppointmentWithDetails } from '@repo/salon-core/types'
import { endTimeFromDuration, validateAppointmentWindow } from '@repo/salon-core/appointment-time'
import { sendWebPushToUser, isWebPushConfigured } from '@/lib/push'
import { getTenantUser, isManagerRole } from '@repo/auth/tenant'

async function enrichAppointment(
  apt: Appointment,
  salonId: string
): Promise<AppointmentWithDetails | null> {
  const [client, staff, service] = await Promise.all([
    getClientById(apt.clientId, salonId),
    getUserById(apt.staffId),
    getServiceById(apt.serviceId, salonId),
  ])
  if (!client || !staff || staff.salonId !== salonId || !service) return null
  return { ...apt, client, staff, service }
}

export async function GET(request: Request) {
  try {
    const user = await getTenantUser()
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

    const staffFilter = user.role === 'staff' ? user.userId : undefined
    const list = await getAppointmentsByDateRange(user.salonId, startDate, endDate, staffFilter)

    const enriched = (
      await Promise.all(list.map((apt) => enrichAppointment(apt, user.salonId)))
    ).filter((a): a is AppointmentWithDetails => a !== null)

    return NextResponse.json({ appointments: enriched })
  } catch (error) {
    console.error('Get appointments error:', error)
    return NextResponse.json({ error: 'خطای سرور. لطفاً دوباره تلاش کنید.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getTenantUser()
    if (!user || !isManagerRole(user.role)) {
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

    const service = await getServiceById(serviceId, user.salonId)
    if (!service || !service.active) {
      return NextResponse.json({ error: 'خدمت یافت نشد' }, { status: 404 })
    }

    const staff = await getUserById(staffId)
    if (!staff || staff.salonId !== user.salonId || staff.role !== 'staff') {
      return NextResponse.json({ error: 'پرسنل یافت نشد' }, { status: 404 })
    }

    const clientForSalon = await getClientById(clientId, user.salonId)
    if (!clientForSalon) {
      return NextResponse.json({ error: 'مشتری یافت نشد' }, { status: 404 })
    }

    const staffOk = await staffMayPerformService(staffId, serviceId, user.salonId)
    if (!staffOk) {
      return NextResponse.json(
        { error: 'این پرسنل برای خدمت انتخاب‌شده تعریف نشده است.' },
        { status: 400 }
      )
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

    const availability = await checkStaffAvailabilityForAppointment(
      user.salonId,
      staffId,
      date,
      startTime,
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
      staffId,
      clientId,
      date,
      startTime,
      endTime
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
      user.salonId,
      user.userId
    )

    const client = await getClientById(appointment.clientId, user.salonId)

    if (isWebPushConfigured() && client && staff && staffId !== user.userId) {
      void sendWebPushToUser(staffId, {
        title: 'نوبت جدید برای شما',
        body: `${client.name} — ${service.name}، ${date} ساعت ${startTime}`,
        url: `/calendar?date=${date}&appointmentId=${appointment.id}`,
        tag: `appointment-${appointment.id}`,
      })
    }

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
