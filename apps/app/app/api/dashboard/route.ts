import { NextResponse } from 'next/server'
import { getDashboardData } from '@repo/database/dashboard'
import { getTenantUser, isManagerRole } from '@repo/auth/tenant'

export async function GET() {
  try {
    const user = await getTenantUser()
    if (!user || !isManagerRole(user.role)) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
    }

    const dashboard = await getDashboardData(user.salonId)
    return NextResponse.json(dashboard)
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json(
      { error: 'خطای سرور. لطفاً دوباره تلاش کنید.' },
      { status: 500 }
    )
  }
}
