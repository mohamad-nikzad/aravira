import { NextResponse } from 'next/server'
import { z } from 'zod'
import { approveAppointmentRequest } from '@repo/database/appointment-requests'
import { getTenantRequest } from '@repo/auth/tenant-next'
import { validationErrorResponse } from '../../../validation'

const bodySchema = z.object({ staffId: z.string().min(1) })

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const tenant = await getTenantRequest(request, 'manage_appointments')
    if (!tenant.ok) return tenant.response
    const { user } = tenant
    const { id } = await params
    const parsed = bodySchema.safeParse(await request.json())
    if (!parsed.success) return validationErrorResponse(parsed.error)
    const result = await approveAppointmentRequest({
      id,
      salonId: user.salonId,
      staffId: parsed.data.staffId,
      reviewedByUserId: user.userId,
    })
    if (!result.ok) {
      return NextResponse.json(
        result.code ? { error: result.error, code: result.code } : { error: result.error },
        { status: result.status },
      )
    }
    return NextResponse.json({ appointmentId: result.appointmentId, clientId: result.clientId })
  } catch (error) {
    console.error('Approve appointment request error:', error)
    return NextResponse.json({ error: 'خطای سرور. لطفاً دوباره تلاش کنید.' }, { status: 500 })
  }
}
