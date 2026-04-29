import { NextResponse } from 'next/server'
import { getTodayData } from '@repo/database/dashboard'
import { getTenantUser } from '@repo/auth/tenant'
import { salonTodayYmd } from '@repo/salon-core/salon-local-time'

export async function GET(request: Request) {
  try {
    const user = await getTenantUser()
    if (!user) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || salonTodayYmd()
    const staffFilter = user.role === 'staff' ? user.userId : undefined
    const today = await getTodayData(user.salonId, date, staffFilter)

    return NextResponse.json(today)
  } catch (error) {
    console.error('Today endpoint error:', error)
    return NextResponse.json({ error: 'خطای سرور. لطفاً دوباره تلاش کنید.' }, { status: 500 })
  }
}
