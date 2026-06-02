import type { ReactNode } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@repo/ui/sheet'
import { cn } from '@repo/ui/utils'

export function BottomDrawer({
  trigger,
  title,
  padded = false,
  children,
}: {
  trigger: ReactNode
  title: string
  padded?: boolean
  children: ReactNode
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent
        side="bottom"
        className="flex max-h-[88dvh] flex-col gap-0 p-0"
      >
        <SheetHeader className="border-b py-4 pr-12 pl-5">
          <SheetTitle className="text-right">{title}</SheetTitle>
        </SheetHeader>
        <div className={cn('flex-1 overflow-auto', padded && 'px-5 py-5')}>
          {children}
        </div>
      </SheetContent>
    </Sheet>
  )
}
