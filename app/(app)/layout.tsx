import { AuthProvider } from '@/components/auth-provider'
import { BottomNav } from '@/components/bottom-nav'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <div className="flex h-dvh flex-col overflow-hidden">
        <div className="flex-1 min-h-0">
          {children}
        </div>
        <BottomNav />
      </div>
    </AuthProvider>
  )
}
