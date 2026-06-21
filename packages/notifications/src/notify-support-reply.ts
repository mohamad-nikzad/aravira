import {
  createNotificationForUser,
  dispatchNotification,
} from '@repo/database/notifications'
import { listActiveSalonManagerUserIds } from '@repo/database/support-tickets'

export type NotifyManagersOfSupportReplyInput = {
  salonId: string
  ticketId: string
}

export async function notifyManagersOfSupportReply(
  input: NotifyManagersOfSupportReplyInput,
): Promise<void> {
  const managerUserIds = await listActiveSalonManagerUserIds(input.salonId)
  const results = await Promise.allSettled(
    managerUserIds.map(async (userId) => {
      const notification = await createNotificationForUser({
        salonId: input.salonId,
        userId,
        type: 'support_reply',
        title: 'پاسخ جدید پشتیبانی',
        body: 'پشتیبانی سالونا به درخواست شما پاسخ داد.',
        route: `/support/${input.ticketId}`,
        data: { ticketId: input.ticketId },
      })
      await dispatchNotification(notification.id, 'in_app')
    }),
  )

  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.error('[notifications] support reply fanout failed', {
        userId: managerUserIds[index],
        salonId: input.salonId,
        ticketId: input.ticketId,
        err: result.reason,
      })
    }
  })
}
