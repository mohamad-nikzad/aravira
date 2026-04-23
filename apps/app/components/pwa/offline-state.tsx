'use client'

import { RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@repo/ui/alert'
import { Card, CardContent } from '@repo/ui/card'
import { formatSnapshotAge } from '@/lib/pwa-client'

type NetworkStatusBannerProps = {
  routeLabel: string
  isOnline: boolean
  hasSnapshot: boolean
  snapshotUpdatedAt?: string | null
  hasError?: boolean
  onRetry?: () => void
}

export function NetworkStatusBanner({
  routeLabel,
  isOnline,
  hasSnapshot,
  snapshotUpdatedAt,
  hasError = false,
  onRetry,
}: NetworkStatusBannerProps) {
  const snapshotAge = formatSnapshotAge(snapshotUpdatedAt)

  if (isOnline && !hasError) {
    return null
  }

  if (!isOnline && hasSnapshot) {
    return (
      <Alert className="rounded-none border-x-0 border-t-0 border-amber-300/60 bg-amber-50/80 text-amber-950 dark:bg-amber-950/25 dark:text-amber-100">
        <WifiOff className="text-amber-700 dark:text-amber-300" />
        <AlertTitle>اتصال اینترنت قطع شده است</AlertTitle>
        <AlertDescription className="text-amber-900/85 dark:text-amber-100/85">
          <p>
            {routeLabel} با آخرین داده ذخیره شده نمایش داده می‌شود
            {snapshotAge ? `، همگام‌سازی ${snapshotAge}` : ''}.
          </p>
          {onRetry ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2 h-8 border-amber-300/70 bg-transparent text-amber-900 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-100 dark:hover:bg-amber-900/40"
              onClick={onRetry}
            >
              تلاش دوباره
            </Button>
          ) : null}
        </AlertDescription>
      </Alert>
    )
  }

  if (!isOnline) {
    return (
      <Alert variant="destructive" className="rounded-none border-x-0 border-t-0">
        <WifiOff />
        <AlertTitle>این بخش بدون اینترنت در دسترس نیست</AlertTitle>
        <AlertDescription>
          <p>برای بارگذاری {routeLabel} باید دوباره به اینترنت متصل شوید.</p>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert className="rounded-none border-x-0 border-t-0 border-primary/20 bg-primary/5">
      <Wifi className="text-primary" />
      <AlertTitle>بارگذاری زنده کامل نشد</AlertTitle>
      <AlertDescription>
        <p>
          {hasSnapshot
            ? `${routeLabel} فعلا با آخرین داده ذخیره شده نمایش داده می‌شود.`
            : `بارگذاری ${routeLabel} کامل نشد. دوباره تلاش کنید.`}
        </p>
        {onRetry ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2 h-8"
            onClick={onRetry}
          >
            <RefreshCw className="ml-1 h-3.5 w-3.5" />
            تازه‌سازی
          </Button>
        ) : null}
      </AlertDescription>
    </Alert>
  )
}

type OfflineStateCardProps = {
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export function OfflineStateCard({
  title,
  description,
  actionLabel = 'تلاش دوباره',
  onAction,
}: OfflineStateCardProps) {
  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-sm border-border/60 shadow-sm">
        <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <WifiOff className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-semibold">{title}</h2>
            <p className="text-sm leading-6 text-muted-foreground">{description}</p>
          </div>
          {onAction ? (
            <Button type="button" variant="outline" className="mt-1" onClick={onAction}>
              {actionLabel}
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
