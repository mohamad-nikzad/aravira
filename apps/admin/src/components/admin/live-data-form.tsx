import { CircleAlert } from 'lucide-react'

import { FormField } from '#/components/admin/form-field'
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

export function LiveConfirmationInput({ show }: { show: boolean }) {
  if (!show) return null
  return (
    <FormField
      label="تأیید داده LIVE"
      name="liveConfirmation"
      placeholder="LIVE"
      pattern="LIVE"
      required
    />
  )
}

export function liveConfirmationFromForm(form: FormData, isLiveData: boolean) {
  if (!isLiveData) return undefined
  return String(form.get('liveConfirmation') ?? '')
}
