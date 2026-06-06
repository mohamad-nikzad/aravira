import type { LucideIcon } from 'lucide-react'
import { cn } from '@repo/ui/utils'

interface StaffRosterChipProps {
  icon: LucideIcon
  children: React.ReactNode
  muted?: boolean
}

export function StaffRosterChip({
  icon: Icon,
  children,
  muted,
}: StaffRosterChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10.5px] font-semibold',
        muted
          ? 'bg-paper-deep text-muted-foreground'
          : 'bg-paper text-sage-deep',
      )}
    >
      <Icon className="size-[11px] shrink-0" strokeWidth={1.9} />
      {children}
    </span>
  )
}
