import { NextResponse } from 'next/server'
import { completePlaceholderAppointmentClient } from '@repo/database/clients'
import { getTenantManagerRequest } from '@repo/auth/tenant'
import { completePlaceholderClientSchema } from '@repo/salon-core/forms/appointment'
import { validationErrorResponse } from '../../../validation'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenant = await getTenantManagerRequest(request)
    if (!tenant.ok) return tenant.response
    const { user } = tenant

    const { id } = await params
    const parsed = completePlaceholderClientSchema.safeParse(await request.json())
    if (!parsed.success) return validationErrorResponse(parsed.error)
    const { name, phone, notes, reassignToExistingClientId } = parsed.data

    const result = await completePlaceholderAppointmentClient({
      salonId: user.salonId,
      appointmentId: id,
      name,
      phone,
      notes,
      reassignToExistingClientId,
    })

    if (!result.ok) {
      return NextResponse.json(
        {
          error: result.error,
          ...(result.code ? { code: result.code } : {}),
          ...(result.existingClient ? { existingClient: result.existingClient } : {}),
        },
        { status: result.status }
      )
    }

    return NextResponse.json({
      appointment: result.appointment,
      outcome: result.outcome,
    })
  } catch (error) {
    console.error('Complete placeholder client error:', error)
    return NextResponse.json({ error: 'خطای سرور. لطفاً دوباره تلاش کنید.' }, { status: 500 })
  }
}
