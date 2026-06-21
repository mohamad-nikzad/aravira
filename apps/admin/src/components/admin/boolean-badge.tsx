import { Badge } from '#/components/ui/badge'

export function BooleanBadge({
  value,
  trueLabel = 'بله',
  falseLabel = 'خیر',
}: {
  value: boolean
  trueLabel?: string
  falseLabel?: string
}) {
  return (
    <Badge variant={value ? 'success' : 'outline'}>
      {value ? trueLabel : falseLabel}
    </Badge>
  )
}
