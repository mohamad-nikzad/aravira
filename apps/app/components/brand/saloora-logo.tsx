/* eslint-disable @next/next/no-img-element */
import { cn } from '@repo/ui/utils'

type SalooraMarkProps = {
  className?: string
  imageClassName?: string
  priority?: boolean
}

export function SalooraMark({ className, imageClassName, priority: _priority = false }: SalooraMarkProps) {
  return (
    <span className={cn('inline-flex shrink-0 items-center justify-center', className)}>
      <img
        src="/brand/saloora-mark-clean.png"
        alt=""
        className={cn('h-full w-full object-contain', imageClassName)}
      />
    </span>
  )
}

export function SalooraLogo({
  className,
  priority: _priority = false,
}: Pick<SalooraMarkProps, 'className' | 'priority'>) {
  return (
    <img
      src="/brand/saloora-logo-clean.png"
      alt="Saloora"
      className={cn('h-auto w-auto object-contain', className)}
    />
  )
}
