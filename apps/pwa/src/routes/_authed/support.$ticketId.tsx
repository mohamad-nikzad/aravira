import { useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

import {
  supportTicketDetailQueryOptions,
  useMarkSupportTicketReadMutation,
} from '#/lib/support-ticket-queries'
import { PageHeaderBackButton } from '#/components/page-header-back-button'
import { SupportTicketThread } from '#/components/support/support-ticket-thread'
import {
  SupportTicketListError,
  SupportTicketListSkeleton,
} from '#/components/support/support-ticket-list'
import {
  supportCategoryLabels,
  SupportTicketStatus,
} from '#/components/support/support-ticket-status'

export const Route = createFileRoute('/_authed/support/$ticketId')({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(
      supportTicketDetailQueryOptions(params.ticketId),
    ),
  component: SupportTicketDetailShell,
})

function SupportTicketDetailShell() {
  const { ticketId } = Route.useParams()
  const query = useQuery(supportTicketDetailQueryOptions(ticketId))
  const readMutation = useMarkSupportTicketReadMutation(ticketId)
  const markRead = readMutation.mutate
  const readAttemptedRef = useRef<string | null>(null)
  const unread = query.data?.managerHasUnread ?? false

  useEffect(() => {
    if (query.isSuccess && unread && readAttemptedRef.current !== ticketId) {
      readAttemptedRef.current = ticketId
      markRead()
    }
  }, [query.isSuccess, unread, ticketId, markRead])

  if (query.isPending) {
    return (
      <main className="flex h-full flex-col overflow-hidden p-4">
        <SupportTicketListSkeleton />
      </main>
    )
  }

  if (query.isError) {
    return (
      <main className="flex h-full flex-col overflow-hidden p-4">
        <SupportTicketListError retry={() => void query.refetch()} />
      </main>
    )
  }

  return (
    <main
      aria-label="گفت‌وگوی پشتیبانی"
      className="flex h-full flex-col overflow-hidden bg-background"
    >
      <header className="flex shrink-0 items-center gap-2 border-b border-line-soft bg-card/95 px-2 py-2.5 backdrop-blur supports-backdrop-filter:bg-card/80">
        <PageHeaderBackButton
          to="/support"
          className="size-9 rounded-xl"
          aria-label="بازگشت به پشتیبانی"
        />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-bold leading-tight">
            {query.data.ticket.subject}
          </h1>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground">
              {supportCategoryLabels[query.data.ticket.category]}
            </span>
            <span className="text-[10px] text-muted-foreground/40">·</span>
            <SupportTicketStatus status={query.data.ticket.status} />
          </div>
        </div>
      </header>
      <SupportTicketThread detail={query.data} />
    </main>
  )
}
