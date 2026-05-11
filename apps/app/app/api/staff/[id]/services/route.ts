import { NextResponse } from 'next/server'
import {
  getUserById,
  getUserWithServiceIds,
  setStaffServiceIds,
  validateActiveServiceIds,
} from '@repo/database/staff'
import { getTenantManagerRequest } from '@repo/auth/tenant'
import { staffServiceIdsSchema } from '@repo/salon-core/forms/staff'
import { validationErrorResponse } from '../../../validation'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenant = await getTenantManagerRequest(request)
    if (!tenant.ok) return tenant.response
    const { user } = tenant

    const { id: staffId } = await params
    const target = await getUserById(staffId)
    if (!target || target.salonId !== user.salonId) {
      return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 })
    }
    if (target.role !== 'staff') {
      return NextResponse.json(
        { error: 'فقط برای اعضای با نقش «پرسنل» می‌توان خدمات تعیین کرد.' },
        { status: 400 }
      )
    }

    const parsed = staffServiceIdsSchema.safeParse(await request.json())
    if (!parsed.success) return validationErrorResponse(parsed.error)
    const { serviceIds: normalized } = parsed.data

    if (normalized !== null) {
      const ok = await validateActiveServiceIds(normalized, user.salonId)
      if (!ok) {
        return NextResponse.json(
          { error: 'یک یا چند شناسه خدمت نامعتبر یا غیرفعال است.' },
          { status: 400 }
        )
      }
    }

    await setStaffServiceIds(staffId, normalized, user.salonId)
    const updated = await getUserWithServiceIds(staffId, user.salonId)
    if (!updated) {
      return NextResponse.json({ error: 'به‌روزرسانی انجام شد اما کاربر بازخوانی نشد' }, { status: 500 })
    }

    return NextResponse.json({ staff: updated })
  } catch (error) {
    console.error('Patch staff services error:', error)
    return NextResponse.json({ error: 'خطای سرور. لطفاً دوباره تلاش کنید.' }, { status: 500 })
  }
}
