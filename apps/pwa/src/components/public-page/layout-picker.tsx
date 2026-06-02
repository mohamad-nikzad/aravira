import { Check, LayoutGrid, List } from 'lucide-react'
import { cn } from '@repo/ui/utils'
import { PUBLIC_LAYOUTS } from '@repo/salon-core/public-layouts'

export function LayoutPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (id: string) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {PUBLIC_LAYOUTS.map((lay) => {
        const active = lay.id === value
        const Icon = lay.id === 'agenda' ? LayoutGrid : List
        return (
          <button
            key={lay.id}
            type="button"
            onClick={() => onChange(lay.id)}
            className={cn(
              'flex flex-col gap-1.5 rounded-xl border-2 p-3 text-right transition',
              active
                ? 'border-foreground bg-muted/40'
                : 'border-transparent bg-muted/20',
            )}
          >
            <div className="flex items-center justify-between">
              <Icon className="h-4 w-4" />
              {active ? (
                <span className="grid h-4 w-4 place-items-center rounded-full bg-foreground text-background">
                  <Check className="h-2.5 w-2.5" />
                </span>
              ) : null}
            </div>
            <span className="text-xs font-semibold">{lay.name}</span>
            <span className="text-[10px] leading-4 text-muted-foreground">
              {lay.description}
            </span>
          </button>
        )
      })}
    </div>
  )
}
