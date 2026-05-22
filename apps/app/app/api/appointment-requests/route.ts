import { NextResponse } from 'next/server'
import {
  listAppointmentRequests,
  type AppointmentRequestStatus,
} from '@repo/database/appointment-requests'
import { getTenantRequest } from '@repo/auth/tenant-next'

const allowedStatuses = new Set<AppointmentRequestStatus>([
  'pending',
  'approved',
  'rejected',
  'cancelled',
  'expired',
])

export async function GET(request: Request) {
  try {
    const tenant = await getTenantRequest(request, 'manage_appointments')
    if (!tenant.ok) return tenant.response
    const { user } = tenant
    const url = new URL(request.url)
    const statusParam = url.searchParams.get('status') ?? undefined
    const filter =
      statusParam && allowedStatuses.has(statusParam as AppointmentRequestStatus)
        ? { status: statusParam as AppointmentRequestStatus }
        : {}
    const requests = await listAppointmentRequests(user.salonId, filter)
    return NextResponse.json({ requests })
  } catch (error) {
    console.error('List appointment requests error:', error)
    return NextResponse.json({ error: 'خطای سرور. لطفاً دوباره تلاش کنید.' }, { status: 500 })
  }
}
