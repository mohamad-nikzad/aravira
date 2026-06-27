import { CircleAlert } from 'lucide-react'

import { Alert, AlertDescription } from '#/components/ui/alert'

export function LiveDataWarning({
  show,
  message,
}: {
  show: boolean
  message: string
}) {
  if (!show) return null
  return (
    <Alert>
      <CircleAlert data-icon="inline-start" />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}
