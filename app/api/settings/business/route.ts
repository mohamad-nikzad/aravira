import { NextResponse } from 'next/server'
import { getBusinessSettings, updateBusinessSettings } from '@/lib/db'
import { getTenantUser, isManagerRole } from '@/lib/server/auth/tenant'

export async function GET() {
  try {
    const user = await getTenantUser()
    if (!user) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 401 })
    }

    const settings = await getBusinessSettings(user.salonId)
    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Get business settings error:', error)
    return NextResponse.json({ error: 'خطای سرور. لطفاً دوباره تلاش کنید.' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getTenantUser()
    if (!user || !isManagerRole(user.role)) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
    }

    const body = await request.json()
    const { workingStart, workingEnd, slotDurationMinutes } = body

    const next = await updateBusinessSettings(user.salonId, {
      ...(typeof workingStart === 'string' ? { workingStart } : {}),
      ...(typeof workingEnd === 'string' ? { workingEnd } : {}),
      ...(typeof slotDurationMinutes === 'number' ? { slotDurationMinutes } : {}),
    })

    return NextResponse.json({ settings: next })
  } catch (error) {
    console.error('Update business settings error:', error)
    return NextResponse.json({ error: 'خطای سرور. لطفاً دوباره تلاش کنید.' }, { status: 500 })
  }
}
