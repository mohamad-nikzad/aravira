import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Plus, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

function StaffRowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Skeleton className="h-10 w-10 rounded-full shrink-0" />
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  )
}

export function StaffSkeleton() {
  return (
    <div className="flex h-full flex-col bg-background">
      <header className="flex items-center justify-between gap-4 bg-card px-4 py-3 border-b border-border/50">
        <h1 className="text-lg font-bold">پرسنل</h1>
        <Button size="sm" disabled className="gap-1.5 touch-manipulation">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">پرسنل جدید</span>
        </Button>
      </header>

      <div className="bg-card px-4 pb-3">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="جستجوی پرسنل..."
            disabled
            className="pr-9 h-10 bg-muted/50 border-0"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="divide-y divide-border/50">
          {Array.from({ length: 6 }).map((_, i) => (
            <StaffRowSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
