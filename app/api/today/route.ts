import { NextResponse } from 'next/server'
import { getTodayData } from '@/lib/db'
import { getTenantUser } from '@/lib/server/auth/tenant'

/** Calendar day for default "today" views; matches typical salon locale (Asia/Tehran). */
function defaultListDate() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Tehran' })
}

export async function GET(request: Request) {
  try {
    const user = await getTenantUser()
    if (!user) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || defaultListDate()
    const staffFilter = user.role === 'staff' ? user.userId : undefined
    const today = await getTodayData(user.salonId, date, staffFilter)

    return NextResponse.json(today)
  } catch (error) {
    console.error('Today endpoint error:', error)
    return NextResponse.json({ error: 'خطای سرور. لطفاً دوباره تلاش کنید.' }, { status: 500 })
  }
}
