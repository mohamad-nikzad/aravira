import type { AdminSupportTicketListItem } from '@repo/api-client/types'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Filter, Inbox, RotateCcw, Search } from 'lucide-react'
import { useEffect, useState } from 'react'

import { ErrorPanel } from '#/components/admin/error-panel'
import { ScreenSkeleton } from '#/components/admin/screen-skeleton'
import { AdminPageHeader } from '#/components/layout/admin-page-header'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { formatDate } from '#/lib/admin-format'
import { cn } from '#/lib/utils'

import {
  supportTicketCategoryLabels,
  supportTicketStatusLabels,
  supportTicketStatusVariant,
} from './support-ticket-labels'
import { adminSupportTicketInboxOptions } from './support-ticket-queries'
import {
  SUPPORT_TICKET_CATEGORIES,
  SUPPORT_TICKET_STATUSES,
} from './support-ticket-url-state'
import { useSupportTicketSearch } from './use-support-ticket-search'

export function SupportTicketInboxPage() {
  return (
    <>
      <AdminPageHeader
        title="تیکت‌های پشتیبانی"
        description="صندوق مشترک گفت‌وگوهای مدیران سالن با پشتیبانی سالونا."
      />
      <SupportTicketInbox />
    </>
  )
}

export function SupportTicketInbox() {
  const [state, setState] = useSupportTicketSearch()
  const inboxQuery = useQuery(adminSupportTicketInboxOptions(state))

  const total = inboxQuery.data?.pagination.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / 20))
  const reset = () => {
    void setState({
      page: 1,
      search: undefined,
      status: undefined,
      category: undefined,
      salon: undefined,
      scope: 'unresolved',
    })
  }

  return (
    <section className="space-y-4" aria-label="صندوق تیکت‌های پشتیبانی">
      <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Filter className="h-4 w-4 text-muted-foreground" />
            پالایش صندوق
          </div>
          <div
            className="flex rounded-lg bg-muted p-1"
            aria-label="دامنه تیکت‌ها"
          >
            {(['unresolved', 'all'] as const).map((scope) => (
              <Button
                key={scope}
                type="button"
                size="sm"
                variant={state.scope === scope ? 'secondary' : 'ghost'}
                className="h-7"
                onClick={() =>
                  void setState({ scope, status: undefined, page: 1 })
                }
              >
                {scope === 'unresolved' ? 'حل‌نشده‌ها' : 'همه تیکت‌ها'}
              </Button>
            ))}
          </div>
        </div>
        <div className="grid gap-2 lg:grid-cols-[minmax(15rem,2fr)_repeat(3,minmax(9rem,1fr))_auto]">
          <DebouncedInboxSearch
            key={state.search ?? ''}
            value={state.search ?? ''}
            onChange={(search) =>
              void setState(
                { search: search || undefined, page: 1 },
                { replace: true },
              )
            }
          />
          <label>
            <span className="sr-only">وضعیت</span>
            <select
              aria-label="وضعیت"
              value={state.status ?? ''}
              onChange={(event) =>
                void setState({
                  status: (event.target.value ||
                    undefined) as typeof state.status,
                  scope:
                    event.target.value === 'resolved' ? 'all' : state.scope,
                  page: 1,
                })
              }
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">همه وضعیت‌ها</option>
              {SUPPORT_TICKET_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {supportTicketStatusLabels[status]}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">دسته‌بندی</span>
            <select
              aria-label="دسته‌بندی"
              value={state.category ?? ''}
              onChange={(event) =>
                void setState({
                  category: (event.target.value ||
                    undefined) as typeof state.category,
                  page: 1,
                })
              }
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">همه دسته‌ها</option>
              {SUPPORT_TICKET_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {supportTicketCategoryLabels[category]}
                </option>
              ))}
            </select>
          </label>
          <Input
            aria-label="شناسه سالن"
            dir="ltr"
            value={state.salon ?? ''}
            onChange={(event) =>
              void setState({ salon: event.target.value || undefined, page: 1 })
            }
            placeholder="شناسه سالن"
          />
          <Button type="button" variant="outline" onClick={reset}>
            <RotateCcw className="h-4 w-4" />
            پاک کردن
          </Button>
        </div>
      </div>

      {inboxQuery.isLoading ? (
        <ScreenSkeleton label="در حال بارگذاری تیکت‌ها" />
      ) : null}
      {inboxQuery.isError ? (
        <ErrorPanel
          message="بارگذاری تیکت‌های پشتیبانی ناموفق بود."
          onRetry={() => void inboxQuery.refetch()}
        />
      ) : null}
      {inboxQuery.isSuccess && inboxQuery.data.items.length === 0 ? (
        <div className="grid min-h-52 place-items-center rounded-xl border border-dashed border-border bg-card p-8 text-center">
          <div>
            <Inbox className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="font-semibold">تیکتی در این نما نیست</p>
            <p className="mt-1 text-sm text-muted-foreground">
              فیلترها را تغییر دهید یا صندوق همه تیکت‌ها را ببینید.
            </p>
          </div>
        </div>
      ) : null}
      {inboxQuery.isSuccess && inboxQuery.data.items.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="hidden grid-cols-[minmax(16rem,2fr)_minmax(10rem,1fr)_8rem_9rem] gap-4 border-b border-border bg-muted/45 px-4 py-2 text-xs font-medium text-muted-foreground md:grid">
            <span>موضوع</span>
            <span>سالن</span>
            <span>وضعیت</span>
            <span>آخرین فعالیت</span>
          </div>
          <div className="divide-y divide-border">
            {inboxQuery.data.items.map((ticket) => (
              <TicketRow key={ticket.id} ticket={ticket} search={state} />
            ))}
          </div>
        </div>
      ) : null}

      {inboxQuery.isSuccess && total > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          <span>{new Intl.NumberFormat('fa-IR').format(total)} تیکت</span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={state.page <= 1}
              onClick={() => void setState({ page: state.page - 1 })}
            >
              قبلی
            </Button>
            <span>
              صفحه {new Intl.NumberFormat('fa-IR').format(state.page)} از{' '}
              {new Intl.NumberFormat('fa-IR').format(pageCount)}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={state.page >= pageCount}
              onClick={() => void setState({ page: state.page + 1 })}
            >
              بعدی
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  )
}

