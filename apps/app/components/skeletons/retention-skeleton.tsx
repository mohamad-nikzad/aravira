import { Skeleton } from '@repo/ui/skeleton'

function RetentionCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border/50 bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-6 w-14 rounded-full" />
      </div>

      <Skeleton className="mt-4 h-3 w-full" />
      <Skeleton className="mt-2 h-3 w-3/4" />

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-12" />
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Skeleton className="h-9 w-20 rounded-xl" />
        <Skeleton className="h-9 w-18 rounded-xl" />
        <Skeleton className="h-9 w-24 rounded-xl" />
        <Skeleton className="h-9 w-14 rounded-xl" />
      </div>
    </div>
  )
}

export function RetentionSkeleton() {
  return (
    <div className="flex h-full flex-col bg-background">
      <header className="flex items-start gap-3 border-b border-border/50 bg-card px-3 py-3">
        <Skeleton className="h-10 w-10 rounded-2xl shrink-0" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="text-lg font-bold">پیگیری مشتریان</div>
          <Skeleton className="h-3 w-56" />
          <Skeleton className="h-3 w-44" />
        </div>
      </header>

      <div className="flex-1 space-y-3 overflow-auto p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <RetentionCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
