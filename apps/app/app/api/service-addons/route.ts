import { NextResponse } from 'next/server'
import {
  createServiceAddon,
  getAllServiceAddons,
} from '@repo/database/services'
import { isClientProvidedEntityId } from '@repo/database/clients'
import {
  getTenantManagerRequest,
  getTenantRequest,
  isManagerRole,
} from '@repo/auth/tenant-next'
import { serviceAddonCreateSchema } from '@repo/salon-core/forms/service'
import { validationErrorResponse } from '../validation'

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

export async function GET(request: Request) {
  try {
    const tenant = await getTenantRequest(request)
    if (!tenant.ok) return tenant.response
    const { user } = tenant

    const { searchParams } = new URL(request.url)
    const all = searchParams.get('all') === '1' && isManagerRole(user.role)
    const addons = await getAllServiceAddons(user.salonId, all)
    return NextResponse.json({ addons })
  } catch (error) {
    console.error('Get service add-ons error:', error)
    return NextResponse.json({ error: 'خطای سرور. لطفاً دوباره تلاش کنید.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const tenant = await getTenantManagerRequest(request)
    if (!tenant.ok) return tenant.response
    const { user } = tenant

    const parsed = serviceAddonCreateSchema.safeParse(await request.json())
    if (!parsed.success) return validationErrorResponse(parsed.error)
    const { id, ...input } = parsed.data
    if (id !== undefined && id !== null && !isClientProvidedEntityId(String(id))) {
      return NextResponse.json({ error: 'شناسه افزودنی نامعتبر است' }, { status: 400 })
    }

    const addon = await createServiceAddon({
      ...input,
      salonId: user.salonId,
      ...(isClientProvidedEntityId(String(id)) ? { id: String(id) } : {}),
    })
    return NextResponse.json({ addon })
  } catch (error: unknown) {
    console.error('Create service add-on error:', error)
    return addonErrorResponse(error) ?? NextResponse.json({ error: 'خطای سرور. لطفاً دوباره تلاش کنید.' }, { status: 500 })
  }
}
