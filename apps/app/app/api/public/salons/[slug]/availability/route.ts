import { NextResponse } from 'next/server'
import { getPublicAvailability } from '@repo/database/public'

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const url = new URL(request.url)
    const serviceId = url.searchParams.get('serviceId')
    const date = url.searchParams.get('date')
    const modeRaw = url.searchParams.get('mode') ?? 'day'
    const daysRaw = url.searchParams.get('days')
    if (!serviceId || !date) {
      return NextResponse.json({ error: 'پارامتر نامعتبر' }, { status: 400 })
    }
    if (modeRaw !== 'day' && modeRaw !== 'nearest') {
      return NextResponse.json({ error: 'حالت نامعتبر' }, { status: 400 })
    }
    const result = await getPublicAvailability({
      slug,
      serviceId,
      date,
      mode: modeRaw,
      ...(daysRaw ? { nearestDays: Number.parseInt(daysRaw, 10) } : {}),
    })
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status })
    return NextResponse.json(result.response)
  } catch (error) {
    console.error('Public availability error:', error)
    return NextResponse.json({ error: 'خطای سرور. لطفاً دوباره تلاش کنید.' }, { status: 500 })
  }
}
