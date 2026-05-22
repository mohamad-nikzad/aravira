import { NextResponse } from 'next/server'
import { cancelAppointmentRequestByToken } from '@repo/database/public'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ slug: string; token: string }> },
) {
  try {
    const { token } = await params
    const result = await cancelAppointmentRequestByToken(token)
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Cancel appointment request error:', error)
    return NextResponse.json({ error: 'خطای سرور. لطفاً دوباره تلاش کنید.' }, { status: 500 })
  }
}
