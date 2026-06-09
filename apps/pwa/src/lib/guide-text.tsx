import { cn } from '@repo/ui/utils'

/** One Persian run or an isolated English UI label (chip). */
export type GuideSegment = { type: 'fa' | 'en'; text: string }

export function GuideText({
  segments,
  className,
  chipClassName,
}: {
  segments: GuideSegment[]
  className?: string
  chipClassName?: string
}) {
  return (
    <span dir="rtl" className={cn('text-pretty', className)}>
      {segments.map((s, i) =>
        s.type === 'en' ? (
          <span
            key={i}
            dir="ltr"
            className={cn(
              'mx-0.5 inline-block max-w-full rounded-md border border-line-soft/70 bg-foreground/[0.05] px-1.5 py-0.5 align-middle text-[11px] font-semibold leading-snug text-foreground [unicode-bidi:isolate]',
              chipClassName,
            )}
          >
            {s.text}
          </span>
        ) : (
          <span key={i}>{s.text}</span>
        ),
      )}
    </span>
  )
}
