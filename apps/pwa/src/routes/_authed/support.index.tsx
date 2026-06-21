import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { Button } from '@repo/ui/button'

import { supportTicketListQueryOptions } from '#/lib/support-ticket-queries'
import { SupportInboxList } from '#/components/support/support-inbox-list'
import {
  SupportTicketEmpty,
  SupportTicketListError,
  SupportTicketListSkeleton,
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

  if (query.isPending) {
    return (
      <main className="min-h-full bg-background p-4">
        <SupportTicketListSkeleton />
      </main>
    )
  }

  if (query.isError) {
    return (
      <main className="min-h-full bg-background p-4">
        <SupportTicketListError retry={() => void query.refetch()} />
      </main>
    )
  }

  if (!data || data.items.length === 0) {
    return (
      <main
        aria-label="درخواست‌های پشتیبانی"
        className="min-h-full bg-background"
      >
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-line-soft bg-card/95 px-4 py-3 backdrop-blur">
          <div>
            <h1 className="text-lg font-extrabold">صندوق پشتیبانی</h1>
            <p className="text-xs text-muted-foreground">همه خوانده شده</p>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link to="/support/new">
              <Plus />
              جدید
            </Link>
          </Button>
        </header>
        <div className="mx-auto max-w-2xl p-4">
          <SupportTicketEmpty />
        </div>
      </main>
    )
  }

  return (
    <SupportInboxList
      tickets={data.items}
      page={page}
      hasNext={
        data.pagination.total > data.pagination.page * data.pagination.pageSize
      }
      onPageChange={setPage}
    />
  )
}
