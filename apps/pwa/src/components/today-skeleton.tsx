import { Skeleton } from '@repo/ui/skeleton'
import { Button } from '@repo/ui/button'
import { CalendarDays, Plus } from 'lucide-react'

function StatsRow({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-border/50 bg-card p-4 shadow-sm"
        >
          <Skeleton className="h-3 w-16" />
          <Skeleton className="mt-3 h-8 w-14" />
          <Skeleton className="mt-2 h-3 w-20" />
        </div>
      ))}
    </div>
  )
}

function CardShell({
  titleWidth,
  children,
}: {
  titleWidth: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card shadow-sm">
      <div className="border-b border-border/40 px-5 py-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className={`h-4 ${titleWidth}`} />
        </div>
      </div>
      <div className="space-y-3 p-4">{children}</div>
    </div>
  )
}

function AppointmentRowSkeleton() {
  return (
    <div className="rounded-2xl border border-border/60 p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-36" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <div className="mt-3 flex gap-2">
        <Skeleton className="h-8 w-14 rounded-xl" />
        <Skeleton className="h-8 w-16 rounded-xl" />
        <Skeleton className="h-8 w-14 rounded-xl" />
      </div>
    </div>
  )
}

function AttentionRowSkeleton() {
  return (
    <div className="rounded-2xl border border-border/50 bg-card/85 p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-28" />
        </div>
        <div className="flex gap-1">
          <Skeleton className="h-5 w-10 rounded-full" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
      </div>
      <Skeleton className="mt-2 h-3 w-20" />
    </div>
  )
}

function TeamRowSkeleton() {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 p-3 shadow-sm">
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-32" />
      </div>
      <Skeleton className="h-8 w-28 rounded-full" />
    </div>
  )
}

function PreviewAppointmentSkeleton() {
  return (
    <div className="rounded-2xl border border-border/60 p-3 shadow-sm">
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  )
}

export function ManagerTodaySkeleton() {
  return (
    <div className="flex h-full flex-col bg-background">
      <header className="border-b border-border/50 bg-card px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary/60" />
            <div className="space-y-2">
              <div className="text-lg font-bold">امروز</div>
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" disabled className="gap-1 opacity-100">
              <Plus className="h-4 w-4" />
              نوبت جدید
            </Button>
            <Button variant="outline" size="sm" disabled>
              تقویم
            </Button>
          </div>
        </div>
        <Skeleton className="mt-3 h-11 w-full rounded-2xl" />
      </header>

      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-4">
          <StatsRow />

          <CardShell titleWidth="w-28">
            {Array.from({ length: 2 }).map((_, i) => (
              <AttentionRowSkeleton key={i} />
            ))}
          </CardShell>

          <CardShell titleWidth="w-24">
            {Array.from({ length: 3 }).map((_, i) => (
              <AppointmentRowSkeleton key={i} />
            ))}
          </CardShell>

          <CardShell titleWidth="w-20">
            {Array.from({ length: 3 }).map((_, i) => (
              <TeamRowSkeleton key={i} />
            ))}
          </CardShell>
        </div>
      </div>
    </div>
  )
}

export function StaffTodaySkeleton() {
  return (
    <div className="flex h-full flex-col bg-background">
      <header className="border-b border-border/50 bg-card px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary/60" />
            <div className="space-y-2">
              <div className="text-lg font-bold">امروز من</div>
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
          <Button variant="outline" size="sm" disabled>
            تقویم
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-4">
          <StatsRow />

          <CardShell titleWidth="w-20">
            <div className="rounded-2xl border border-border/60 p-3">
              <div className="flex items-center justify-between gap-2">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="mt-3 h-4 w-28" />
              <Skeleton className="mt-2 h-3 w-24" />
            </div>
            <div className="rounded-2xl bg-muted/60 p-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-2 h-3 w-28" />
            </div>
          </CardShell>

          <CardShell titleWidth="w-24">
            {Array.from({ length: 3 }).map((_, i) => (
              <AppointmentRowSkeleton key={i} />
            ))}
          </CardShell>

          <CardShell titleWidth="w-20">
            {Array.from({ length: 2 }).map((_, i) => (
              <PreviewAppointmentSkeleton key={i} />
            ))}
          </CardShell>
        </div>
      </div>
    </div>
  )
}
