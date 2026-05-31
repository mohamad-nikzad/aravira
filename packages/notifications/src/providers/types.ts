import type { MessagingProviderId } from '@repo/database/messaging'

export type { MessagingProviderId }

export type MessagingButton = {
  /** Text shown in the chat. Keep under 30 chars (Telegram limit). */
  label: string
  /** Opaque string the provider echoes back on tap. Required when `url` is absent. */
  data?: string
  /** Opens in browser when set (Telegram URL button). Required when `data` is absent. */
  url?: string
}

export type MessagingSendInput = {
  notificationId: string
  /** chatId / phone / waId — provider-specific. */
  externalId: string
  title: string
  body: string
  /** Optional inline keyboard. Providers without inline buttons fall back to plain text. */
  buttons?: MessagingButton[][]
  locale?: string
}

export type MessagingDeliveryResult = {
  status: 'sent' | 'failed' | 'skipped'
  providerMessageId?: string | null
  error?: string | null
}

export interface MessagingProvider {
  readonly id: MessagingProviderId
  readonly displayName: string
  readonly supportsInlineButtons: boolean
  readonly supportsInbound: boolean
  isConfigured(): boolean
  /** Provider-specific account link URL (e.g. t.me/bot?start=token). */
  buildAccountLinkUrl(token: string): string | null
  send(input: MessagingSendInput): Promise<MessagingDeliveryResult>
}
