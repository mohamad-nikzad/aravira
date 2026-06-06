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
  const toggleDay = (bit: number) =>
    onWorkingDaysChange(toggleWorkingDay(workingDays, bit))

  return (
    <div className="space-y-2">
      <div className="flex justify-between gap-1.5">
        {WORKING_DAY_PILLS.map((day) => {
          const on = isWorkingDayOpen(workingDays, day.bit)
          return (
            <button
              key={day.bit}
              type="button"
              onClick={() => toggleDay(day.bit)}
              aria-pressed={on}
              className={cn(
                'relative flex size-11 items-center justify-center overflow-hidden rounded-full text-sm font-bold transition-colors',
                on
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-blush-soft text-sage-deep',
              )}
            >
              <span>{day.label}</span>
              {!on ? (
                <span
                  aria-hidden="true"
                  className="absolute h-0.5 w-8 -rotate-[32deg] rounded-full bg-sage-deep/70"
                />
              ) : null}
            </button>
          )
        })}
      </div>
      <div className="text-center text-[11px] font-semibold text-muted-foreground">
        خط روی روز یعنی تعطیل.
      </div>
    </div>
  )
}
