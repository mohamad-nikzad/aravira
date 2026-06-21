import { Badge } from '@repo/ui/badge'
import type {
  SupportTicketCategory,
  SupportTicketStatus,
} from '@repo/api-client/types'

export const supportCategoryLabels: Record<SupportTicketCategory, string> = {
  problem: 'مشکل',
  question: 'پرسش',
  feature_request: 'پیشنهاد قابلیت',
  other: 'سایر',
}
export const supportStatusLabels: Record<SupportTicketStatus, string> = {
  open: 'باز',
  waiting_for_manager: 'منتظر پاسخ شما',
  resolved: 'حل‌شده',
}

export function SupportTicketStatus({
  status,
}: {
  status: SupportTicketStatus
}) {
  const tone =
    status === 'resolved'
      ? 'neutral'
      : status === 'waiting_for_manager'
        ? 'amber'
        : 'mint'
  return <Badge variant={tone}>{supportStatusLabels[status]}</Badge>
}
