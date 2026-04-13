import { AuthProvider } from '@/components/auth-provider'
import { BottomNav } from '@/components/bottom-nav'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <div className="pb-16">
        {children}
      </div>
      <BottomNav />
    </AuthProvider>
  )
}
