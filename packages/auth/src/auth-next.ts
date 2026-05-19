import { cookies } from 'next/headers'
import type { User } from '@repo/salon-core/types'
import { getUserFromToken } from './auth'

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('session')?.value
  if (!token) return null
  return getUserFromToken(token)
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete('session')
}
