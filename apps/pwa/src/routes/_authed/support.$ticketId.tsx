import { useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

import {
  supportTicketDetailQueryOptions,
  useMarkSupportTicketReadMutation,
} from '#/lib/support-ticket-queries'
import { PageHeaderBackButton } from '#/components/page-header-back-button'
import {
  SupportTicketHeading,
  SupportTicketThread,
} from '#/components/support/support-ticket-thread'
import {
  SupportTicketListError,
  SupportTicketListSkeleton,
} from '#/components/support/support-ticket-list'

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
  if (query.isPending)
    return (
      <main className="p-4">
        <SupportTicketListSkeleton />
      </main>
    )
  if (query.isError)
    return (
      <main className="p-4">
        <SupportTicketListError retry={() => void query.refetch()} />
      </main>
    )
  return (
    <main
      aria-label="گفت‌وگوی پشتیبانی"
      className="flex min-h-full flex-col bg-background"
    >
      <header className="sticky top-0 z-10 flex items-start gap-3 border-b border-line-soft bg-card/95 px-4 py-3 backdrop-blur">
        <PageHeaderBackButton to="/support" />
        <div className="min-w-0 flex-1">
          <SupportTicketHeading detail={query.data} />
        </div>
      </header>
      <div className="flex-1">
        <SupportTicketThread detail={query.data} />
      </div>
    </main>
  )
}
