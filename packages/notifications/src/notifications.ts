import {
  createNotificationForUser as createNotificationRecordForUser,
  dispatchNotification as recordNotificationDelivery,
  getNotificationPreferences,
  listNotificationsForUser,
  markAllNotificationsRead,
  markNotificationRead,
  updateNotificationPreferences,
  type AppNotification,
  type CreateNotificationInput,
  type NotificationPreferences,
} from '@repo/database/notifications'
import {
  findAccountByUserAndProvider,
  type MessagingProviderId,
} from '@repo/database/messaging'
import { getEnabledMessagingProvidersForSalon } from '@repo/database/public'
import { listConfiguredMessagingProviders } from './providers/registry'
import type { MessagingButton } from './providers/types'
import { sendSmsNotification } from './sms'

export type CreateNotificationForUserInput = CreateNotificationInput & {
  /** When set (e.g. in tests), skips loading salon messaging settings from the database. */
  enabledProviders?: Set<MessagingProviderId>
  messagingButtons?: MessagingButton[][]
}

function isAppointmentRequestNotification(type: string): boolean {
  return type === 'appointment_request_pending' || type.startsWith('appointment_request_')
}

async function deliverInApp(notification: AppNotification) {
  await recordNotificationDelivery(notification.id, 'in_app')
}

async function deliverSms(notification: AppNotification) {
  const smsDelivery = await sendSmsNotification(notification)
  await recordNotificationDelivery(notification.id, 'sms', smsDelivery.status, {
    provider: smsDelivery.provider,
    providerMessageId: smsDelivery.providerMessageId,
    error: smsDelivery.error,
  })
}

async function deliverMessagingChannels(
  notification: AppNotification,
  preferences: NotificationPreferences,
  salonEnabledProviders: Set<MessagingProviderId>,
  messagingButtons?: MessagingButton[][]
) {
  const gateOnAppointmentAlerts = isAppointmentRequestNotification(notification.type)

  for (const provider of listConfiguredMessagingProviders()) {
    // appointment_alerts_disabled applies only to appointment-request notifications;
    // other types deliver when the user has a linked account.
    if (gateOnAppointmentAlerts && !preferences.appointmentAlertsEnabled) {
      await recordNotificationDelivery(notification.id, provider.id, 'skipped', {
        provider: provider.id,
        error: 'appointment_alerts_disabled',
      })
      continue
    }

    if (!salonEnabledProviders.has(provider.id)) {
      await recordNotificationDelivery(notification.id, provider.id, 'skipped', {
        provider: provider.id,
        error: 'salon_disabled',
      })
      continue
    }

    const account = await findAccountByUserAndProvider(notification.userId, provider.id)
    if (!account || !account.enabled) {
      await recordNotificationDelivery(notification.id, provider.id, 'skipped', {
        provider: provider.id,
        error: account ? 'user_disabled' : 'not_linked',
      })
      continue
    }

    const result = await provider.send({
      notificationId: notification.id,
      externalId: account.externalId,
      title: notification.title,
      body: notification.body,
      ...(messagingButtons ? { buttons: messagingButtons } : {}),
    })
    await recordNotificationDelivery(notification.id, provider.id, result.status, {
      provider: provider.id,
      providerMessageId: result.providerMessageId ?? null,
      error: result.error ?? null,
    })
  }
}

export async function createNotificationForUser(input: CreateNotificationForUserInput) {
  const { enabledProviders: enabledProvidersOverride, messagingButtons, ...createInput } = input
  const notification = await createNotificationRecordForUser(createInput)

  await deliverInApp(notification)
  await deliverSms(notification)

  const preferences = await getNotificationPreferences(
    notification.salonId,
    notification.userId
  )
  const salonEnabledProviders =
    enabledProvidersOverride ??
    new Set(await getEnabledMessagingProvidersForSalon(notification.salonId))

  await deliverMessagingChannels(
    notification,
    preferences,
    salonEnabledProviders,
    messagingButtons
  )

  return notification
}

export const dispatchNotification = recordNotificationDelivery
export { sendSmsNotification }
export {
  type AppNotification,
  type CreateNotificationInput,
  type ListNotificationsInput,
  type NotificationChannel,
  type NotificationDeliveryStatus,
  type NotificationPreferences,
  type NotificationType,
  type UpdateNotificationPreferencesInput,
} from '@repo/database/notifications'
export {
  getNotificationPreferences,
  listNotificationsForUser,
  markAllNotificationsRead,
  markNotificationRead,
  updateNotificationPreferences,
}
