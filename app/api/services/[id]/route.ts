import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getServiceById, updateService } from '@/lib/db'
import type { Service } from '@/lib/types'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'manager') {
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

    const service = await updateService(id, patch)
    if (!service) {
      return NextResponse.json({ error: 'خدمت یافت نشد' }, { status: 404 })
    }

    return NextResponse.json({ service })
  } catch (error) {
    console.error('Update service error:', error)
    return NextResponse.json({ error: 'خطای سرور. لطفاً دوباره تلاش کنید.' }, { status: 500 })
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 401 })
    }

    const { id } = await params
    const service = await getServiceById(id)
    if (!service) {
      return NextResponse.json({ error: 'خدمت یافت نشد' }, { status: 404 })
    }

    return NextResponse.json({ service })
  } catch (error) {
    console.error('Get service error:', error)
    return NextResponse.json({ error: 'خطای سرور. لطفاً دوباره تلاش کنید.' }, { status: 500 })
  }
}
