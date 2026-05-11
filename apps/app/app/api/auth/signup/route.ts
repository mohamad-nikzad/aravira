import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSession } from '@repo/auth/auth'
import {
  createSalonWorkspace,
  SignupConflictError,
  SignupValidationError,
} from '@/lib/server/salons/signup'
import { signupSchema } from '@repo/salon-core/forms/auth'
import { validationErrorResponse } from '../../validation'

export async function POST(request: Request) {
  try {
    const parsed = signupSchema.safeParse(await request.json())
    if (!parsed.success) return validationErrorResponse(parsed.error)
    const result = await createSalonWorkspace(parsed.data)

    const token = await createSession(result.user.id)
    const cookieStore = await cookies()
    cookieStore.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return NextResponse.json({
      salon: result.salon,
      user: result.user,
      token,
      redirectTo: '/onboarding',
    })
  } catch (error) {
    if (error instanceof SignupValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    if (error instanceof SignupConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }

    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'خطای سرور. لطفاً دوباره تلاش کنید.' },
      { status: 500 }
    )
  }
}
