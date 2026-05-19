# Deploying the API to Cloudflare Workers

The API runs on Workers via the entry at `src/worker.ts`. The Workers entry hydrates `process.env` from Workers bindings and then dynamically imports the Hono app (`src/app.ts`).

## One-time setup

1. Install deps if not already done:
   ```sh
   pnpm install
   ```
2. Log in to Cloudflare (browser flow):
   ```sh
   pnpm --filter @repo/api exec wrangler login
   ```
3. Set required secrets (each command prompts for the value):
   ```sh
   pnpm --filter @repo/api exec wrangler secret put DATABASE_URL
   pnpm --filter @repo/api exec wrangler secret put JWT_SECRET
   ```
   Use the Neon **pooled** connection string (`-pooler` hostname), with `?sslmode=require`.

   Optional (only if web push is used):
   ```sh
   pnpm --filter @repo/api exec wrangler secret put VAPID_PRIVATE_KEY
   pnpm --filter @repo/api exec wrangler secret put VAPID_SUBJECT
   pnpm --filter @repo/api exec wrangler secret put NEXT_PUBLIC_VAPID_PUBLIC_KEY
   ```

4. Tighten CORS if you have a known frontend origin (defaults to `*`):
   Edit `vars.CORS_ORIGINS` in `wrangler.jsonc`, e.g. `"https://app.example.com"`.

## Local dev against Workers runtime

Create `apps/api/.dev.vars` from `.dev.vars.example` and fill in your dev DB URL, then:

```sh
pnpm --filter @repo/api cf:dev
```

This runs the worker locally (defaults to http://localhost:8787) using the same nodejs_compat flags as production.

## Deploy

```sh
pnpm --filter @repo/api cf:deploy
```

The first deploy prints a `*.workers.dev` URL — use that until you wire a custom domain.

## Logs

```sh
pnpm --filter @repo/api cf:tail
```

## Notes / gotchas

- **Free plan limits:** 100k requests/day, 10ms CPU/request. Postgres queries don't count against CPU (they're I/O), so most endpoints fit.
- **Neon connections:** always use the pooled hostname (`*-pooler.*.neon.tech`). Workers create many short-lived isolates; the unpooled endpoint will exhaust connections fast.
- **Cold start DB:** `postgres-js` runs over TCP via the `nodejs_compat` flag. If you see connection errors, swap to `@neondatabase/serverless` + `drizzle-orm/neon-serverless` in `packages/database/src/client.ts`.
- **Web push:** the `web-push` library is mostly node-native. It may work with `nodejs_compat` for sending, but if you hit runtime errors, gate `sendWebPushToUser` behind a runtime check or move push sending off Workers.
- **Module-load env reads:** `src/app.ts` calls `getEnv()` at module load. The Workers entry uses a dynamic `import('./app')` after hydrating `process.env` from bindings so this still works. Don't change the entry to a static import of the app.
