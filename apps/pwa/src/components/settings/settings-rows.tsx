import { Link } from '@tanstack/react-router'
import { ChevronLeft } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Badge } from '@repo/ui/badge'
import type { badgeVariants } from '@repo/ui/badge'
import { Switch } from '@repo/ui/switch'
import { Spinner } from '@repo/ui/spinner'
import { cn } from '@repo/ui/utils'
import type { VariantProps } from 'class-variance-authority'

type BadgeTone = NonNullable<VariantProps<typeof badgeVariants>['variant']>

type SettingsRowProps = {
  icon: LucideIcon
  label: string
  hint?: string
  to?: string
  href?: string
  onClick?: () => void
  badge?: string
  badgeTone?: BadgeTone
  danger?: boolean
  loading?: boolean
  disabled?: boolean
}

export function SettingsRow({
  icon: Icon,
  label,
  hint,
  to,
  href,
  onClick,
  badge,
  badgeTone = 'plum',
  danger,
  loading,
  disabled,
}: SettingsRowProps) {
  const inner = (
    <>
      <div
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-xl',
          danger
            ? 'bg-destructive-soft text-destructive'
            : 'bg-blush-soft text-plum-deep',
        )}
      >
        {loading ? (
          <Spinner className="size-[18px]" />
        ) : (
          <Icon className="size-[18px]" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div
          className={cn(
            'text-sm font-semibold',
            danger ? 'text-destructive' : 'text-foreground',
          )}
        >
          {label}
        </div>
        {hint ? (
          <div className="mt-0.5 text-[11px] text-muted-foreground">{hint}</div>
        ) : null}
      </div>
      {badge ? <Badge variant={badgeTone}>{badge}</Badge> : null}
      {!danger ? (
        <ChevronLeft className="size-4 shrink-0 text-muted-foreground" />
      ) : null}
    </>
  )

  const className =
    'flex w-full touch-manipulation items-center gap-3.5 px-4 py-3.5 text-start transition-colors active:bg-accent/40 disabled:opacity-60'

  if (to) {
    return (
      <Link to={to} className={className}>
        {inner}
      </Link>
    )
  }
  if (href) {
    return (
      <a href={href} className={className}>
        {inner}
      </a>
    )
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={className}
    >
      {inner}
    </button>
  )
}

export function ToggleRow({
  icon: Icon,
  label,
  hint,
  checked,
  disabled,
  onChange,
}: {
  icon: LucideIcon
  label: string
  hint?: string
  checked: boolean
  disabled?: boolean
  onChange: (next: boolean) => void
}) {
  return (
    <div className="flex items-center gap-3.5 px-4 py-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-paper-deep text-sage-deep">
        <Icon className="size-[18px]" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-foreground">{label}</div>
        {hint ? (
          <div className="mt-0.5 text-[11px] text-muted-foreground">{hint}</div>
        ) : null}
      </div>
      <Switch
        checked={checked}
        disabled={disabled}
        onCheckedChange={onChange}
      />
    </div>
  )
}
