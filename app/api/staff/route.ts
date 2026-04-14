import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getAllStaff, createUser } from '@/lib/db'
import { STAFF_COLORS } from '@/lib/types'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 401 })
    }

    const staff = await getAllStaff()
    return NextResponse.json({ staff })
  } catch (error) {
    console.error('Get staff error:', error)
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
    const { password, name, role, phone } = body

    if (!phone || !password || !name) {
      return NextResponse.json(
        { error: 'شماره موبایل، رمز عبور و نام الزامی است' },
        { status: 400 }
      )
    }

    const existingStaff = await getAllStaff()
    const colorIndex = existingStaff.length % STAFF_COLORS.length
    const color = STAFF_COLORS[colorIndex]

    const newUser = await createUser({
      phone,
      password,
      name,
      role: role || 'staff',
      color,
    })

    return NextResponse.json({ user: newUser })
  } catch (error: unknown) {
    console.error('Create staff error:', error)
    const msg = error instanceof Error ? error.message : ''
    if (msg.includes('unique') || msg.includes('duplicate')) {
      return NextResponse.json({ error: 'این شماره موبایل قبلاً ثبت شده است' }, { status: 409 })
    }
    return NextResponse.json({ error: 'خطای سرور. لطفاً دوباره تلاش کنید.' }, { status: 500 })
  }
}
