import { NextResponse } from 'next/server'
import type { ZodError } from 'zod'

export function validationErrorResponse(error: ZodError) {
  return NextResponse.json(
    { error: error.issues[0]?.message ?? 'داده نامعتبر' },
    { status: 400 },
  )
}