function TicketRow({
  ticket,
  search,
}: {
  ticket: AdminSupportTicketListItem
  search: ReturnType<typeof useSupportTicketSearch>[0]
}) {
  return (
    <div
      className={cn(
        'grid gap-2 px-4 py-3 transition-colors hover:bg-muted/45 md:grid-cols-[minmax(16rem,2fr)_minmax(10rem,1fr)_8rem_9rem] md:items-center md:gap-4',
        ticket.platformHasUnread &&
          'border-s-4 border-s-primary bg-primary/[0.035]',
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {ticket.platformHasUnread ? (
            <span
              className="h-2 w-2 shrink-0 rounded-full bg-primary"
              aria-label="خوانده‌نشده"
            />
          ) : null}
          <Link
            to="/support-tickets/$ticketId"
            params={{ ticketId: ticket.id }}
            search={search}
            className={cn(
              'truncate hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              ticket.platformHasUnread ? 'font-bold' : 'font-medium',
            )}
          >
            {ticket.subject}
          </Link>
          <Badge variant="outline" className="shrink-0">
            {supportTicketCategoryLabels[ticket.category]}
          </Badge>
        </div>
        <p className="mt-1 truncate text-xs text-muted-foreground">
          {ticket.lastMessage
            ? `${ticket.lastMessage.authorDisplayName}: ${ticket.lastMessage.body}`
            : 'بدون پیام'}
        </p>
      </div>
      <div className="min-w-0 text-sm">
        <Link
          to="/salons/$salonId"
          params={{ salonId: ticket.salonId }}
          className="block truncate font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {ticket.salonName}
        </Link>
        <div className="truncate text-xs text-muted-foreground">
          {ticket.submittedByDisplayName}
        </div>
      </div>
      <div>
        <Badge variant={supportTicketStatusVariant(ticket.status)}>
          {supportTicketStatusLabels[ticket.status]}
        </Badge>
      </div>
      <time
        className="text-xs text-muted-foreground"
        dateTime={ticket.lastActivityAt}
      >
        {formatDate(ticket.lastActivityAt)}
      </time>
    </div>
  )
}

function DebouncedInboxSearch({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const [draft, setDraft] = useState(value)

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const normalized = draft.trim()
      if (normalized !== value) onChange(normalized)
    }, 350)
    return () => window.clearTimeout(timeout)
  }, [draft, onChange, value])

  return (
    <label className="relative block">
      <span className="sr-only">جستجوی موضوع یا نام سالن</span>
      <Search className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        className="pe-9"
        placeholder="جستجوی موضوع یا نام سالن..."
      />
    </label>
  )
}
