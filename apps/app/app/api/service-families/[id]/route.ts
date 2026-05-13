import { NextResponse } from 'next/server'
import { getTenantManagerRequest } from '@repo/auth/tenant'
import { updateServiceFamily } from '@repo/database/services'
import { serviceFamilyUpdateSchema } from '@repo/salon-core/forms/service'
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
    const parsed = serviceFamilyUpdateSchema.safeParse(await request.json())
    if (!parsed.success) return validationErrorResponse(parsed.error)

    const family = await updateServiceFamily(id, user.salonId, parsed.data)
    if (!family) {
      return NextResponse.json(
        { error: 'گروه خدمات یافت نشد' },
        { status: 404 },
      )
    }
    return NextResponse.json({ family })
  } catch (error: unknown) {
    console.error('Update service family error:', error)
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
