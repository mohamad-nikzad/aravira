import { NextResponse } from 'next/server'
import { getRetentionQueue } from '@/lib/db'
import { getTenantUser, isManagerRole } from '@/lib/server/auth/tenant'

export async function GET() {
  try {
    const user = await getTenantUser()
    if (!user || !isManagerRole(user.role)) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
    }

    const items = await getRetentionQueue(user.salonId)
    return NextResponse.json({ items })
  } catch (error) {
    console.error('Retention queue error:', error)
    return NextResponse.json({ error: 'خطای سرور. لطفاً دوباره تلاش کنید.' }, { status: 500 })
  }
}
