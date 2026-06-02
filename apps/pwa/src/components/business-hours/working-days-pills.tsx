import {
  isWorkingDayOpen,
  toggleWorkingDay,
  WORKING_DAY_PILLS,
} from '@repo/salon-core/working-days'
import { cn } from '@repo/ui/utils'

type WorkingDaysPillsProps = {
  workingDays: number
  onWorkingDaysChange: (value: number) => void
}

export function WorkingDaysPills({
  workingDays,
  onWorkingDaysChange,
}: WorkingDaysPillsProps) {
  return (
    <div className="flex justify-between gap-1.5">
      {WORKING_DAY_PILLS.map((day) => {
        const on = isWorkingDayOpen(workingDays, day.bit)
        return (
          <button
            key={day.bit}
            type="button"
            onClick={() =>
              onWorkingDaysChange(toggleWorkingDay(workingDays, day.bit))
            }
            aria-pressed={on}
            className={cn(
              'flex size-11 items-center justify-center rounded-full text-sm font-bold transition-colors',
              on
                ? 'bg-primary text-primary-foreground'
                : 'bg-blush-soft text-sage-deep',
            )}
          >
            {day.label}
          </button>
        )
      })}
    </div>
  )
}
