import { NextResponse } from 'next/server'
import { getTenantRequest } from '@repo/auth/tenant'
import { getActiveServiceAddonsForService } from '@repo/database/services'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenant = await getTenantRequest(request)
    if (!tenant.ok) return tenant.response
    const { user } = tenant
    const { id } = await params

    const addons = await getActiveServiceAddonsForService(id, user.salonId)
    return NextResponse.json({ addons })
  } catch (error) {
    console.error('Get service add-ons for service error:', error)
    return NextResponse.json({ error: 'خطای سرور. لطفاً دوباره تلاش کنید.' }, { status: 500 })
  }
}
