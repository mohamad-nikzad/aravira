import { z } from '@hono/zod-openapi'

const isoDateTimeSchema = z.string().datetime().or(z.string())

export const notificationPreferencesSchema = z
  .object({
    salonId: z.string(),
    userId: z.string(),
    appointmentAlertsEnabled: z.boolean(),
    localAlertsEnabled: z.boolean(),
    smsAlertsEnabled: z.boolean(),
    createdAt: isoDateTimeSchema,
    updatedAt: isoDateTimeSchema,
  })
  .openapi('NotificationPreferences')

export const notificationPreferencesResponseSchema = z
  .object({
    preferences: notificationPreferencesSchema,
  })
  .openapi('NotificationPreferencesResponse')

export const updateNotificationPreferencesBodySchema = z
  .object({
    appointmentAlertsEnabled: z.boolean().optional(),
    localAlertsEnabled: z.boolean().optional(),
    smsAlertsEnabled: z.boolean().optional(),
  })
  .openapi('UpdateNotificationPreferencesRequest')
