import { hasPlatformPermission } from '@repo/auth/platform'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Moon, RefreshCw, Search, Sun, TicketCheck } from 'lucide-react'

import { Button } from '#/components/ui/button'
import { IconButton } from '#/components/ui/icon-button'
import { Separator } from '#/components/ui/separator'
import { SidebarTrigger } from '#/components/ui/sidebar'
import { Spinner } from '#/components/ui/spinner'
import { useAdminAuth } from '#/context/admin-auth-provider'
import { useSearch } from '#/context/search-provider'
import { useTheme } from '#/context/theme-provider'
import { cn } from '#/lib/utils'
import { adminSupportTicketSummaryOptions } from '#/features/support-tickets/support-ticket-summary-query'

export function SupportTicketHeaderIndicator({
  unresolvedCount,
  unreadCount,
  onOpen,
}: {
  unresolvedCount: number
  unreadCount: number
  onOpen: () => void
}) {
  const label = `تیکت‌های پشتیبانی، ${unresolvedCount} تیکت حل‌نشده${unreadCount > 0 ? `، ${unreadCount} پیام جدید` : ''}`

  return (
    <div className="relative">
      <IconButton label={label} onClick={onOpen}>
        <TicketCheck className="h-4 w-4" />
      </IconButton>
      {unresolvedCount > 0 ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -end-1 -top-1 min-w-4 rounded-full bg-foreground px-1 text-center text-[10px] font-bold leading-4 text-background"
        >
          {unresolvedCount > 99 ? '99+' : unresolvedCount}
        </span>
      ) : null}
      {unreadCount > 0 ? (
        <span
          data-testid="support-ticket-unread-dot"
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-0.5 end-0 h-2.5 w-2.5 rounded-full border-2 border-background bg-destructive"
        />
      ) : null}
    </div>
  )
}

function SupportTicketHeaderPending() {
  return (
    <IconButton label="در حال دریافت خلاصه تیکت‌های پشتیبانی" disabled>
      <Spinner />
    </IconButton>
  )
}

function SupportTicketHeaderError({ onRetry }: { onRetry: () => void }) {
  return (
    <IconButton
      label="دریافت خلاصه تیکت‌های پشتیبانی ناموفق بود؛ تلاش دوباره"
      onClick={onRetry}
      className="text-destructive hover:text-destructive"
    >
      <RefreshCw className="h-4 w-4" />
    </IconButton>
  )
}

export function AdminTopbar() {
  const navigate = useNavigate()
  const { setOpen } = useSearch()
  const { theme, toggleTheme } = useTheme()
  const { me, runtime } = useAdminAuth()
  const canViewSupportTickets = hasPlatformPermission(
    me.role,
    'view_support_tickets',
  )
  const supportSummary = useQuery(
    adminSupportTicketSummaryOptions(canViewSupportTickets),
  )
  const ThemeIcon = theme === 'light' ? Moon : Sun
  const isLive = runtime.dataSource === 'live'

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center border-b border-border/80 bg-background/95 backdrop-blur">
      <div className="flex h-full w-full items-center gap-3 px-3 sm:px-5 lg:px-6">
        <SidebarTrigger className="-me-1" />
        <Separator orientation="vertical" className="me-1 h-4" />
        <Button
          variant="outline"
          className="h-8 min-w-0 flex-1 justify-start gap-2 border-input/80 bg-card/70 text-muted-foreground shadow-none sm:max-w-[34rem]"
          onClick={() => setOpen(true)}
        >
          <Search className="h-4 w-4" />
          <span className="truncate">جستجوی مسیرها و عملیات ادمین</span>
          <kbd className="ms-auto hidden rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground sm:inline">
            Ctrl K
          </kbd>
        </Button>
        <div className="ms-auto flex shrink-0 items-center gap-2">
          {canViewSupportTickets ? (
            supportSummary.data ? (
              <SupportTicketHeaderIndicator
                unresolvedCount={supportSummary.data.unresolvedCount}
                unreadCount={supportSummary.data.unreadCount}
                onOpen={() => void navigate({ to: '/support-tickets' })}
              />
            ) : supportSummary.isError ? (
              <SupportTicketHeaderError
                onRetry={() => void supportSummary.refetch()}
              />
            ) : (
              <SupportTicketHeaderPending />
            )
          ) : null}
          <span
            className={cn(
              'rounded-md border px-2.5 py-1 text-xs font-semibold',
              isLive
                ? 'border-destructive bg-destructive text-destructive-foreground'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/50 dark:text-emerald-300',
            )}
          >
            {isLive ? 'داده LIVE' : 'داده محلی'}
          </span>
          <IconButton label="تغییر پوسته" onClick={toggleTheme}>
            <ThemeIcon className="h-4 w-4" />
          </IconButton>
        </div>
      </div>
    </header>
  )
}
