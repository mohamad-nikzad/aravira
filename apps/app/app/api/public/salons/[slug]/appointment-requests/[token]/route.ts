import { NextResponse } from 'next/server'
import { getAppointmentRequestByToken } from '@repo/database/public'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string; token: string }> },
) {
  try {
    const { token } = await params
    const view = await getAppointmentRequestByToken(token)
    if (!view) return NextResponse.json({ error: 'درخواست یافت نشد' }, { status: 404 })
    return NextResponse.json(view)
  } catch (error) {
    console.error('Get appointment request by token error:', error)
    return NextResponse.json({ error: 'خطای سرور. لطفاً دوباره تلاش کنید.' }, { status: 500 })
  }
}
