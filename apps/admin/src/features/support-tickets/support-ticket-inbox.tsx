import type { AdminSupportTicketListItem } from '@repo/api-client/types'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Eye, Filter, Inbox, RotateCcw, Search } from 'lucide-react'
import { useEffect, useId, useState } from 'react'

import { ErrorPanel } from '#/components/admin/error-panel'
import { EmptyState } from '#/components/admin/empty-state'
import { ScreenSkeleton } from '#/components/admin/screen-skeleton'
import { AdminPageHeader } from '#/components/layout/admin-page-header'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Field, FieldLabel } from '#/components/ui/field'
import { Input } from '#/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import {
  ToggleGroup,
  ToggleGroupItem,
} from '#/components/ui/toggle-group'
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
    <section className="flex flex-col gap-4" aria-label="صندوق تیکت‌های پشتیبانی">
      <InboxFilterToolbar state={state} setState={setState} onReset={reset} />

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
        <EmptyState
          className="min-h-52"
          icon={<Inbox />}
          title="تیکتی در این نما نیست"
          description="فیلترها را تغییر دهید یا صندوق همه تیکت‌ها را ببینید."
        />
      ) : null}
      {inboxQuery.isSuccess && inboxQuery.data.items.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="hidden grid-cols-[minmax(16rem,2fr)_minmax(10rem,1fr)_8rem_9rem_auto] gap-4 border-b border-border bg-muted/45 px-4 py-2 text-xs font-medium text-muted-foreground md:grid">
            <span>موضوع</span>
            <span>سالن</span>
            <span>وضعیت</span>
            <span>آخرین فعالیت</span>
            <span className="text-end">عملیات</span>
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
        'grid gap-2 px-4 py-3 transition-colors hover:bg-muted/45 md:grid-cols-[minmax(16rem,2fr)_minmax(10rem,1fr)_8rem_9rem_auto] md:items-center md:gap-4',
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
      <div className="flex justify-end md:justify-start">
        <Button asChild size="sm" variant="outline">
          <Link
            to="/support-tickets/$ticketId"
            params={{ ticketId: ticket.id }}
            search={search}
          >
            <Eye data-icon="inline-start" />
            مشاهده جزئیات
          </Link>
        </Button>
      </div>
    </div>
  )
}

function InboxFilterToolbar({
  state,
  setState,
  onReset,
}: {
  state: ReturnType<typeof useSupportTicketSearch>[0]
  setState: ReturnType<typeof useSupportTicketSearch>[1]
  onReset: () => void
}) {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 border-b border-border/80 py-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Filter className="size-4 text-muted-foreground" />
          پالایش صندوق
        </CardTitle>
        <ToggleGroup
          type="single"
          value={state.scope}
          aria-label="دامنه تیکت‌ها"
          className="w-full rounded-lg bg-muted p-1 sm:w-auto"
          onValueChange={(scope) => {
            if (!scope) return
            void setState({
              scope: scope as typeof state.scope,
              status: undefined,
              page: 1,
            })
          }}
        >
          <ToggleGroupItem
            value="unresolved"
            className="h-8 flex-1 px-3 text-xs data-[state=on]:bg-background data-[state=on]:shadow-sm sm:flex-none"
          >
            حل‌نشده‌ها
          </ToggleGroupItem>
          <ToggleGroupItem
            value="all"
            className="h-8 flex-1 px-3 text-xs data-[state=on]:bg-background data-[state=on]:shadow-sm sm:flex-none"
          >
            همه تیکت‌ها
          </ToggleGroupItem>
        </ToggleGroup>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))_auto] xl:items-end">
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
          <InboxFilterSelect
            label="وضعیت"
            emptyLabel="همه وضعیت‌ها"
            value={state.status ?? ''}
            onValueChange={(status) =>
              void setState({
                status: (status || undefined) as typeof state.status,
                scope: status === 'resolved' ? 'all' : state.scope,
                page: 1,
              })
            }
            options={SUPPORT_TICKET_STATUSES.map((status) => [
              status,
              supportTicketStatusLabels[status],
            ])}
          />
          <InboxFilterSelect
            label="دسته‌بندی"
            emptyLabel="همه دسته‌ها"
            value={state.category ?? ''}
            onValueChange={(category) =>
              void setState({
                category: (category || undefined) as typeof state.category,
                page: 1,
              })
            }
            options={SUPPORT_TICKET_CATEGORIES.map((category) => [
              category,
              supportTicketCategoryLabels[category],
            ])}
          />
          <SalonIdFilter
            value={state.salon ?? ''}
            onChange={(salon) =>
              void setState({ salon: salon || undefined, page: 1 })
            }
          />
          <Button
            type="button"
            variant="outline"
            className="h-9 w-full xl:w-auto"
            onClick={onReset}
          >
            <RotateCcw data-icon="inline-start" />
            پاک کردن
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

const inboxSelectEmptySentinel = '__empty__'

function InboxFilterSelect({
  label,
  emptyLabel,
  value,
  onValueChange,
  options,
}: {
  label: string
  emptyLabel: string
  value: string
  onValueChange: (value: string) => void
  options: Array<[string, string]>
}) {
  const id = useId()
  const selectValue = value || inboxSelectEmptySentinel

  return (
    <Field className="min-w-0 gap-1.5">
      <FieldLabel htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </FieldLabel>
      <Select
        value={selectValue}
        onValueChange={(nextValue) =>
          onValueChange(
            nextValue === inboxSelectEmptySentinel ? '' : nextValue,
          )
        }
      >
        <SelectTrigger id={id} className="w-full" aria-label={label}>
          <SelectValue placeholder={emptyLabel} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value={inboxSelectEmptySentinel}>{emptyLabel}</SelectItem>
            {options.map(([optionValue, optionLabel]) => (
              <SelectItem key={optionValue} value={optionValue}>
                {optionLabel}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </Field>
  )
}

function SalonIdFilter({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const id = useId()

  return (
    <Field className="min-w-0 gap-1.5">
      <FieldLabel htmlFor={id} className="text-xs text-muted-foreground">
        شناسه سالن
      </FieldLabel>
      <Input
        id={id}
        dir="ltr"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="UUID سالن"
        className="font-mono text-xs"
      />
    </Field>
  )
}

function DebouncedInboxSearch({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const id = useId()
  const [draft, setDraft] = useState(value)

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const normalized = draft.trim()
      if (normalized !== value) onChange(normalized)
    }, 350)
    return () => window.clearTimeout(timeout)
  }, [draft, onChange, value])

  return (
    <Field className="min-w-0 gap-1.5 xl:col-span-1">
      <FieldLabel htmlFor={id} className="text-xs text-muted-foreground">
        جستجو
      </FieldLabel>
      <div className="relative">
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          className="ps-9"
          placeholder="موضوع یا نام سالن..."
        />
      </div>
    </Field>
  )
}
