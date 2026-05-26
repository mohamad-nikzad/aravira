import { cn } from '@repo/ui/utils'

type SalooraMarkProps = {
  className?: string
  imageClassName?: string
}

export function SalooraMark({ className, imageClassName }: SalooraMarkProps) {
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
