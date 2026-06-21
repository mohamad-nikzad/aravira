import { useEffect, useRef, useState } from 'react'
import type {
  ManagerSupportMessage,
  ManagerSupportTicketDetailResponse,
} from '@repo/api-client/types'
import { toPersianDigits } from '@repo/salon-core/persian-digits'
import { Button } from '@repo/ui/button'
import { Textarea } from '@repo/ui/textarea'
import { cn } from '@repo/ui/utils'
import { useAddManagerSupportMessageMutation } from '#/lib/support-ticket-queries'
import {
  supportCategoryLabels,
  SupportTicketStatus,
} from './support-ticket-status'

const dateFormatter = new Intl.DateTimeFormat('fa-IR', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export function SupportMessageBubble({
  message,
}: {
  message: ManagerSupportMessage
}) {
  const platform = message.authorKind === 'platform'
  const author = platform ? 'پشتیبانی سالونا' : message.authorDisplayName
  return (
    <article className={cn('flex', platform ? 'justify-start' : 'justify-end')}>
      <div
        className={cn(
          'max-w-[88%] rounded-2xl px-4 py-3',
          platform
            ? 'rounded-tr-md border border-line-soft bg-card'
            : 'rounded-tl-md bg-primary text-primary-foreground',
        )}
      >
        <div
          className={cn(
            'text-xs font-bold',
            platform ? 'text-plum-deep' : 'text-primary-foreground/80',
          )}
        >
          {author}
        </div>
        <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6">
          {message.body}
        </p>
        <time
          className={cn(
            'mt-1.5 block text-[10px]',
            platform ? 'text-muted-foreground' : 'text-primary-foreground/70',
          )}
        >
          {dateFormatter.format(new Date(message.createdAt))}
        </time>
      </div>
    </article>
  )
}

export function SupportMessageComposer({
  ticketId,
  resolved,
}: {
  ticketId: string
  resolved: boolean
}) {
  const [draft, setDraft] = useState('')
  const submittingRef = useRef(false)
  const mutation = useAddManagerSupportMessageMutation(ticketId)
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    const body = draft.trim()
    if (!body || mutation.isPending || submittingRef.current) return
    submittingRef.current = true
    try {
      await mutation.mutateAsync(body)
      setDraft('')
    } catch {
      /* retain draft */
    } finally {
      submittingRef.current = false
    }
  }
  return (
    <form
      onSubmit={submit}
      className="space-y-2 border-t border-line-soft bg-card p-4 safe-area-pb"
    >
      <label htmlFor="support-reply" className="text-sm font-bold">
        پاسخ شما
      </label>
      {resolved ? (
        <p className="text-xs leading-5 text-amber-fg">
          این درخواست حل شده است؛ ارسال پاسخ آن را دوباره باز می‌کند.
        </p>
      ) : null}
      <Textarea
        id="support-reply"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        maxLength={4000}
        rows={3}
        disabled={mutation.isPending}
      />
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">
          {toPersianDigits(Array.from(draft).length)} / ۴۰۰۰
        </span>
        <Button type="submit" disabled={!draft.trim() || mutation.isPending}>
          {mutation.isPending ? 'در حال ارسال…' : 'ارسال پاسخ'}
        </Button>
      </div>
      {mutation.isError ? (
        <p role="alert" className="text-xs text-destructive">
          ارسال انجام نشد؛ متن شما حفظ شده است.
        </p>
      ) : null}
    </form>
  )
}

export function SupportTicketThread({
  detail,
}: {
  detail: ManagerSupportTicketDetailResponse
}) {
  const endRef = useRef<HTMLDivElement>(null)
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
    <>
      <section className="space-y-3 px-4 py-5" aria-label="پیام‌های درخواست">
        {detail.truncated ? (
          <div
            role="note"
            className="rounded-xl bg-amber-soft p-3 text-xs leading-5 text-amber-fg"
          >
            این گفت‌وگو طولانی است و فقط ۵۰۰ پیام اخیر نمایش داده می‌شود.
          </div>
        ) : null}
        {messages.map((message) => (
          <SupportMessageBubble key={message.id} message={message} />
        ))}
        <div ref={endRef} tabIndex={-1} aria-label="آخرین پیام گفت‌وگو" />
      </section>
      <SupportMessageComposer
        ticketId={detail.ticket.id}
        resolved={detail.ticket.status === 'resolved'}
      />
    </>
  )
}

export function SupportTicketHeading({
  detail,
}: {
  detail: ManagerSupportTicketDetailResponse
}) {
  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <h1 className="text-lg font-extrabold">{detail.ticket.subject}</h1>
        <SupportTicketStatus status={detail.ticket.status} />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {supportCategoryLabels[detail.ticket.category]}
      </p>
    </div>
  )
}
