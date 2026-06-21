import { CircleCheck } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Alert, AlertDescription } from '#/components/ui/alert'

export function useMutationSuccess() {
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!message) return
    const timer = window.setTimeout(() => setMessage(null), 3000)
    return () => window.clearTimeout(timer)
  }, [message])

  return {
    successMessage: message,
    showSuccess: (nextMessage: string) => setMessage(nextMessage),
    clearSuccess: () => setMessage(null),
  }
}

export function MutationSuccess({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <Alert className="border-success/50 text-success [&>svg]:text-success">
      <CircleCheck data-icon="inline-start" />
      <AlertDescription role="status">{message}</AlertDescription>
    </Alert>
  )
}
