import { NextResponse } from 'next/server'
import { z } from 'zod'
import { rejectAppointmentRequest } from '@repo/database/appointment-requests'
import { getTenantRequest } from '@repo/auth/tenant-next'
import { validationErrorResponse } from '../../../validation'

const bodySchema = z.object({ reason: z.string().trim().min(1).optional() })

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const tenant = await getTenantRequest(request, 'manage_appointments')
    if (!tenant.ok) return tenant.response
    const { user } = tenant
    const { id } = await params
    const raw = await request.json().catch(() => ({}))
    const parsed = bodySchema.safeParse(raw ?? {})
    if (!parsed.success) return validationErrorResponse(parsed.error)
    const result = await rejectAppointmentRequest({
      id,
      salonId: user.salonId,
      reviewedByUserId: user.userId,
      ...(parsed.data.reason ? { reason: parsed.data.reason } : {}),
    })
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Reject appointment request error:', error)
    return NextResponse.json({ error: 'خطای سرور. لطفاً دوباره تلاش کنید.' }, { status: 500 })
  }
}
