import { Skeleton } from '@repo/ui/skeleton'

function StatBlockSkeleton() {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-3">
      <Skeleton className="h-3 w-16" />
      <Skeleton className="mt-2 h-6 w-12" />
    </div>
  )
}

function HistoryRowSkeleton() {
  return (
    <div className="rounded-2xl border border-border/50 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-36" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
    </div>
  )
}

export function ClientSummarySkeleton() {
  return (
    <div className="flex h-full flex-col bg-background">
      <header className="flex items-center gap-3 border-b border-border/50 bg-card px-3 py-3">
        <Skeleton className="h-10 w-10 rounded-2xl shrink-0" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="text-lg font-bold">پروفایل مشتری</div>
          <Skeleton className="h-3 w-28" />
        </div>
        <Skeleton className="h-9 w-20 rounded-xl shrink-0" />
      </header>

      <div className="flex-1 space-y-3 overflow-auto p-4">
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-10 w-20 rounded-xl" />
          <Skeleton className="h-10 w-24 rounded-xl" />
        </div>

        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-14 rounded-full" />
        </div>

        <div className="rounded-2xl border border-border/50 bg-card p-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-3 h-3 w-full" />
          <Skeleton className="mt-2 h-3 w-4/5" />
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <StatBlockSkeleton key={i} />
          ))}
        </div>

        <div className="rounded-2xl border border-border/50 bg-card p-4">
          <Skeleton className="h-4 w-28" />
          <div className="mt-4 space-y-3">
            <HistoryRowSkeleton />
            <HistoryRowSkeleton />
          </div>
        </div>

        <div className="rounded-2xl border border-border/50 bg-card p-4">
          <Skeleton className="h-4 w-24" />
          <div className="mt-4 space-y-3">
            <HistoryRowSkeleton />
            <HistoryRowSkeleton />
          </div>
        </div>
      </div>
    </div>
  )
}
