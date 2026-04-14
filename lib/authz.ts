import { NextResponse } from 'next/server'
import type { User } from './types'

export function requireManager(user: User | null): user is User {
  return !!user && user.role === 'manager'
}

export function unauthorized(message = 'دسترسی غیرمجاز') {
  return NextResponse.json({ error: message }, { status: 401 })
}

export function forbidden(message = 'دسترسی غیرمجاز') {
  return NextResponse.json({ error: message }, { status: 403 })
}
