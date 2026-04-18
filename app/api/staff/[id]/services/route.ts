import { NextResponse } from 'next/server'
import {
  getUserById,
  getUserWithServiceIds,
  setStaffServiceIds,
  validateActiveServiceIds,
} from '@/lib/db'
import { getTenantUser, isManagerRole } from '@/lib/server/auth/tenant'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getTenantUser()
    if (!user || !isManagerRole(user.role)) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
    }

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

    const body = await request.json()
    const raw = body.serviceIds

    let normalized: string[] | null
    if (raw === null || raw === undefined) {
      normalized = null
    } else if (!Array.isArray(raw)) {
      return NextResponse.json({ error: 'serviceIds باید آرایه یا null باشد' }, { status: 400 })
    } else {
      const ids = [...new Set(raw.filter((x: unknown) => typeof x === 'string'))] as string[]
      normalized = ids.length === 0 ? null : ids
    }

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
