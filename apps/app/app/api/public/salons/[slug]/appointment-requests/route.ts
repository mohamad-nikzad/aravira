import { NextResponse } from 'next/server'
import { createAppointmentRequest } from '@repo/database/public'
import { checkAndRecordPublicSubmit } from '@repo/database/rate-limit'
import { publicAppointmentRequestSchema } from '@repo/salon-core/forms/public'
import { validationErrorResponse } from '../../../../validation'

function extractIp(request: Request): string {
  const cfIp = request.headers.get('cf-connecting-ip')
  if (cfIp) return cfIp
  const xff = request.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0]!.trim()
  const xri = request.headers.get('x-real-ip')
  if (xri) return xri
  return 'unknown'
}

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const parsed = publicAppointmentRequestSchema.safeParse(await request.json())
    if (!parsed.success) return validationErrorResponse(parsed.error)
    const body = parsed.data
    const limit = await checkAndRecordPublicSubmit(extractIp(request))
    if (!limit.allowed) {
      return NextResponse.json(
        { error: 'تعداد درخواست‌ها بیش از حد مجاز است. لطفاً بعداً تلاش کنید.' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil(limit.retryAfterMs / 1000)) },
        },
      )
    }
    const result = await createAppointmentRequest({
      slug,
      serviceId: body.serviceId,
      date: body.date,
      startTime: body.startTime,
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      ...(body.notes ? { notes: body.notes } : {}),
    })
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status })
    return NextResponse.json({ token: result.confirmationToken }, { status: 201 })
  } catch (error) {
    console.error('Create appointment request error:', error)
    return NextResponse.json({ error: 'خطای سرور. لطفاً دوباره تلاش کنید.' }, { status: 500 })
  }
}
