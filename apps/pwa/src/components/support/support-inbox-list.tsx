import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  Archive,
  CheckCircle2,
  Inbox,
  MessageCircle,
  Plus,
  type LucideIcon,
} from 'lucide-react'
import { SakuraMark } from '@repo/ui/sakura-mark'
import type { ManagerSupportTicketListItem } from '@repo/api-client/types'
import { Button } from '@repo/ui/button'
import { cn } from '@repo/ui/utils'
import { toPersianDigits } from '@repo/salon-core/persian-digits'
import {
  supportCategoryLabels,
  SupportTicketStatus,
} from '#/components/support/support-ticket-status'
import { SupportTicketPagination } from '#/components/support/support-ticket-list'

const timeFormatter = new Intl.DateTimeFormat('fa-IR', {
  hour: '2-digit',
  minute: '2-digit',
})

/** Client-side only — manager list API supports page/pageSize, not status. */
type InboxFilter = 'all' | 'waiting_for_manager' | 'open' | 'resolved'

const FILTER_TABS: { id: InboxFilter; label: string }[] = [
  { id: 'all', label: 'همه' },
  { id: 'waiting_for_manager', label: 'منتظر شما' },
  { id: 'open', label: 'باز' },
  { id: 'resolved', label: 'حل‌شده' },
]

const EMPTY_COPY: Record<
  InboxFilter,
  { title: string; sub: string; icon: LucideIcon }
> = {
  all: {
    title: 'هنوز درخواستی ندارید',
    sub: 'پرسش، مشکل یا پیشنهادتان را مستقیم با پشتیبانی سالونا در میان بگذارید.',
    icon: Inbox,
  },
  waiting_for_manager: {
    title: 'همه را پاسخ داده‌اید',
    sub: 'درخواستی منتظر پاسخ شما نیست — صندوق پشتیبانی به‌روز است.',
    icon: CheckCircle2,
  },
  open: {
    title: 'گفتگوی باز نیست',
    sub: 'درخواست فعالی در این دسته وجود ندارد.',
    icon: MessageCircle,
  },
  resolved: {
    title: 'هنوز حل‌شده‌ای ندارید',
    sub: 'درخواست‌های بسته‌شده و پاسخ‌داده‌شده اینجا نمایش داده می‌شوند.',
    icon: Archive,
  },
}

