import { brand } from '@repo/brand'
import { cn } from '@repo/ui/utils'

type SalooraMarkProps = {
  className?: string
  imageClassName?: string
}

/** Cherry-blossom mark; asset paths come from `@repo/brand`. */
export function SalooraMark({ className, imageClassName }: SalooraMarkProps) {
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
