import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getAllServices, createService } from '@/lib/db'
import type { Service } from '@/lib/types'

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const all = searchParams.get('all') === '1' && user.role === 'manager'
    const list = await getAllServices(all)
    return NextResponse.json({ services: list })
  } catch (error) {
    console.error('Get services error:', error)
    return NextResponse.json({ error: 'خطای سرور. لطفاً دوباره تلاش کنید.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'manager') {
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
    })

    return NextResponse.json({ service })
  } catch (error) {
    console.error('Create service error:', error)
    return NextResponse.json({ error: 'خطای سرور. لطفاً دوباره تلاش کنید.' }, { status: 500 })
  }
}
