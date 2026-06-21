import type { MessagingProviderId } from '@repo/api-client/types'

export type MessagingProviderConfig = {
  provider: MessagingProviderId
  displayName: string
  botName: string
  toggleLabel: string
  connectLabel: string
  connectHint: string
  linkedHint: string
  unlinkedHint: string
  errorMessage: string
}

export const MESSAGING_PROVIDER_CONFIGS = [
  {
    provider: 'telegram',
    displayName: 'تلگرام',
    botName: 'ربات تلگرام',
    toggleLabel: 'اعلان تلگرام',
    connectLabel: 'اتصال تلگرام',
    connectHint: 'دریافت اعلان درخواست نوبت در تلگرام',
    linkedHint: 'متصل شد؛ نوبت‌ها به تلگرام شما ارسال می‌شوند.',
    unlinkedHint: 'یک کلیک تا فعال‌سازی اعلان‌های تلگرام.',
    errorMessage: 'اتصال تلگرام انجام نشد',
  },
  {
    provider: 'bale',
    displayName: 'بله',
    botName: 'ربات بله',
    toggleLabel: 'اعلان بله',
    connectLabel: 'اتصال بله',
    connectHint: 'دریافت اعلان درخواست نوبت در بله',
    linkedHint: 'متصل شد؛ نوبت‌ها به بله شما ارسال می‌شوند.',
    unlinkedHint: 'یک کلیک تا فعال‌سازی اعلان‌های بله.',
    errorMessage: 'اتصال بله انجام نشد',
  },
] as const satisfies ReadonlyArray<MessagingProviderConfig>

export function getMessagingProviderConfig(provider: MessagingProviderId) {
  return MESSAGING_PROVIDER_CONFIGS.find(
    (config) => config.provider === provider,
  )
}
