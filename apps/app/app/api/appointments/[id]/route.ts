import { NextResponse } from 'next/server'
import type { Appointment } from '@repo/salon-core/types'
import {
  getAppointmentById,
  getAppointmentWithDetailsById,
  updateAppointment,
  deleteAppointment,
  validateUpdateAppointmentIntake,
} from '@repo/database/appointments'
import { getTenantManagerRequest, getTenantRequest, isManagerRole } from '@repo/auth/tenant'

const STAFF_STATUS_UPDATES: ReadonlySet<Appointment['status']> = new Set([
  'confirmed',
  'completed',
  'no-show',
])

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenant = await getTenantRequest()
    if (!tenant.ok) return tenant.response
    const { user } = tenant

    const { id } = await params
    const appointment = await getAppointmentWithDetailsById(id, user.salonId)

    if (!appointment) {
      return NextResponse.json({ error: 'نوبت یافت نشد' }, { status: 404 })
    }

    if (user.role === 'staff' && appointment.staffId !== user.userId) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
    }

    return NextResponse.json({ appointment })
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
    const tenant = await getTenantRequest()
    if (!tenant.ok) return tenant.response
    const { user } = tenant

    const { id } = await params
    const body = await request.json()
    const { status } = body

    const existing = await getAppointmentById(id, user.salonId)
    if (!existing) {
      return NextResponse.json({ error: 'نوبت یافت نشد' }, { status: 404 })
    }

    const isStatusOnlyPatch =
      Object.keys(body).every((key) => key === 'status') &&
      typeof status === 'string'

    if (!isManagerRole(user.role)) {
      const staffCanPatchOwnStatus =
        user.role === 'staff' &&
        existing.staffId === user.userId &&
        isStatusOnlyPatch &&
        STAFF_STATUS_UPDATES.has(status as Appointment['status'])

      if (!staffCanPatchOwnStatus) {
        return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
      }
    }

    const intake = await validateUpdateAppointmentIntake({
      salonId: user.salonId,
      appointmentId: id,
      existing,
      body,
    })
    if (!intake.ok) {
      return NextResponse.json(
        { error: intake.error, ...(intake.code ? { code: intake.code } : {}) },
        { status: intake.status }
      )
    }

    const appointment = await updateAppointment(id, user.salonId, intake.patch)

    if (!appointment) {
      return NextResponse.json({ error: 'به‌روزرسانی انجام نشد' }, { status: 500 })
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
    console.error('Update appointment error:', error)
    return NextResponse.json({ error: 'خطای سرور. لطفاً دوباره تلاش کنید.' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenant = await getTenantManagerRequest()
    if (!tenant.ok) return tenant.response
    const { user } = tenant

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
