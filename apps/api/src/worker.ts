/**
 * Cloudflare Workers entry.
 *
 * The Hono app reads config from process.env at module load
 * (env.ts → getEnv → cached). On Workers, env bindings only arrive
 * via the fetch handler, so we hydrate process.env on the first
 * request and defer importing the app via dynamic import.
 */

type Bindings = Record<string, unknown>

let appPromise: Promise<typeof import('./app').app> | null = null

function hydrateProcessEnv(env: Bindings) {
  for (const [key, value] of Object.entries(env)) {
    if (typeof value === 'string' && process.env[key] === undefined) {
      process.env[key] = value
    }
  }
}

async function getApp(env: Bindings) {
  if (!appPromise) {
    hydrateProcessEnv(env)
    const { bootstrapMessagingProviders } = await import('./bootstrap-messaging')
    bootstrapMessagingProviders()
    appPromise = import('./app').then((m) => m.app)
  }
  return appPromise
}

export default {
  async fetch(request: Request, env: Bindings, ctx: ExecutionContext): Promise<Response> {
    const app = await getApp(env)
    return app.fetch(request, env, ctx)
  },
}
