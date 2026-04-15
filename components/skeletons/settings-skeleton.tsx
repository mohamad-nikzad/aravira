import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export function SettingsSkeleton() {
  return (
    <div className="flex h-full flex-col bg-background">
      <header className="flex items-center gap-4 bg-card px-4 py-3 border-b border-border/50">
        <h1 className="text-lg font-bold">تنظیمات</h1>
      </header>

      <div className="flex-1 overflow-auto p-4 space-y-3">
        {/* Profile card */}
        <Card className="border-border/50">
          <CardContent className="flex items-center gap-4 py-4">
            <Skeleton className="h-14 w-14 rounded-full shrink-0" />
            <div className="flex-1 min-w-0 space-y-2">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-5 w-12 rounded-full" />
            </div>
          </CardContent>
        </Card>

        {/* Management card */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <Skeleton className="h-4 w-14" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-10 w-full rounded-md" />
          </CardContent>
        </Card>

        {/* Business hours card */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <Skeleton className="h-4 w-20" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Skeleton className="h-3.5 w-10" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3.5 w-10" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
            <Skeleton className="h-9 w-full rounded-md" />
          </CardContent>
        </Card>

        {/* Services card */}
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-8 w-16 rounded-md" />
          </CardHeader>
          <CardContent className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl border border-border/50 px-3 py-2.5"
              >
                <div className="flex-1 min-w-0 space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-8 w-8 rounded-md shrink-0" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Appearance card */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <Skeleton className="h-4 w-10" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-5 w-9 rounded-full" />
            </div>
          </CardContent>
        </Card>

        {/* Logout card */}
        <Card className="border-border/50">
          <CardContent className="py-3">
            <Skeleton className="h-10 w-full rounded-md" />
          </CardContent>
        </Card>

        <div className="text-center pt-4 pb-2">
          <p className="text-xs font-medium text-muted-foreground/60">آراویرا</p>
          <p className="text-[10px] text-muted-foreground/40">نسخه ۱.۰.۰</p>
        </div>
      </div>
    </div>
  )
}
