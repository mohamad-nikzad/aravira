import { NextResponse } from 'next/server'
import { getClientSummary } from '@repo/database/clients'
import { getTenantUser, isManagerRole } from '@repo/auth/tenant'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getTenantUser()
    if (!user || !isManagerRole(user.role)) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
    }

    const { id } = await params
    const summary = await getClientSummary(user.salonId, id)
    if (!summary) {
      return NextResponse.json({ error: 'مشتری یافت نشد' }, { status: 404 })
    }

    return NextResponse.json(summary)
  } catch (error) {
    console.error('Get client summary error:', error)
    return NextResponse.json({ error: 'خطای سرور. لطفاً دوباره تلاش کنید.' }, { status: 500 })
  }
}
