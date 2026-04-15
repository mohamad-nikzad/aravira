import { AuthProvider } from '@/components/auth-provider'
import { AuthGate } from '@/components/auth-gate'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <div className="flex h-dvh flex-col overflow-hidden">
        <AuthGate>{children}</AuthGate>
      </div>
    </AuthProvider>
  )
}
