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

    const staff = getAllStaff()
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
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 401 })
    }

    const body = await request.json()
    const { email, password, name, role, phone } = body

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'ایمیل، رمز عبور و نام الزامی است' },
        { status: 400 }
      )
    }

    // Assign a color based on existing staff count
    const existingStaff = getAllStaff()
    const colorIndex = existingStaff.length % STAFF_COLORS.length
    const color = STAFF_COLORS[colorIndex]

    const newUser = createUser({
      email,
      password,
      name,
      role: role || 'staff',
      color,
      phone,
    })

    return NextResponse.json({ user: newUser })
  } catch (error) {
    console.error('Create staff error:', error)
    return NextResponse.json({ error: 'خطای سرور. لطفاً دوباره تلاش کنید.' }, { status: 500 })
  }
}
