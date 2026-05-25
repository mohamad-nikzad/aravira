import { Badge } from '@repo/ui/badge'
import { APPOINTMENT_STATUS } from '@repo/salon-core/types'

type AppointmentStatus = keyof typeof APPOINTMENT_STATUS

const STATUS_TONE = {
  scheduled: 'neutral',
  confirmed: 'plum',
  completed: 'mint',
  cancelled: 'danger',
  'no-show': 'amber',
} as const satisfies Record<AppointmentStatus, string>

export function StatusPill({
  status,
  className,
}: {
  status: AppointmentStatus
  className?: string
}) {
  return (
    <Badge variant={STATUS_TONE[status]} className={className}>
      {APPOINTMENT_STATUS[status].label}
    </Badge>
  )
}
