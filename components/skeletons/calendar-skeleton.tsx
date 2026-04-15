import { Skeleton } from '@/components/ui/skeleton'

export function CalendarSkeleton() {
  return (
    <div className="relative flex h-full flex-col bg-background">
      {/* CalendarHeader */}
      <header className="calendar-header-gradient flex items-center gap-2 px-3 py-2 sm:px-4">
        <div className="flex items-center gap-0.5 shrink-0">
          <span className="text-base font-bold text-primary tracking-tight ml-1.5">آراویرا</span>
        </div>
        <div className="flex-1 min-w-0 text-center">
          <Skeleton className="h-[18px] w-32 mx-auto" />
        </div>
        <div dir="ltr" className="flex items-center gap-0.5 shrink-0">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-6 w-10 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </header>

      {/* View toggle bar */}
      <div className="flex items-center gap-2 border-b border-border/50 bg-card/80 px-3 py-1.5 sm:px-4">
        <div className="flex items-center rounded-lg bg-muted/70 p-0.5">
          {['روز', 'هفته', 'ماه', 'لیست'].map((label) => (
            <div
              key={label}
              className="rounded-md px-3 py-1.5 text-[11px] font-semibold text-muted-foreground/50"
            >
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Calendar area skeleton */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex-1 p-2 space-y-0">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex items-stretch border-b border-border/30">
              <div className="w-12 shrink-0 py-2 pr-1">
                <Skeleton className="h-3 w-8 mr-auto" />
              </div>
              <div className="flex-1 py-2 px-1">
                {i % 3 === 0 && (
                  <Skeleton className="h-8 w-full rounded-md" />
                )}
                {i % 5 === 0 && i % 3 !== 0 && (
                  <Skeleton className="h-12 w-3/4 rounded-md" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
