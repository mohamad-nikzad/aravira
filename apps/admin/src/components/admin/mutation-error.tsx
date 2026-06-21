import { CircleAlert } from 'lucide-react'

import { Alert, AlertDescription } from '#/components/ui/alert'

export function MutationError({ error }: { error: unknown }) {
  if (!error) return null
  return (
    <Alert variant="destructive">
      <CircleAlert data-icon="inline-start" />
      <AlertDescription>
        {error instanceof Error ? error.message : 'عملیات ناموفق بود.'}
      </AlertDescription>
    </Alert>
  )
}
