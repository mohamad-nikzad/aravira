import { NextResponse } from 'next/server'
import {
  getBusinessSettings,
  getStaffSchedules,
  getUserById,
  setStaffSchedules,
} from '@repo/database/staff'
import { getTenantManagerRequest } from '@repo/auth/tenant-next'
import { staffScheduleRequestSchema } from '@repo/salon-core/forms/staff'
import { validationErrorResponse } from '../../../validation'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenant = await getTenantManagerRequest(request)
    if (!tenant.ok) return tenant.response
    const { user } = tenant

    const { id } = await params
    const staff = await getUserById(id)
    if (!staff || staff.salonId !== user.salonId || staff.role !== 'staff') {
      return NextResponse.json({ error: 'پرسنل یافت نشد' }, { status: 404 })
    }

    const [schedule, businessHours] = await Promise.all([
      getStaffSchedules(user.salonId, id),
      getBusinessSettings(user.salonId),
    ])

    return NextResponse.json({ schedule, businessHours })
  } catch (error) {
    console.error('Get staff schedule error:', error)
    return NextResponse.json({ error: 'خطای سرور. لطفاً دوباره تلاش کنید.' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenant = await getTenantManagerRequest(request)
    if (!tenant.ok) return tenant.response
    const { user } = tenant

    const { id } = await params
    const staff = await getUserById(id)
    if (!staff || staff.salonId !== user.salonId || staff.role !== 'staff') {
      return NextResponse.json({ error: 'پرسنل یافت نشد' }, { status: 404 })
    }

    const parsed = staffScheduleRequestSchema.safeParse(await request.json())
    if (!parsed.success) return validationErrorResponse(parsed.error)
    const { schedule } = parsed.data

    const saved = await setStaffSchedules(user.salonId, id, schedule)
    return NextResponse.json({ schedule: saved })
  } catch (error) {
    console.error('Update staff schedule error:', error)
    return NextResponse.json({ error: 'خطای سرور. لطفاً دوباره تلاش کنید.' }, { status: 500 })
  }
}
