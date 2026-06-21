import type {
  SupportTicketCategory,
  SupportTicketStatus,
} from '@repo/api-client/types'

export const supportTicketStatusLabels: Record<SupportTicketStatus, string> = {
  open: 'باز',
  waiting_for_manager: 'منتظر مدیر سالن',
  resolved: 'حل‌شده',
}

export const supportTicketCategoryLabels: Record<
  SupportTicketCategory,
  string
> = {
  problem: 'گزارش مشکل',
  question: 'پرسش',
  feature_request: 'پیشنهاد قابلیت',
  other: 'سایر',
}

export function supportTicketStatusVariant(status: SupportTicketStatus) {
  if (status === 'resolved') return 'success' as const
  if (status === 'waiting_for_manager') return 'warning' as const
  return 'danger' as const
}