export function SupportInboxList({
  tickets,
  page,
  hasNext,
  onPageChange,
}: {
  tickets: ManagerSupportTicketListItem[]
  page?: number
  hasNext?: boolean
  onPageChange?: (page: number) => void
}) {
  const [filter, setFilter] = useState<InboxFilter>('all')
  const unreadCount = tickets.filter((t) => t.managerHasUnread).length

  const filtered = useMemo(() => {
    const sorted = [...tickets].sort(
      (a, b) =>
        new Date(b.lastActivityAt).getTime() -
        new Date(a.lastActivityAt).getTime(),
    )
    if (filter === 'all') return sorted
    return sorted.filter((t) => t.status === filter)
  }, [filter, tickets])

  const tabCounts = useMemo(
    () => ({
      all: tickets.length,
      waiting_for_manager: tickets.filter(
        (t) => t.status === 'waiting_for_manager',
      ).length,
      open: tickets.filter((t) => t.status === 'open').length,
      resolved: tickets.filter((t) => t.status === 'resolved').length,
    }),
    [tickets],
  )

  return (
    <main
      aria-label="درخواست‌های پشتیبانی"
      className="relative min-h-full bg-background pb-24"
    >
      <header className="sticky top-0 z-10 border-b border-line-soft bg-card/95 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-lg font-extrabold">صندوق پشتیبانی</h1>
            {unreadCount > 0 ? (
              <p className="text-xs text-primary">
                {toPersianDigits(unreadCount)} پیام خوانده‌نشده
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">همه خوانده شده</p>
            )}
          </div>
          <Button asChild size="sm" variant="outline">
            <Link to="/support/new">
              <Plus />
              جدید
            </Link>
          </Button>
        </div>

        <div className="flex gap-2 overflow-x-auto px-4 pb-0 scrollbar-hide">
          {FILTER_TABS.map(({ id, label }) => {
            const active = filter === id
            const count = tabCounts[id]
            return (
              <button
                key={id}
                type="button"
                onClick={() => setFilter(id)}
                className={cn(
                  'inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-[12px] whitespace-nowrap transition-colors',
                  active
                    ? 'border-primary font-bold text-foreground'
                    : 'border-transparent font-medium text-muted-foreground',
                )}
              >
                {label}
                {count > 0 ? (
                  <span
                    className={cn(
                      'rounded-lg px-1.5 py-px text-[10px] font-bold tabular-nums',
                      active
                        ? 'bg-blush-soft text-plum-deep'
                        : 'bg-paper-deep text-muted-foreground',
                    )}
                  >
                    {toPersianDigits(count)}
                  </span>
                ) : null}
              </button>
            )
          })}
        </div>
      </header>

      {filtered.length === 0 ? (
        <SupportInboxEmpty
          filter={filter}
          onShowAll={filter !== 'all' ? () => setFilter('all') : undefined}
        />
      ) : (
        <ul className="divide-y divide-line-soft">
          {filtered.map((ticket) => (
            <li key={ticket.id}>
              <Link
                to="/support/$ticketId"
                params={{ ticketId: ticket.id }}
                className="flex items-start gap-3 px-4 py-3.5 active:bg-accent/30"
              >
                <span
                  className={cn(
                    'mt-2 size-2 shrink-0 rounded-full',
                    ticket.managerHasUnread ? 'bg-primary' : 'bg-transparent',
                  )}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <h2
                      className={cn(
                        'truncate text-sm',
                        ticket.managerHasUnread
                          ? 'font-extrabold'
                          : 'font-medium',
                      )}
                    >
                      {ticket.subject}
                    </h2>
                    <time className="shrink-0 text-[10px] text-muted-foreground">
                      {timeFormatter.format(new Date(ticket.lastActivityAt))}
                    </time>
                  </div>
                  {ticket.lastMessage ? (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {ticket.lastMessage.body}
                    </p>
                  ) : null}
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">
                      {supportCategoryLabels[ticket.category]}
                    </span>
                    <SupportTicketStatus status={ticket.status} />
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {page != null && onPageChange ? (
        <div className="px-4">
          <SupportTicketPagination
            page={page}
            hasNext={hasNext ?? false}
            onPageChange={onPageChange}
          />
        </div>
      ) : null}
    </main>
  )
}

function SupportInboxEmpty({
  filter,
  onShowAll,
}: {
  filter: InboxFilter
  onShowAll?: () => void
}) {
  const { title, sub, icon: Icon } = EMPTY_COPY[filter]

  return (
    <div className="flex flex-col items-center px-5 py-14 text-center">
      <div className="relative mb-3 flex size-[88px] items-center justify-center overflow-hidden rounded-full bg-blush-soft text-plum-deep">
        <SakuraMark
          size={70}
          color="color-mix(in oklch, var(--primary) 16%, transparent)"
          className="absolute"
          style={{ insetInlineStart: 9, top: 9 }}
        />
        <Icon className="relative size-[30px]" strokeWidth={1.6} />
      </div>

      <h2 className="text-[15px] font-extrabold text-foreground">{title}</h2>
      <p className="mt-1.5 max-w-[260px] text-[12.5px] leading-relaxed text-muted-foreground">
        {sub}
      </p>

      {filter === 'all' ? (
        <Button asChild size="lg" className="mt-6">
          <Link to="/support/new">
            <Plus />
            درخواست جدید
          </Link>
        </Button>
      ) : onShowAll ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-5"
          onClick={onShowAll}
        >
          مشاهده همه درخواست‌ها
        </Button>
      ) : null}
    </div>
  )
}
