'use client'

import { User } from '@/lib/types'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface StaffFilterProps {
  staff: User[]
  selectedIds: string[]
  onToggle: (id: string) => void
}

export function StaffFilter({ staff, selectedIds, onToggle }: StaffFilterProps) {
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
    <div className="flex items-center gap-1 overflow-x-auto px-4 py-2 border-b">
      <span className="shrink-0 text-xs text-muted-foreground mr-2">فیلتر:</span>
      {staff.map((member) => {
        const isSelected = selectedIds.length === 0 || selectedIds.includes(member.id)
        return (
          <button
            key={member.id}
            onClick={() => onToggle(member.id)}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-1 text-xs transition-all',
              isSelected
                ? 'border-primary/50 bg-primary/10'
                : 'border-border bg-card opacity-50 hover:opacity-75'
            )}
          >
            <Avatar className="h-5 w-5">
              <AvatarFallback className={cn('text-[10px] text-foreground', getStaffColorClass(member.color))}>
                {getInitials(member.name)}
              </AvatarFallback>
            </Avatar>
            <span className="hidden sm:inline">{member.name.split(' ')[0]}</span>
          </button>
        )
      })}
    </div>
  )
}
