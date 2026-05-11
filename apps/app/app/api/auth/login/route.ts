import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { login } from '@repo/auth/auth'
import { loginSchema } from '@repo/salon-core/forms/auth'
import { validationErrorResponse } from '../../validation'

export async function POST(request: Request) {
  try {
    const parsed = loginSchema.safeParse(await request.json())
    if (!parsed.success) return validationErrorResponse(parsed.error)
    const { phone, password } = parsed.data

    const result = await login(phone, password)

    if (!result) {
      return NextResponse.json(
        { error: 'شماره موبایل یا رمز عبور اشتباه است' },
        { status: 401 }
      )
    }

    const cookieStore = await cookies()
    cookieStore.set('session', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return NextResponse.json({ user: result.user, token: result.token })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'خطای سرور. لطفاً دوباره تلاش کنید.' },
      { status: 500 }
    )
  }
}
