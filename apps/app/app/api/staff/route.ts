import { NextResponse } from 'next/server'
import { getAllStaff, createUser } from '@repo/database/staff'
import { STAFF_COLORS } from '@repo/salon-core/types'
import { normalizeCalendarColorId } from '@repo/salon-core/calendar-colors'
import { getTenantManagerRequest, getTenantRequest } from '@repo/auth/tenant-next'
import { staffCreateSchema } from '@repo/salon-core/forms/staff'
import { validationErrorResponse } from '../validation'

export async function GET(request: Request) {
  try {
    const tenant = await getTenantRequest(request)
    if (!tenant.ok) return tenant.response
    const { user } = tenant

    const staff = await getAllStaff(user.salonId)
    return NextResponse.json({ staff })
  } catch (error) {
    console.error('Get staff error:', error)
    return NextResponse.json({ error: 'خطای سرور. لطفاً دوباره تلاش کنید.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const tenant = await getTenantManagerRequest(request)
    if (!tenant.ok) return tenant.response
    const { user } = tenant

    const parsed = staffCreateSchema.safeParse(await request.json())
    if (!parsed.success) return validationErrorResponse(parsed.error)
    const { password, name, role, phone } = parsed.data

    const existingStaff = await getAllStaff(user.salonId)
    const colorIndex = existingStaff.length % STAFF_COLORS.length
    const color = normalizeCalendarColorId(STAFF_COLORS[colorIndex])

    const newUser = await createUser({
      phone,
      password,
      name,
      role: role || 'staff',
      color,
      salonId: user.salonId,
    })

    return NextResponse.json({ user: newUser })
  } catch (error: unknown) {
    console.error('Create staff error:', error)
    const msg = error instanceof Error ? error.message : ''
    if (msg.includes('unique') || msg.includes('duplicate')) {
      return NextResponse.json({ error: 'این شماره موبایل قبلاً ثبت شده است' }, { status: 409 })
    }
    return NextResponse.json({ error: 'خطای سرور. لطفاً دوباره تلاش کنید.' }, { status: 500 })
  }
}
