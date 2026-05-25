import type * as React from 'react'

import { cn } from '@repo/ui/utils'

type PageHeaderProps = {
  title: React.ReactNode
  subtitle?: React.ReactNode
  right?: React.ReactNode
  sticky?: boolean
  className?: string
}

export function PageHeader({
  title,
  subtitle,
  right,
  sticky = true,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'border-b border-line-soft bg-card px-5 pt-3.5 pb-4',
        sticky && 'sticky top-0 z-10',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-[22px] font-extrabold tracking-tight text-foreground">
            {title}
          </div>
          {subtitle && (
            <div className="mt-0.5 text-[13px] text-muted-foreground">
              {subtitle}
            </div>
          )}
        </div>
        {right}
      </div>
    </div>
  )
}
