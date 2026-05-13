import { NextResponse } from 'next/server'
import { getTenantManagerRequest, getTenantRequest, isManagerRole } from '@repo/auth/tenant'
import { createServiceCategory, getAllServiceCategories } from '@repo/database/services'
import { isClientProvidedEntityId } from '@repo/database/clients'
import { serviceCategoryCreateSchema } from '@repo/salon-core/forms/service'
import { validationErrorResponse } from '../validation'

export async function GET(request: Request) {
  try {
    const tenant = await getTenantRequest(request)
    if (!tenant.ok) return tenant.response
    const { user } = tenant

    const { searchParams } = new URL(request.url)
    const all = searchParams.get('all') === '1' && isManagerRole(user.role)
    const categories = await getAllServiceCategories(user.salonId, all)
    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Get service categories error:', error)
    return NextResponse.json({ error: 'خطای سرور. لطفاً دوباره تلاش کنید.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const tenant = await getTenantManagerRequest(request)
    if (!tenant.ok) return tenant.response
    const { user } = tenant

    const parsed = serviceCategoryCreateSchema.safeParse(await request.json())
    if (!parsed.success) return validationErrorResponse(parsed.error)
    const { id, name, active } = parsed.data

    if (id !== undefined && id !== null && !isClientProvidedEntityId(String(id))) {
      return NextResponse.json({ error: 'شناسه دسته نامعتبر است' }, { status: 400 })
    }

    const category = await createServiceCategory({
      name,
      active: active !== false,
      salonId: user.salonId,
      ...(isClientProvidedEntityId(String(id)) ? { id: String(id) } : {}),
    })
    return NextResponse.json({ category })
  } catch (error: unknown) {
    console.error('Create service category error:', error)
    const msg = error instanceof Error ? error.message : ''
    if (msg.includes('unique') || msg.includes('duplicate')) {
      return NextResponse.json({ error: 'این نام دسته برای این سالن قبلاً ثبت شده است' }, { status: 409 })
    }
    return NextResponse.json({ error: 'خطای سرور. لطفاً دوباره تلاش کنید.' }, { status: 500 })
  }
}
