'use client'

import { useAuth } from '@/components/auth-provider'
import { BottomNav } from '@/components/bottom-nav'
import { Skeleton } from '@/components/ui/skeleton'

function AppShellSkeleton() {
  return (
    <>
      <div className="flex-1 min-h-0">
        <div className="flex h-full flex-col bg-background">
          <div className="flex items-center gap-4 bg-card px-4 py-3 border-b border-border/50">
            <Skeleton className="h-6 w-20" />
          </div>
          <div className="flex-1 p-4 space-y-3">
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        </div>
      </div>
      <nav className="shrink-0 border-t border-border/60 bg-card safe-area-pb">
        <div className="mx-auto flex max-w-lg items-stretch justify-around">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex min-h-[52px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-1.5"
            >
              <Skeleton className="h-7 w-7 rounded-lg" />
              <Skeleton className="h-3 w-8 rounded" />
            </div>
          ))}
        </div>
      </nav>
    </>
  )
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth()

  if (loading) {
    return <AppShellSkeleton />
  }

  return (
    <>
      <div className="flex-1 min-h-0">{children}</div>
      <BottomNav />
    </>
  )
}
