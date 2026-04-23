import { redirect } from 'next/navigation'
import { getCurrentUser } from '@repo/auth/auth'
import { homePathForRole } from '@/lib/navigation'

export default async function AppEntryPage() {
  const user = await getCurrentUser()
  redirect(user ? homePathForRole(user.role) : '/login')
}
