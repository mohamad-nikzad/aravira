import { NextResponse } from 'next/server'
import { getTenantManagerRequest } from '@repo/auth/tenant-next'
import { updateServiceAddon } from '@repo/database/services'
import { serviceAddonUpdateSchema } from '@repo/salon-core/forms/service'
import { validationErrorResponse } from '../../validation'

function addonErrorResponse(error: unknown) {
  const msg = error instanceof Error ? error.message : ''
  if (msg.includes('active service add-on name must be unique per salon')) {
    return NextResponse.json({ error: 'این نام افزودنی برای این سالن قبلاً ثبت شده است' }, { status: 409 })
  }
  if (msg.includes('service add-on price and duration deltas must be non-negative')) {
    return NextResponse.json({ error: 'قیمت و زمان افزودنی نمی‌توانند منفی باشند' }, { status: 400 })
  }
  if (msg.includes('service add-on price or duration delta must be positive')) {
    return NextResponse.json({ error: 'قیمت یا زمان افزوده باید بیشتر از صفر باشد' }, { status: 400 })
  }
  if (msg.includes('scope not found')) {
    return NextResponse.json({ error: 'یکی از محدوده‌های انتخاب‌شده پیدا نشد' }, { status: 400 })
  }
  return null
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenant = await getTenantManagerRequest(request)
    if (!tenant.ok) return tenant.response
    const { user } = tenant
    const { id } = await params

    const parsed = serviceAddonUpdateSchema.safeParse(await request.json())
    if (!parsed.success) return validationErrorResponse(parsed.error)

    const addon = await updateServiceAddon(id, user.salonId, parsed.data)
    if (!addon) return NextResponse.json({ error: 'افزودنی یافت نشد' }, { status: 404 })
    return NextResponse.json({ addon })
  } catch (error: unknown) {
    console.error('Update service add-on error:', error)
    return addonErrorResponse(error) ?? NextResponse.json({ error: 'خطای سرور. لطفاً دوباره تلاش کنید.' }, { status: 500 })
  }
}
