'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import useSWR from 'swr'
import { useAuth } from '@/components/auth-provider'
import { BottomNav } from '@/components/bottom-nav'
import { Skeleton } from '@/components/ui/skeleton'

type OnboardingStatus = {
  steps: {
    servicesAdded: boolean
    staffAdded: boolean
  }
  completedAt: string | null
  skippedAt: string | null
}

const fetcher = (url: string) =>
  fetch(url, { credentials: 'include' }).then((res) => res.json())

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
  const { user, loading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const { data, isLoading: onboardingLoading } = useSWR<{ onboarding: OnboardingStatus }>(
    user?.role === 'manager' ? '/api/onboarding' : null,
    fetcher
  )

  const onboarding = data?.onboarding
  const managerSetupLocked =
    user?.role === 'manager' &&
    !!onboarding &&
    (!onboarding.steps.servicesAdded || !onboarding.steps.staffAdded)

  useEffect(() => {
    if (managerSetupLocked && pathname !== '/onboarding') {
      router.replace('/onboarding')
    }
  }, [managerSetupLocked, pathname, router])

  if (loading || (user?.role === 'manager' && (onboardingLoading || !data?.onboarding))) {
    return <AppShellSkeleton />
  }

  if (managerSetupLocked && pathname !== '/onboarding') {
    return <AppShellSkeleton />
  }

  return (
    <>
      <div className="flex-1 min-h-0">{children}</div>
      {!managerSetupLocked && <BottomNav />}
    </>
  )
}
