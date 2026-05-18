import { Hono } from 'hono'
import type { MiddlewareHandler } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { requestId } from 'hono/request-id'
import { secureHeaders } from 'hono/secure-headers'
import { bodyLimit } from 'hono/body-limit'
import type { AppEnv } from './factory'
import { getEnv } from './env'
import { errorHandler, notFoundHandler } from './middleware/error'
import { health } from './routes/health'
import { clients } from './routes/clients'
import { serviceCategories } from './routes/service-categories'
import { serviceFamilies } from './routes/service-families'
import { serviceAddons } from './routes/service-addons'

const env = getEnv()

const corsOrigins = env.CORS_ORIGINS
const corsOrigin: string | ((origin: string) => string | null) =
  corsOrigins.length === 1 && corsOrigins[0] === '*'
    ? '*'
    : (origin: string) => (corsOrigins.includes(origin) ? origin : null)

const conditionalLogger: MiddlewareHandler =
  env.NODE_ENV === 'test' ? async (_c, next) => next() : logger()

const app = new Hono<AppEnv>()
  .use(requestId())
  .use(conditionalLogger)
  .use(secureHeaders())
  .use(
    cors({
      origin: corsOrigin,
      credentials: true,
      allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization', 'Accept'],
      maxAge: 86400,
    }),
  )
  .use(bodyLimit({ maxSize: 2 * 1024 * 1024 }))
  .route('/health', health)
  .route('/api/v1/clients', clients)
  .route('/api/v1/service-categories', serviceCategories)
  .route('/api/v1/service-families', serviceFamilies)
  .route('/api/v1/service-addons', serviceAddons)
  .onError(errorHandler)
  .notFound(notFoundHandler)

export type AppType = typeof app
export { app }
