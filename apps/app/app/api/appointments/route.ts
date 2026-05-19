import { NextResponse } from 'next/server'
import {
  createAppointment,
  getAppointmentWithDetailsById,
  getAppointmentsWithDetailsByDateRange,
  validateCreateAppointmentIntake,
} from '@repo/database/appointments'
import {
  createPlaceholderClient,
  deletePlaceholderClientIfOrphaned,
} from '@repo/database/clients'
import { appointmentCreateSchema } from '@repo/salon-core/forms/appointment'
import {
  createNotificationForUser,
  isWebPushConfigured,
  sendWebPushToUser,
} from '@repo/notifications'
import { getTenantManagerRequest, getTenantRequest } from '@repo/auth/tenant-next'

export async function GET(request: Request) {
  try {
    const tenant = await getTenantRequest(request)
    if (!tenant.ok) return tenant.response
    const { user } = tenant

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'تاریخ شروع و پایان الزامی است' },
        { status: 400 },
      )
    }

    const staffFilter = user.role === 'staff' ? user.userId : undefined
    const appointments = await getAppointmentsWithDetailsByDateRange(
      user.salonId,
      startDate,
      endDate,
      staffFilter,
    )

    return NextResponse.json({ appointments })
  } catch (error) {
    console.error('Get appointments error:', error)
    return NextResponse.json(
      { error: 'خطای سرور. لطفاً دوباره تلاش کنید.' },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  let createdPlaceholderId: string | null = null
  let placeholderSalonId: string | null = null
  try {
    const tenant = await getTenantManagerRequest(request)
    if (!tenant.ok) return tenant.response
    const { user } = tenant
    placeholderSalonId = user.salonId

    const parsed = appointmentCreateSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'داده نامعتبر' },
        { status: 400 },
      )
    }
    const {
      clientId,
      placeholderClient,
      staffId,
      serviceId,
      addonIds,
      date,
      startTime,
      endTime: endTimeRaw,
      durationMinutes,
      notes,
      id: requestedAppointmentId,
    } = parsed.data

    let resolvedClientId = clientId

    if (placeholderClient) {
      const placeholder = await createPlaceholderClient({
        salonId: user.salonId,
        name: placeholderClient.name,
        notes: placeholderClient.notes,
      })
      resolvedClientId = placeholder.id
      createdPlaceholderId = placeholder.id
    }

    const intake = await validateCreateAppointmentIntake({
      salonId: user.salonId,
      clientId: resolvedClientId,
      staffId,
      serviceId,
      date,
      startTime,
      endTime: endTimeRaw,
      durationMinutes,
      addonIds,
      notes,
      requestedAppointmentId,
    })
    if (!intake.ok) {
      if (createdPlaceholderId) {
        await deletePlaceholderClientIfOrphaned(
          createdPlaceholderId,
          user.salonId,
        )
      }
      return NextResponse.json(
        { error: intake.error, ...(intake.code ? { code: intake.code } : {}) },
        { status: intake.status },
      )
    }

    const appointment = await createAppointment(
      intake.command,
      user.salonId,
      user.userId,
    )

    if (intake.staff.id !== user.userId) {
      const route = `/(tabs)/calendar?date=${appointment.date}&appointmentId=${appointment.id}`
      const title = 'نوبت جدید'
      const body = `${intake.client.name}، ${intake.service.name}، ${appointment.date} ساعت ${appointment.startTime}`

      await createNotificationForUser({
        salonId: user.salonId,
        userId: intake.staff.id,
        type: 'appointment_created',
        title,
        body,
        route,
        data: {
          appointmentId: appointment.id,
          date: appointment.date,
          route,
          title,
          body,
          clientId: appointment.clientId,
          staffId: appointment.staffId,
          serviceId: appointment.serviceId,
          startTime: appointment.startTime,
        },
      })
    }

    if (isWebPushConfigured() && intake.staff.id !== user.userId) {
      void sendWebPushToUser(intake.staff.id, {
        title: 'نوبت جدید برای شما',
        body: `${intake.client.name} — ${intake.service.name}، ${appointment.date} ساعت ${appointment.startTime}`,
        url: `/calendar?date=${appointment.date}&appointmentId=${appointment.id}`,
        tag: `appointment-${appointment.id}`,
      })
    }

    const detail = await getAppointmentWithDetailsById(
      appointment.id,
      user.salonId,
    )

    return NextResponse.json({
      appointment: detail ?? {
        ...appointment,
        client: intake.client,
        staff: intake.staff,
        service: intake.service,
      },
    })
  } catch (error) {
    if (createdPlaceholderId && placeholderSalonId) {
      await deletePlaceholderClientIfOrphaned(
        createdPlaceholderId,
        placeholderSalonId,
      ).catch(() => {})
    }
    console.error('Create appointment error:', error)
    return NextResponse.json(
      { error: 'خطای سرور. لطفاً دوباره تلاش کنید.' },
      { status: 500 },
    )
  }
}
