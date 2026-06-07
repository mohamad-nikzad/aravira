import {
  createBaleProvider,
  createTelegramProvider,
  initBaleSafir,
  initBaleMessaging,
  initTelegramMessaging,
  registerMessagingProvider,
} from '@repo/notifications'

import {
  readBaleConfigFromEnv,
  readBaleSafirConfigFromEnv,
  readTelegramConfigFromEnv,
} from './env'

/** Registers messaging providers using API-validated environment configuration. */
export function bootstrapMessagingProviders(): void {
  const getTelegramConfig = () => readTelegramConfigFromEnv()
  const getBaleConfig = () => readBaleConfigFromEnv()
  const getBaleSafirConfig = () => readBaleSafirConfigFromEnv()
  initTelegramMessaging(getTelegramConfig)
  initBaleMessaging(getBaleConfig)
  initBaleSafir(getBaleSafirConfig)
  registerMessagingProvider(createTelegramProvider(getTelegramConfig))
  registerMessagingProvider(createBaleProvider(getBaleConfig))
}
