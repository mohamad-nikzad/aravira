import type {
  AdminSupportMessage,
  AdminSupportTicketDetailResponse,
  SupportTicketStatus,
} from '@repo/api-client/types'
import { getApiV1AdminAuthMeOptions } from '@repo/api-client/query'
import { hasPlatformPermission } from '@repo/auth/platform'
import { useQuery } from '@tanstack/react-query'
import { Link, useParams, useSearch } from '@tanstack/react-router'
import {
  ArrowRight,
  CheckCircle2,
  LockKeyhole,
  MessageSquareText,
  Send,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'

import { ErrorPanel } from '#/components/admin/error-panel'
import { ScreenSkeleton } from '#/components/admin/screen-skeleton'
import { AdminPageHeader } from '#/components/layout/admin-page-header'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { formatDate } from '#/lib/admin-format'
import { cn } from '#/lib/utils'

import {
  supportTicketCategoryLabels,
  supportTicketStatusLabels,
  supportTicketStatusVariant,
} from './support-ticket-labels'
import {
  adminSupportTicketDetailOptions,
  useMarkAdminSupportTicketRead,
  useReplyAdminSupportTicket,
  useResolveAdminSupportTicket,
} from './support-ticket-queries'
import { compactSupportTicketSearch } from './support-ticket-url-state'

type MarkRead = (callbacks: {
  onSuccess: () => void
  onError: () => void
}) => void

export function useReadAfterTicketLoad(
  ticketId: string,
  hasUnread: boolean,
  markRead: MarkRead,
) {
  const attempt = useRef({ ticketId, count: 0, complete: false })
  const [retrySequence, setRetrySequence] = useState(0)

  useEffect(() => {
    if (attempt.current.ticketId !== ticketId) {
      attempt.current = { ticketId, count: 0, complete: false }
    }
    if (!hasUnread || attempt.current.complete || attempt.current.count >= 2)
      return

    attempt.current.count += 1
    attempt.current.complete = true
    markRead({
      onSuccess: () => undefined,
      onError: () => {
        attempt.current.complete = false
        setRetrySequence((current) => current + 1)
      },
    })
  }, [hasUnread, markRead, retrySequence, ticketId])
}

export function SupportTicketDetailPage() {
  const { ticketId } = useParams({ from: '/_admin/support-tickets/$ticketId' })
  const inboxSearch = useSearch({ from: '/_admin/support-tickets' })
  const detailQuery = useQuery(adminSupportTicketDetailOptions(ticketId))
  const authQuery = useQuery(getApiV1AdminAuthMeOptions())
  const { mutate: markReadMutation } = useMarkAdminSupportTicketRead(ticketId)
  const markRead = useCallback<MarkRead>(
    (callbacks) => markReadMutation({ path: { ticketId } }, callbacks),
    [markReadMutation, ticketId],
  )
  useReadAfterTicketLoad(
    ticketId,
    detailQuery.data?.platformHasUnread ?? false,
    markRead,
  )

  if (detailQuery.isLoading || authQuery.isLoading) {
    return <ScreenSkeleton label="در حال بارگذاری گفت‌وگوی پشتیبانی" />
  }
  if (
    detailQuery.isError ||
    authQuery.isError ||
    !detailQuery.data ||
    !authQuery.data
  ) {
    return (
      <ErrorPanel
        message="بارگذاری گفت‌وگوی پشتیبانی ناموفق بود."
        onRetry={() =>
          void Promise.all([detailQuery.refetch(), authQuery.refetch()])
        }
      />
    )
  }

  const role = authQuery.data.user.role
  return (
    <SupportTicketDetail
      detail={detailQuery.data}
      ticketId={ticketId}
      currentAdmin={{
        id: authQuery.data.user.userId,
        name: authQuery.data.user.name,
      }}
      canReply={hasPlatformPermission(role, 'reply_support_tickets')}
      canResolve={hasPlatformPermission(role, 'resolve_support_tickets')}
      inboxSearch={inboxSearch}
    />
  )
}

export function SupportTicketDetail({
  detail,
  ticketId,
  currentAdmin,
  canReply,
  canResolve,
  inboxSearch = {},
}: {
  detail: AdminSupportTicketDetailResponse
  ticketId: string
  currentAdmin: { id: string; name: string }
  canReply: boolean
  canResolve: boolean
  inboxSearch?: Parameters<typeof compactSupportTicketSearch>[0]
}) {
  const [resolveOpen, setResolveOpen] = useState(false)
  const [body, setBody] = useState('')
  const [resultingStatus, setResultingStatus] =
    useState<SupportTicketStatus | null>(null)
  const replyMutation = useReplyAdminSupportTicket(ticketId)
  const resolveMutation = useResolveAdminSupportTicket(ticketId)
  const ticket = detail.ticket
  const displayedStatus = resultingStatus ?? ticket.status

  const submitReply = async (event: FormEvent, resolveAfter: boolean) => {
    event.preventDefault()
    const trimmedBody = body.trim()
    if (!trimmedBody) return
    const result = await replyMutation.mutateAsync({
      path: { ticketId },
      body: { body: trimmedBody, resolveAfter },
    })
    setResultingStatus(result.resultingStatus)
    setBody('')
  }

  const resolveTicket = async () => {
    const result = await resolveMutation.mutateAsync({ path: { ticketId } })
    setResultingStatus(result.resultingStatus)
    setResolveOpen(false)
  }

  return (
    <>
      <AdminPageHeader
        title={ticket.subject}
        description={`تیکت ${ticket.salonName} • ثبت‌شده توسط ${ticket.submittedByDisplayName}`}
      />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link
            to="/support-tickets"
            search={compactSupportTicketSearch(inboxSearch)}
          >
            <ArrowRight className="h-4 w-4" />
            بازگشت به صندوق
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">
            {supportTicketCategoryLabels[ticket.category]}
          </Badge>
          <Badge variant={supportTicketStatusVariant(displayedStatus)}>
            {supportTicketStatusLabels[displayedStatus]}
          </Badge>
          {canResolve && displayedStatus !== 'resolved' ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setResolveOpen(true)}
            >
              <CheckCircle2 className="h-4 w-4" />
              حل بدون پاسخ
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <main className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border bg-muted/35 px-4 py-3">
            <div className="flex items-center gap-2 font-semibold">
              <MessageSquareText className="h-4 w-4 text-primary" />
              گفت‌وگو
            </div>
            <span className="text-xs text-muted-foreground">
              پیام‌ها قابل ویرایش یا حذف نیستند
            </span>
          </div>
          <ol className="space-y-4 p-4 sm:p-6" aria-label="پیام‌های تیکت">
            {detail.messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </ol>
          {detail.truncated ? (
            <p className="border-t border-warning/30 bg-warning/10 px-4 py-2 text-xs text-warning">
              بخشی از پیام‌های قدیمی‌تر در این نما نمایش داده نشده است.
            </p>
          ) : null}
          {canReply ? (
            <form
              className="border-t border-border bg-muted/20 p-4"
              onSubmit={(event) => void submitReply(event, false)}
            >
              <div className="mb-2 flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
                <span>
                  پاسخ با هویت واقعی:{' '}
                  <strong className="text-foreground">
                    {currentAdmin.name}
                  </strong>
                </span>
                <span dir="ltr">{currentAdmin.id}</span>
              </div>
              <label className="block">
                <span className="sr-only">متن پاسخ</span>
                <textarea
                  aria-label="متن پاسخ"
                  value={body}
                  maxLength={4000}
                  rows={5}
                  onChange={(event) => setBody(event.target.value)}
                  placeholder="پاسخ پشتیبانی را بنویسید..."
                  className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm leading-7 outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-ring"
                />
              </label>
              {ticket.category === 'feature_request' ? (
                <p className="mt-2 rounded-md border border-warning/25 bg-warning/10 px-3 py-2 text-xs leading-6 text-warning">
                  حل این گفت‌وگو به معنی پذیرش، زمان‌بندی یا تحویل این پیشنهاد
                  قابلیت نیست.
                </p>
              ) : null}
              {replyMutation.isError ? (
                <p role="alert" className="mt-2 text-sm text-destructive">
                  ارسال پاسخ ناموفق بود. دوباره تلاش کنید.
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="submit"
                  disabled={!body.trim() || replyMutation.isPending}
                >
                  <Send className="h-4 w-4" />
                  {replyMutation.isPending ? 'در حال ارسال…' : 'ارسال پاسخ'}
                </Button>
                {canResolve ? (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!body.trim() || replyMutation.isPending}
                    onClick={(event) => void submitReply(event, true)}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    ارسال و حل کردن
                  </Button>
                ) : null}
              </div>
            </form>
          ) : (
            <div className="flex items-start gap-3 border-t border-border bg-muted/30 p-4 text-sm text-muted-foreground">
              <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                <strong className="text-foreground">دسترسی فقط‌خواندنی</strong>
                <br />
                شما می‌توانید گفت‌وگو و هویت واقعی نویسندگان را ببینید، اما
                اجازه پاسخ یا حل تیکت را ندارید.
              </p>
            </div>
          )}
        </main>

        <aside className="h-fit rounded-xl border border-border bg-card p-4 text-sm shadow-sm">
          <h2 className="mb-3 font-semibold">جزئیات تیکت</h2>
          <dl className="space-y-3">
            <Meta label="سالن">
              <Link
                to="/salons/$salonId"
                params={{ salonId: ticket.salonId }}
                className="font-medium text-primary hover:underline"
              >
                {ticket.salonName}
              </Link>
            </Meta>
            <Meta label="ثبت‌کننده">{ticket.submittedByDisplayName}</Meta>
            <Meta label="شناسه ثبت‌کننده">
              <span dir="ltr" className="break-all text-xs">
                {ticket.submittedByUserId}
              </span>
            </Meta>
            <Meta label="ایجاد">{formatDate(ticket.createdAt)}</Meta>
            <Meta label="آخرین فعالیت">
              {formatDate(ticket.lastActivityAt)}
            </Meta>
            {ticket.resolvedAt ? (
              <Meta label="زمان حل">{formatDate(ticket.resolvedAt)}</Meta>
            ) : null}
            {ticket.resolvedByUserId ? (
              <Meta label="حل‌کننده">
                <span dir="ltr" className="break-all text-xs">
                  {ticket.resolvedByUserId}
                </span>
              </Meta>
            ) : null}
          </dl>
        </aside>
      </div>

      <Dialog open={resolveOpen} onOpenChange={setResolveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>حل این تیکت بدون پاسخ؟</DialogTitle>
            <DialogDescription>
              وضعیت گفت‌وگو به «حل‌شده» تغییر می‌کند و این عملیات با هویت واقعی
              شما در گزارش ممیزی ثبت می‌شود.
              {ticket.category === 'feature_request'
                ? ' این کار به معنی پذیرش یا زمان‌بندی پیشنهاد قابلیت نیست.'
                : ''}
            </DialogDescription>
          </DialogHeader>
          {resolveMutation.isError ? (
            <p role="alert" className="text-sm text-destructive">
              حل تیکت ناموفق بود. دوباره تلاش کنید.
            </p>
          ) : null}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                انصراف
              </Button>
            </DialogClose>
            <Button
              type="button"
              disabled={resolveMutation.isPending}
              onClick={() => void resolveTicket()}
            >
              {resolveMutation.isPending ? 'در حال ثبت…' : 'تأیید حل تیکت'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function MessageBubble({ message }: { message: AdminSupportMessage }) {
  const isPlatform = message.authorKind === 'platform'
  return (
    <li className={cn('flex', isPlatform ? 'justify-start' : 'justify-end')}>
      <article
        className={cn(
          'max-w-[92%] rounded-xl border px-4 py-3 sm:max-w-[76%]',
          isPlatform
            ? 'border-primary/20 bg-primary/[0.055]'
            : 'border-border bg-muted/55',
        )}
      >
        <header className="mb-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <strong className="text-sm">{message.authorDisplayName}</strong>
          <span className="text-[11px] text-muted-foreground">
            {isPlatform ? 'پلتفرم' : 'مدیر سالن'}
          </span>
          <span dir="ltr" className="text-[10px] text-muted-foreground">
            {message.authorUserId}
          </span>
        </header>
        <p className="whitespace-pre-wrap break-words text-sm leading-7">
          {message.body}
        </p>
        <time
          dateTime={message.createdAt}
          className="mt-2 block text-[11px] text-muted-foreground"
        >
          {formatDate(message.createdAt)}
        </time>
      </article>
    </li>
  )
}

function Meta({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  )
}
