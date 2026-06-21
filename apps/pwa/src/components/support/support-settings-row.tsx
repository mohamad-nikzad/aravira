import { useQuery } from '@tanstack/react-query'
import { LifeBuoy } from 'lucide-react'
import { toPersianDigits } from '@repo/salon-core/persian-digits'

import { supportTicketSummaryQueryOptions } from '#/lib/support-ticket-queries'
import { SettingsRow } from '#/components/settings/settings-rows'

export function SupportSettingsRow({ enabled }: { enabled: boolean }) {
  const summaryQuery = useQuery({
    ...supportTicketSummaryQueryOptions(),
    enabled,
  })

  if (!enabled) return null

  const unreadCount = summaryQuery.data?.unreadCount ?? 0

  return (
    <SettingsRow
      icon={LifeBuoy}
      label="پشتیبانی"
      hint="پرسش‌ها و درخواست‌های شما"
      to="/support"
      badge={
        unreadCount > 0
          ? toPersianDigits(unreadCount > 99 ? '99+' : unreadCount)
          : undefined
      }
    />
  )
}
