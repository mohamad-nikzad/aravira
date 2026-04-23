import { AuthProvider } from '@/components/auth-provider'
import { AuthGate } from '@/components/auth-gate'
import { SwrProvider } from '@/components/swr-provider'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SwrProvider>
      <AuthProvider>
        <div className="flex h-dvh flex-col overflow-hidden">
          <AuthGate>{children}</AuthGate>
        </div>
      </AuthProvider>
    </SwrProvider>
  )
}
