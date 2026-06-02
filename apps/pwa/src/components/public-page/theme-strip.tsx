import { Check } from 'lucide-react'
import { cn } from '@repo/ui/utils'
import { PUBLIC_THEMES } from '@repo/salon-core/public-themes'

export function ThemeStrip({
  value,
  onChange,
}: {
  value: string
  onChange: (id: string) => void
}) {
  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {PUBLIC_THEMES.map((th) => {
        const active = th.id === value
        return (
          <button
            key={th.id}
            type="button"
            onClick={() => onChange(th.id)}
            className={cn(
              'flex shrink-0 flex-col items-center gap-1.5 rounded-2xl border-2 p-2 transition',
              active ? 'border-foreground' : 'border-transparent',
            )}
          >
            <div
              className="relative h-14 w-14 rounded-xl"
              style={{ background: th.swatch }}
            >
              {active && (
                <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-foreground text-background ring-2 ring-card">
                  <Check className="h-3 w-3" />
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium">{th.name}</span>
          </button>
        )
      })}
    </div>
  )
}
