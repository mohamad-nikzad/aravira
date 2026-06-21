import { useEffect, useRef, useState } from 'react'
import { ArrowUp, Headphones } from 'lucide-react'
import type {
  ManagerSupportMessage,
  ManagerSupportTicketDetailResponse,
} from '@repo/api-client/types'
import { cn } from '@repo/ui/utils'
import { useAddManagerSupportMessageMutation } from '#/lib/support-ticket-queries'
import { scrollFocusedInputIntoView } from '#/lib/scroll-focused-input-into-view'

const dateTimeFormatter = new Intl.DateTimeFormat('fa-IR', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

const dayFormatter = new Intl.DateTimeFormat('fa-IR', {
  dateStyle: 'long',
})

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

/** Group messages from the same sender sent within 5 minutes of each other. */
function isGroupedWith(
  current: ManagerSupportMessage,
  previous: ManagerSupportMessage | undefined,
): boolean {
  if (!previous) return false
  if (previous.authorKind !== current.authorKind) return false
  const gap =
    new Date(current.createdAt).getTime() -
    new Date(previous.createdAt).getTime()
  return gap < 5 * 60 * 1000
}

const MAX_COMPOSER_HEIGHT_PX = 128

function resizeComposer(element: HTMLTextAreaElement) {
  element.style.height = 'auto'
  element.style.height = `${Math.min(element.scrollHeight, MAX_COMPOSER_HEIGHT_PX)}px`
}

// ---------------------------------------------------------------------------
// Message bubble
// ---------------------------------------------------------------------------

export function SupportMessageBubble({
  message,
  grouped,
}: {
  message: ManagerSupportMessage
  grouped: boolean
}) {
  const platform = message.authorKind === 'platform'
  const author = platform ? 'پشتیبانی سالونا' : message.authorDisplayName

  return (
    <article
      className={cn(
        'flex items-end gap-2',
        platform ? 'justify-start' : 'justify-end',
        grouped ? 'mt-0.5' : 'mt-3',
      )}
    >
      {/* Avatar column – always occupies space on platform side so bubbles align */}
      {platform ? (
        <div
          aria-hidden="true"
          className={cn(
            'mb-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-blush-soft',
            grouped && 'invisible',
          )}
        >
          <Headphones className="size-3.5 text-plum-deep" />
        </div>
      ) : null}

      <div
        className={cn(
          'max-w-[80%] px-3.5 py-2.5',
          platform
            ? cn(
                'rounded-2xl bg-card ring-1 ring-inset ring-line-soft',
                grouped ? '' : 'rounded-tr-sm',
              )
            : cn(
                'rounded-2xl bg-primary text-primary-foreground',
                grouped ? '' : 'rounded-tl-sm',
              ),
        )}
      >
        {!grouped && (
          <p
            className={cn(
              'mb-1 text-[11px] font-semibold leading-none',
              platform ? 'text-plum-deep' : 'text-primary-foreground/70',
            )}
          >
            {author}
          </p>
        )}

        <p className="whitespace-pre-wrap wrap-break-word text-sm leading-relaxed">
          {message.body}
        </p>

        <time
          dateTime={message.createdAt}
          className={cn(
            'mt-1.5 block text-[10px] leading-none',
            platform ? 'text-muted-foreground' : 'text-primary-foreground/60',
          )}
        >
          {dateTimeFormatter.format(new Date(message.createdAt))}
        </time>
      </div>
    </article>
  )
}

// ---------------------------------------------------------------------------
// Date separator
// ---------------------------------------------------------------------------

function DateSeparator({ date }: { date: Date }) {
  return (
    <div
      role="separator"
      aria-label={dayFormatter.format(date)}
      className="my-4 flex items-center gap-3"
    >
      <div className="h-px flex-1 bg-line-soft" />
      <span className="rounded-full bg-muted/60 px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground">
        {dayFormatter.format(date)}
      </span>
      <div className="h-px flex-1 bg-line-soft" />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Composer
// ---------------------------------------------------------------------------

export function SupportMessageComposer({
  ticketId,
  resolved,
}: {
  ticketId: string
  resolved: boolean
}) {
  const [draft, setDraft] = useState('')
  const submittingRef = useRef(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const mutation = useAddManagerSupportMessageMutation(ticketId)
  const canSend = draft.trim().length > 0 && !mutation.isPending
  const hasText = draft.trim().length > 0

  useEffect(() => {
    const element = textareaRef.current
    if (element) resizeComposer(element)
  }, [draft])

  const submit = async () => {
    const body = draft.trim()
    if (!body || mutation.isPending || submittingRef.current) return
    submittingRef.current = true
    try {
      await mutation.mutateAsync(body)
      setDraft('')
      const element = textareaRef.current
      if (element) element.style.height = 'auto'
    } catch {
      /* retain draft */
    } finally {
      submittingRef.current = false
    }
  }

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    void submit()
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void submit()
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="sticky bottom-0 z-10 shrink-0 border-t border-line-soft bg-card/95 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur supports-backdrop-filter:bg-card/80"
    >
      {resolved ? (
        <div className="mb-3 flex items-center gap-2 rounded-xl bg-amber-soft px-3 py-2">
          <span className="text-[11px] leading-5 text-amber-fg">
            این درخواست حل‌شده است؛ ارسال پاسخ آن را دوباره باز می‌کند.
          </span>
        </div>
      ) : null}

      {/* Unified pill – textarea + send button live inside together */}
      <div
        className={cn(
          'flex items-end gap-1 rounded-2xl border p-1 transition-all duration-200',
          hasText
            ? 'border-primary/40 bg-muted/50'
            : 'border-line-soft bg-muted/30 focus-within:border-primary/35 focus-within:bg-muted/40',
        )}
      >
        <label htmlFor="support-reply" className="sr-only">
          پاسخ شما
        </label>
        <textarea
          ref={textareaRef}
          id="support-reply"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          onFocus={(event) => scrollFocusedInputIntoView(event.target)}
          maxLength={4000}
          rows={1}
          disabled={mutation.isPending}
          placeholder="پیام…"
          className="max-h-32 min-h-8 flex-1 resize-none bg-transparent px-3 py-2 text-sm leading-relaxed outline-none placeholder:text-muted-foreground/50 disabled:opacity-60"
        />

        {/* Send button transitions from ghost → filled primary when there's text */}
        <button
          type="submit"
          aria-label="ارسال پاسخ"
          disabled={!canSend}
          className={cn(
            'mb-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl transition-all duration-200',
            canSend
              ? 'bg-primary text-primary-foreground scale-100 opacity-100'
              : 'scale-90 bg-transparent text-muted-foreground/30 opacity-60',
          )}
        >
          <ArrowUp className="size-[17px]" />
        </button>
      </div>

      {mutation.isError ? (
        <p role="alert" className="mt-2 px-1 text-xs text-destructive">
          ارسال انجام نشد؛ متن شما حفظ شده است.
        </p>
      ) : null}
    </form>
  )
}

// ---------------------------------------------------------------------------
// Thread
// ---------------------------------------------------------------------------

export function SupportTicketThread({
  detail,
}: {
  detail: ManagerSupportTicketDetailResponse
}) {
  const endRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLElement>(null)
  const previousCountRef = useRef(detail.messages.length)
  const messages = [...detail.messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  )

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
    if (messages.length > previousCountRef.current) endRef.current?.focus()
    previousCountRef.current = messages.length
  }, [messages.length])

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <section
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto px-3 pb-3 pt-4"
        aria-label="پیام‌های درخواست"
      >
        {detail.truncated ? (
          <div
            role="note"
            className="mb-4 rounded-xl bg-amber-soft px-3 py-2.5 text-xs leading-5 text-amber-fg"
          >
            این گفت‌وگو طولانی است و فقط ۵۰۰ پیام اخیر نمایش داده می‌شود.
          </div>
        ) : null}

        {messages.map((message, index) => {
          const prev = messages[index - 1]
          const grouped = isGroupedWith(message, prev)
          const newDay =
            !prev ||
            toDateKey(new Date(prev.createdAt)) !==
              toDateKey(new Date(message.createdAt))

          return (
            <div key={message.id}>
              {newDay && <DateSeparator date={new Date(message.createdAt)} />}
              <SupportMessageBubble message={message} grouped={grouped} />
            </div>
          )
        })}

        <div ref={endRef} tabIndex={-1} aria-label="آخرین پیام گفت‌وگو" />
      </section>

      <SupportMessageComposer
        ticketId={detail.ticket.id}
        resolved={detail.ticket.status === 'resolved'}
      />
    </div>
  )
}
