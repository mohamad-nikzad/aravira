'use client'

import { User } from '@repo/salon-core/types'
import { Avatar, AvatarFallback } from '@repo/ui/avatar'
import { cn } from '@repo/ui/utils'

interface StaffFilterProps {
  staff: User[]
  selectedIds: string[]
  onToggle: (id: string) => void
  onClear?: () => void
}

export function StaffFilter({ staff, selectedIds, onToggle, onClear }: StaffFilterProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getStaffColorClass = (color: string) => {
    const colorMap: Record<string, string> = {
      'bg-staff-1': 'bg-staff-1',
      'bg-staff-2': 'bg-staff-2',
      'bg-staff-3': 'bg-staff-3',
      'bg-staff-4': 'bg-staff-4',
      'bg-staff-5': 'bg-staff-5',
    }
    return colorMap[color] || 'bg-primary'
  }

  return (
    <div className="scrollbar-hide flex items-center gap-2 overflow-x-auto">
      <button
        type="button"
        onClick={onClear}
        aria-pressed={selectedIds.length === 0}
        className={cn(
          'flex min-h-10 shrink-0 items-center rounded-full border px-3 text-xs font-semibold transition-colors touch-manipulation',
          selectedIds.length === 0
            ? 'border-primary/40 bg-primary/10 text-foreground'
            : 'border-border/70 bg-card text-muted-foreground'
        )}
      >
        همه
      </button>
      {staff.map((member) => {
        const isSelected = selectedIds.length === 0 || selectedIds.includes(member.id)
        return (
          <button
            key={member.id}
            type="button"
            onClick={() => onToggle(member.id)}
            aria-pressed={isSelected}
            className={cn(
              'flex min-h-10 shrink-0 items-center gap-2 rounded-full border px-2.5 py-1 text-xs transition-[background-color,border-color,opacity] touch-manipulation',
              isSelected
                ? 'border-primary/40 bg-primary/8 text-foreground'
                : 'border-transparent bg-transparent text-muted-foreground opacity-50'
            )}
          >
            <Avatar className="h-6 w-6">
              <AvatarFallback className={cn('text-[10px] text-foreground font-medium', getStaffColorClass(member.color))}>
                {getInitials(member.name)}
              </AvatarFallback>
            </Avatar>
            <span className="max-w-20 truncate">{member.name.split(' ')[0]}</span>
          </button>
        )
      })}
    </div>
  )
}
