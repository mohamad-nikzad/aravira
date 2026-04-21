import { redirect } from 'next/navigation'
import { getCurrentUser } from '@repo/auth/auth'

export default async function AppEntryPage() {
  const user = await getCurrentUser()
  redirect(user ? '/dashboard' : '/login')
}
