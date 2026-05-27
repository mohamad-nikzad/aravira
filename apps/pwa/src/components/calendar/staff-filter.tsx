import type { User } from '@repo/salon-core/types'
import { normalizeCalendarColorId } from '@repo/salon-core/calendar-colors'
import { cn } from '@repo/ui/utils'

interface StaffFilterProps {
  staff: User[]
  selectedIds: string[]
  onToggle: (id: string) => void
  onClear?: () => void
}

export function StaffFilter({
  staff,
  selectedIds,
  onToggle,
  onClear,
}: StaffFilterProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const allActive = selectedIds.length === 0

  return (
    <div className="scrollbar-hide flex items-center gap-2 overflow-x-auto py-1">
      <button
        type="button"
        onClick={onClear}
        aria-pressed={allActive}
        className={cn(
          'flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors touch-manipulation',
          allActive
            ? 'border-transparent bg-primary text-primary-foreground'
            : 'border-line-soft bg-muted text-foreground',
        )}
      >
        <span
          className={cn(
            'flex size-5 items-center justify-center rounded-full text-[9px] font-bold',
            allActive ? 'bg-white/25 text-white' : 'bg-primary/15 text-primary',
          )}
        >
          ه
        </span>
        همه
      </button>
      {staff.map((member) => {
        const isSelected = selectedIds.includes(member.id)
        const colorVar = `var(--calendar-${normalizeCalendarColorId(member.color)})`
        return (
          <button
            key={member.id}
            type="button"
            onClick={() => onToggle(member.id)}
            aria-pressed={isSelected}
            style={isSelected ? { backgroundColor: colorVar } : undefined}
            className={cn(
              'flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors touch-manipulation',
              isSelected
                ? 'border-transparent text-white'
                : 'border-line-soft bg-muted text-foreground',
            )}
          >
            <span
              className="flex size-5 items-center justify-center rounded-full text-[9px] font-bold"
              style={
                isSelected
                  ? { backgroundColor: 'rgba(255,255,255,0.25)', color: '#fff' }
                  : {
                      backgroundColor: `color-mix(in oklch, ${colorVar} 18%, transparent)`,
                      color: colorVar,
                    }
              }
            >
              {getInitials(member.name)}
            </span>
            <span className="max-w-20 truncate">
              {member.name.split(' ')[0]}
            </span>
          </button>
        )
      })}
    </div>
  )
}
