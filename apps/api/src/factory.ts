import { createFactory } from 'hono/factory'
import type { TenantUser } from '@repo/auth/tenant'

export type AppEnv = {
  Variables: {
    tenant: TenantUser
    requestId: string
  }
}

export const factory = createFactory<AppEnv>()
