import { NextResponse } from 'next/server'
import { getServiceById, updateService } from '@/lib/db'
import type { Service } from '@/lib/types'
import { getTenantUser, isManagerRole } from '@/lib/server/auth/tenant'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getTenantUser()
    if (!user || !isManagerRole(user.role)) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, category, duration, price, color, active } = body

    const patch: Partial<Service> = {}
    if (name !== undefined) patch.name = name
    if (category !== undefined) patch.category = category as Service['category']
    if (duration !== undefined) patch.duration = Number(duration)
    if (price !== undefined) patch.price = Number(price)
    if (color !== undefined) patch.color = color
    if (active !== undefined) patch.active = Boolean(active)

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
    return NextResponse.json({ error: 'خطای سرور. لطفاً دوباره تلاش کنید.' }, { status: 500 })
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getTenantUser()
    if (!user) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 401 })
    }

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
