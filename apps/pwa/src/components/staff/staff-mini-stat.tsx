import { toPersianDigits } from '@repo/salon-core/persian-digits'
import { cn } from '@repo/ui/utils'

interface StaffMiniStatProps {
  label: string
  value: number
  color: string
  className?: string
}

export function StaffMiniStat({
  label,
  value,
  color,
  className,
}: StaffMiniStatProps) {
  return (
    <div
      className={cn(
        'flex-1 rounded-[14px] border border-line-soft bg-paper px-3 py-2.5',
        className,
      )}
    >
      <div
        className="text-xl font-extrabold tabular-nums tracking-tight"
        style={{ color }}
      >
        {toPersianDigits(value)}
      </div>
      <div className="mt-0.5 text-[10px] text-muted-foreground">{label}</div>
    </div>
  )
}
