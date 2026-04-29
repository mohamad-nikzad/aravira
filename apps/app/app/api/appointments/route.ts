import { NextResponse } from 'next/server'
import {
  createAppointment,
  getAppointmentWithDetailsById,
  getAppointmentsWithDetailsByDateRange,
  validateCreateAppointmentIntake,
} from '@repo/database/appointments'
import { sendWebPushToUser, isWebPushConfigured } from '@/lib/push'
import { getTenantManagerRequest, getTenantRequest } from '@repo/auth/tenant'

export async function GET(request: Request) {
  try {
    const tenant = await getTenantRequest()
    if (!tenant.ok) return tenant.response
    const { user } = tenant

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
    const appointments = await getAppointmentsWithDetailsByDateRange(
      user.salonId,
      startDate,
      endDate,
      staffFilter
    )

    return NextResponse.json({ appointments })
  } catch (error) {
    console.error('Get appointments error:', error)
    return NextResponse.json({ error: 'خطای سرور. لطفاً دوباره تلاش کنید.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const tenant = await getTenantManagerRequest()
    if (!tenant.ok) return tenant.response
    const { user } = tenant

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
      id: requestedAppointmentId,
    } = body

    const intake = await validateCreateAppointmentIntake({
      salonId: user.salonId,
      clientId,
      staffId,
      serviceId,
      date,
      startTime,
      endTime: endTimeRaw,
      durationMinutes,
      notes,
      requestedAppointmentId,
    })
    if (!intake.ok) {
      return NextResponse.json(
        { error: intake.error, ...(intake.code ? { code: intake.code } : {}) },
        { status: intake.status }
      )
    }

    const appointment = await createAppointment(
      intake.command,
      user.salonId,
      user.userId
    )

    if (isWebPushConfigured() && intake.staff.id !== user.userId) {
      void sendWebPushToUser(intake.staff.id, {
        title: 'نوبت جدید برای شما',
        body: `${intake.client.name} — ${intake.service.name}، ${appointment.date} ساعت ${appointment.startTime}`,
        url: `/calendar?date=${appointment.date}&appointmentId=${appointment.id}`,
        tag: `appointment-${appointment.id}`,
      })
    }

    const detail = await getAppointmentWithDetailsById(appointment.id, user.salonId)

    return NextResponse.json({
      appointment: detail ?? {
        ...appointment,
        client: intake.client,
        staff: intake.staff,
        service: intake.service,
      },
    })
  } catch (error) {
    console.error('Create appointment error:', error)
    return NextResponse.json({ error: 'خطای سرور. لطفاً دوباره تلاش کنید.' }, { status: 500 })
  }
}
