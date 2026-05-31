import {
  createTelegramProvider,
  initTelegramMessaging,
  registerMessagingProvider,
} from '@repo/notifications'

import { readTelegramConfigFromEnv } from './env'

/** Registers messaging providers using API-validated environment configuration. */
export function bootstrapMessagingProviders(): void {
  const getTelegramConfig = () => readTelegramConfigFromEnv()
  initTelegramMessaging(getTelegramConfig)
  registerMessagingProvider(createTelegramProvider(getTelegramConfig))
}
