import { NextResponse } from 'next/server'
import { getCurrentUser } from '@repo/auth/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'وارد نشده‌اید' },
        { status: 401 }
      )
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json(
      { error: 'خطای سرور. لطفاً دوباره تلاش کنید.' },
      { status: 500 }
    )
  }
}
