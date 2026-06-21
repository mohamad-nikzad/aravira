import { createFileRoute } from '@tanstack/react-router'
import { PageHeaderBackButton } from '#/components/page-header-back-button'
import { SupportTicketCreateForm } from '#/components/support/support-ticket-create-form'

export const Route = createFileRoute('/_authed/support/new')({
  component: NewSupportTicketShell,
})

function NewSupportTicketShell() {
  return (
    <main
      aria-label="درخواست پشتیبانی جدید"
      className="min-h-full bg-background"
    >
      <header className="flex items-center gap-3 border-b border-line-soft bg-card px-4 py-3">
        <PageHeaderBackButton to="/support" />
        <div>
          <h1 className="font-extrabold">درخواست پشتیبانی جدید</h1>
          <p className="text-xs text-muted-foreground">
            تیم سالونا پاسخ شما را در همین‌جا می‌دهد
          </p>
        </div>
      </header>
      <div className="mx-auto max-w-xl p-5">
        <SupportTicketCreateForm />
      </div>
    </main>
  )
}
