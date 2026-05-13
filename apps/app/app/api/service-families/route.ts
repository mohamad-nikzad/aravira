import { NextResponse } from 'next/server'
import {
  getTenantManagerRequest,
  getTenantRequest,
  isManagerRole,
} from '@repo/auth/tenant'
import {
  createServiceFamily,
  getAllServiceFamilies,
} from '@repo/database/services'
import { isClientProvidedEntityId } from '@repo/database/clients'
import { serviceFamilyCreateSchema } from '@repo/salon-core/forms/service'
import { validationErrorResponse } from '../validation'

export async function GET(request: Request) {
  try {
    const tenant = await getTenantRequest(request)
    if (!tenant.ok) return tenant.response
    const { user } = tenant

    const { searchParams } = new URL(request.url)
    const all = searchParams.get('all') === '1' && isManagerRole(user.role)
    const families = await getAllServiceFamilies(user.salonId, all)
    return NextResponse.json({ families })
  } catch (error) {
    console.error('Get service families error:', error)
    return NextResponse.json(
      { error: 'خطای سرور. لطفاً دوباره تلاش کنید.' },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const tenant = await getTenantManagerRequest(request)
    if (!tenant.ok) return tenant.response
    const { user } = tenant

    const parsed = serviceFamilyCreateSchema.safeParse(await request.json())
    if (!parsed.success) return validationErrorResponse(parsed.error)
    const { id, categoryId, name, active } = parsed.data

    if (
      id !== undefined &&
      id !== null &&
      !isClientProvidedEntityId(String(id))
    ) {
      return NextResponse.json(
        { error: 'شناسه گروه خدمات نامعتبر است' },
        { status: 400 },
      )
    }

    const family = await createServiceFamily({
      categoryId,
      name,
      active: active !== false,
      salonId: user.salonId,
      ...(isClientProvidedEntityId(String(id)) ? { id: String(id) } : {}),
    })
    return NextResponse.json({ family })
  } catch (error: unknown) {
    console.error('Create service family error:', error)
    const msg = error instanceof Error ? error.message : ''
    if (msg.includes('unique') || msg.includes('duplicate')) {
      return NextResponse.json(
        { error: 'این نام گروه برای این بخش قبلاً ثبت شده است' },
        { status: 409 },
      )
    }
    if (msg.includes('not found')) {
      return NextResponse.json({ error: 'بخش خدمات یافت نشد' }, { status: 400 })
    }
    return NextResponse.json(
      { error: 'خطای سرور. لطفاً دوباره تلاش کنید.' },
      { status: 500 },
    )
  }
}
