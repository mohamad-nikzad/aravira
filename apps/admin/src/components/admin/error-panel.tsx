import { CircleAlert, RotateCcw } from 'lucide-react'

import { Alert, AlertDescription } from '#/components/ui/alert'
import { Button } from '#/components/ui/button'

export function ErrorPanel({
  message,
  onRetry,
}: {
  message: string
  onRetry?: () => void
}) {
  return (
    <Alert variant="destructive">
      <CircleAlert data-icon="inline-start" />
      <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p>{message}</p>
        {onRetry ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 border-destructive/40 text-destructive hover:bg-destructive/10"
            onClick={onRetry}
          >
            <RotateCcw data-icon="inline-start" />
            تلاش مجدد
          </Button>
        ) : null}
      </AlertDescription>
    </Alert>
  )
}
