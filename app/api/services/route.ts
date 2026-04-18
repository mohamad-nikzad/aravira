import { NextResponse } from 'next/server'
import { getAllServices, createService } from '@/lib/db'
import type { Service } from '@/lib/types'
import { getTenantUser, isManagerRole } from '@/lib/server/auth/tenant'

export async function GET(request: Request) {
  try {
    const user = await getTenantUser()
    if (!user) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const all = searchParams.get('all') === '1' && isManagerRole(user.role)
    const list = await getAllServices(user.salonId, all)
    return NextResponse.json({ services: list })
  } catch (error) {
    console.error('Get services error:', error)
    return NextResponse.json({ error: 'خطای سرور. لطفاً دوباره تلاش کنید.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getTenantUser()
    if (!user || !isManagerRole(user.role)) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
    }

    const body = await request.json()
    const { name, category, duration, price, color, active } = body

    if (!name || !category || duration == null || price == null || !color) {
      return NextResponse.json({ error: 'فیلدهای الزامی ناقص است' }, { status: 400 })
    }

    const service = await createService({
      name,
      category: category as Service['category'],
      duration: Number(duration),
      price: Number(price),
      color,
      active: active !== false,
      salonId: user.salonId,
    })

    return NextResponse.json({ service })
  } catch (error: unknown) {
    console.error('Create service error:', error)
    const msg = error instanceof Error ? error.message : ''
    if (msg.includes('unique') || msg.includes('duplicate')) {
      return NextResponse.json({ error: 'این نام خدمت برای این سالن قبلاً ثبت شده است' }, { status: 409 })
    }
    return NextResponse.json({ error: 'خطای سرور. لطفاً دوباره تلاش کنید.' }, { status: 500 })
  }
}
