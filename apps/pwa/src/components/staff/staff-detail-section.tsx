import type { LucideIcon } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { cn } from '@repo/ui/utils'

interface StaffDetailSectionProps {
  title: string
  icon: LucideIcon
  action?: React.ReactNode
  children: React.ReactNode
  last?: boolean
  className?: string
}

export function StaffDetailSection({
  title,
  icon: Icon,
  action,
  children,
  last,
  className,
}: StaffDetailSectionProps) {
  return (
    <section
      className={cn(
        'border-b border-line-soft px-[18px] pt-3.5 pb-1',
        last && 'border-b-0',
        className,
      )}
    >
      <div className="mb-2.5 flex items-center gap-2">
        <Icon className="size-3.5 shrink-0 text-primary" strokeWidth={1.8} />
        <h2 className="flex-1 text-[12.5px] font-bold tracking-tight text-foreground">
          {title}
        </h2>
        {action}
      </div>
      <div className="pb-3.5">{children}</div>
    </section>
  )
}

export function StaffReadonlyField({
  label,
  value,
  hint,
  dir,
}: {
  label: string
  value: React.ReactNode
  hint?: string
  dir?: 'ltr' | 'rtl'
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="text-[11px] font-semibold text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          'rounded-xl border border-line bg-paper px-3 py-2.5 text-sm font-semibold text-foreground',
          dir === 'ltr' && 'tabular-nums',
        )}
        dir={dir}
      >
        {value}
      </div>
      {hint ? (
        <p className="text-[10.5px] leading-relaxed text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

export function StaffSectionAction({
  children,
  onClick,
}: {
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      className="h-8 shrink-0 rounded-xl px-2.5 text-xs font-bold touch-manipulation"
    >
      {children}
    </Button>
  )
}
