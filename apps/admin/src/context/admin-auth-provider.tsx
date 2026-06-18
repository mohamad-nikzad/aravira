import type { AdminMeResponse } from '@repo/api-client/types'
import type { ReactNode } from 'react'
import { createContext, useContext } from 'react'

type AdminAuthContextValue = {
  me: AdminMeResponse['user']
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null)

export function AdminAuthProvider({
  me,
  children,
}: {
  me: AdminMeResponse['user']
  children: ReactNode
}) {
  return <AdminAuthContext.Provider value={{ me }}>{children}</AdminAuthContext.Provider>
}

export function useAdminAuth() {
  const value = useContext(AdminAuthContext)
  if (!value) throw new Error('useAdminAuth must be used inside AdminAuthProvider')
  return value
}
