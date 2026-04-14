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
    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
      {staff.map((member) => {
        const isSelected = selectedIds.length === 0 || selectedIds.includes(member.id)
        return (
          <button
            key={member.id}
            onClick={() => onToggle(member.id)}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-1 text-xs transition-all touch-manipulation',
              isSelected
                ? 'border-primary/40 bg-primary/8 text-foreground'
                : 'border-transparent bg-transparent text-muted-foreground opacity-50'
            )}
          >
            <Avatar className="h-5 w-5">
              <AvatarFallback className={cn('text-[9px] text-foreground font-medium', getStaffColorClass(member.color))}>
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
