import { brand } from '@repo/brand'
import { cn } from '@repo/ui/utils'

type SalunaMarkProps = {
  className?: string
  imageClassName?: string
}

/** Saluna mark; asset paths come from `@repo/brand`. */
export function SalunaMark({ className, imageClassName }: SalunaMarkProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center',
        className,
      )}
    >
      <img
        src={brand.assets.markClean}
        alt=""
        className={cn('h-full w-full object-contain', imageClassName)}
      />
    </span>
  )
}
