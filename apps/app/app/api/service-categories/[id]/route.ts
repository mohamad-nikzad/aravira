import { NextResponse } from 'next/server'
import { getTenantManagerRequest } from '@repo/auth/tenant-next'
import { updateServiceCategory } from '@repo/database/services'
import { serviceCategoryUpdateSchema } from '@repo/salon-core/forms/service'
import { validationErrorResponse } from '../../validation'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const tenant = await getTenantManagerRequest(request)
    if (!tenant.ok) return tenant.response
    const { user } = tenant

    const { id } = await params
    const parsed = serviceCategoryUpdateSchema.safeParse(await request.json())
    if (!parsed.success) return validationErrorResponse(parsed.error)

    const category = await updateServiceCategory(id, user.salonId, parsed.data)
    if (!category) {
      return NextResponse.json({ error: 'بخش خدمات یافت نشد' }, { status: 404 })
    }
    return NextResponse.json({ category })
  } catch (error: unknown) {
    console.error('Update service category error:', error)
    const msg = error instanceof Error ? error.message : ''
    if (msg.includes('unique') || msg.includes('duplicate')) {
      return NextResponse.json(
        { error: 'این نام بخش برای این سالن قبلاً ثبت شده است' },
        { status: 409 },
      )
    }
    return NextResponse.json(
      { error: 'خطای سرور. لطفاً دوباره تلاش کنید.' },
      { status: 500 },
    )
  }
}
