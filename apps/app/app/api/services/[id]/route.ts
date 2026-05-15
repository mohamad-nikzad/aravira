import { NextResponse } from 'next/server'
import { getServiceById, updateService } from '@repo/database/services'
import type { Service } from '@repo/salon-core/types'
import { getTenantManagerRequest, getTenantRequest } from '@repo/auth/tenant'
import { serviceUpdateSchema } from '@repo/salon-core/forms/service'
import { validationErrorResponse } from '../../validation'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenant = await getTenantManagerRequest(request)
    if (!tenant.ok) return tenant.response
    const { user } = tenant

    const { id } = await params
    const parsed = serviceUpdateSchema.safeParse(await request.json())
    if (!parsed.success) return validationErrorResponse(parsed.error)
    const { name, familyId, duration, price, color, active, description, kind } = parsed.data

    const patch: Partial<Service> = {}
    if (name !== undefined) patch.name = name
    if (familyId !== undefined) patch.familyId = familyId
    if (duration !== undefined) patch.duration = duration
    if (price !== undefined) patch.price = price
    if (color !== undefined) patch.color = color
    if (active !== undefined) patch.active = Boolean(active)
    if (description !== undefined) patch.description = description
    if (kind !== undefined) patch.kind = kind

    const service = await updateService(id, user.salonId, patch)
    if (!service) {
      return NextResponse.json({ error: 'خدمت یافت نشد' }, { status: 404 })
    }

    return NextResponse.json({ service })
  } catch (error: unknown) {
    console.error('Update service error:', error)
    const msg = error instanceof Error ? error.message : ''
    if (msg.includes('unique') || msg.includes('duplicate')) {
      return NextResponse.json({ error: 'این نام خدمت برای این سالن قبلاً ثبت شده است' }, { status: 409 })
    }
    if (msg.includes('active combo service must have at least one component')) {
      return NextResponse.json({ error: 'پکیج فعال باید حداقل یک خدمت در ترکیب خود داشته باشد' }, { status: 400 })
    }
    return NextResponse.json({ error: 'خطای سرور. لطفاً دوباره تلاش کنید.' }, { status: 500 })
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenant = await getTenantRequest(request)
    if (!tenant.ok) return tenant.response
    const { user } = tenant

    const { id } = await params
    const service = await getServiceById(id, user.salonId)
    if (!service) {
      return NextResponse.json({ error: 'خدمت یافت نشد' }, { status: 404 })
    }

    return NextResponse.json({ service })
  } catch (error) {
    console.error('Get service error:', error)
    return NextResponse.json({ error: 'خطای سرور. لطفاً دوباره تلاش کنید.' }, { status: 500 })
  }
}
