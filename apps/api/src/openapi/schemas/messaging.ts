import { z } from '@hono/zod-openapi'

const isoDateTimeSchema = z.string().datetime().or(z.string())

export const messagingProviderIdSchema = z
  .enum(['telegram', 'bale', 'rubika', 'whatsapp'])
  .openapi('MessagingProviderId')

export const messagingAccountSchema = z
  .object({
    id: z.string(),
    provider: messagingProviderIdSchema,
    displayName: z.string().nullable(),
    enabled: z.boolean(),
    linkedAt: isoDateTimeSchema,
  })
  .openapi('MessagingAccount')

export const messagingProviderSummarySchema = z
  .object({
    id: messagingProviderIdSchema,
    displayName: z.string(),
  })
  .openapi('MessagingProviderSummary')

export const listMessagingAccountsResponseSchema = z
  .object({
    providers: z.array(messagingProviderSummarySchema),
    accounts: z.array(messagingAccountSchema),
  })
  .openapi('ListMessagingAccountsResponse')

export const createMessagingLinkBodySchema = z
  .object({
    provider: messagingProviderIdSchema,
  })
  .openapi('CreateMessagingLinkRequest')

export const createMessagingLinkResponseSchema = z
  .object({
    deepLink: z.string(),
    expiresAt: isoDateTimeSchema,
  })
  .openapi('CreateMessagingLinkResponse')

export const messagingAccountResponseSchema = z
  .object({
    account: messagingAccountSchema,
  })
  .openapi('MessagingAccountResponse')

export const patchMessagingAccountBodySchema = z
  .object({
    enabled: z.boolean(),
  })
  .openapi('PatchMessagingAccountRequest')

export const deleteMessagingAccountResponseSchema = z
  .object({
    ok: z.literal(true),
  })
  .openapi('DeleteMessagingAccountResponse')
