import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { Button } from '@repo/ui/button'

import { supportTicketListQueryOptions } from '#/lib/support-ticket-queries'
import {
  SupportTicketEmpty,
  SupportTicketList,
  SupportTicketListError,
  SupportTicketListSkeleton,
  SupportTicketPagination,
} from '#/components/support/support-ticket-list'

export const Route = createFileRoute('/_authed/support/')({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(supportTicketListQueryOptions()),
  component: SupportIndexShell,
})

function SupportIndexShell() {
  const [page, setPage] = useState(1)
  const query = useQuery(supportTicketListQueryOptions({ page, pageSize: 25 }))
  const data = query.data
  return (
    <main
      aria-label="درخواست‌های پشتیبانی"
      className="min-h-full bg-background"
    >
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-line-soft bg-card/95 px-5 py-4 backdrop-blur">
        <div>
          <h1 className="text-xl font-extrabold">پشتیبانی</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            گفت‌وگو با تیم سالونا
          </p>
        </div>
        <Button asChild>
          <Link to="/support/new">
            <Plus />
            درخواست جدید
          </Link>
        </Button>
      </header>
      <div className="mx-auto max-w-2xl p-4">
        {query.isPending ? (
          <SupportTicketListSkeleton />
        ) : query.isError ? (
          <SupportTicketListError retry={() => void query.refetch()} />
        ) : data && data.items.length === 0 ? (
          <SupportTicketEmpty />
        ) : data ? (
          <>
            <SupportTicketList items={data.items} />
            <SupportTicketPagination
              page={page}
              hasNext={
                data.pagination.total >
                data.pagination.page * data.pagination.pageSize
              }
              onPageChange={setPage}
            />
          </>
        ) : null}
      </div>
    </main>
  )
}
