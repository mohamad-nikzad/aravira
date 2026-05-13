import { NextResponse } from 'next/server'
import { getTenantManagerRequest } from '@repo/auth/tenant'
import { importStarterServiceTemplates } from '@repo/database/services'

export async function POST(request: Request) {
  try {
    const tenant = await getTenantManagerRequest(request)
    if (!tenant.ok) return tenant.response
    const { user } = tenant

    const result = await importStarterServiceTemplates(user.salonId)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Import starter service templates error:', error)
    return NextResponse.json({ error: 'خطای سرور. لطفاً دوباره تلاش کنید.' }, { status: 500 })
  }
}
