# Plan: Standalone Hono API app (`apps/api`)

## Context

All APIs today live in Next.js route handlers under `apps/app/app/api/**`. We want a dedicated HTTP service so the web and native clients eventually target one backend, the API can deploy independently, and we stop coupling API code to Next's build.

This first step creates the new app's foundation and ports **one** domain (`clients`) end-to-end as the reference pattern. No client code is touched and no existing Next.js route is removed — the new API runs on a separate port so we can validate auth, validation, errors, and the typed RPC client before bulk migration.

**Stack (locked):**
- Runtime: Node.js via `@hono/node-server` (keeps the existing pooled `postgres-js` client unchanged).
- Hono version: latest 4.x.
- Validation: `@hono/zod-validator` against existing Zod schemas in `@repo/salon-core/forms` — no new schemas.
- Typed client (future): Hono RPC — `export type AppType` and consume with `hc<AppType>` later.

**Auth direction (important for shape of this work):**
The repo currently uses an in-house JWT/cookie auth in `@repo/auth`. We plan to migrate to **Better Auth** soon (skill at `.agents/skills/better-auth-best-practices`). This plan is structured so that swap is a localized change:
- All auth lives behind **one Hono middleware** (`requireTenant`) that sets `c.var.tenant`. Route handlers only read `c.var.tenant` and never call auth functions directly.
- The middleware reads from `c.req.raw` (a standard `Request`) — exactly the surface Better Auth expects (`auth.api.getSession({ headers: c.req.raw.headers })`).
- We do **not** import `@repo/auth/authz` (it returns `NextResponse` and pulls `next/server` into the bundle). 401/403 responses are emitted from the middleware via local helpers, so swapping the underlying auth library leaves response shapes intact.
- We do **not** mount Better Auth's `/api/auth/*` handler yet. A short "Better Auth migration seam" section below describes exactly what changes when we do.

---

## Hono best-practice alignment

Pulled from the `hono` skill (`.agents/skills/hono/SKILL.md`):

- **`createFactory<Env>()`** to define the `Env` (`Variables`, optionally `Bindings`) once and share it across the app, middleware, and handler creators — no re-typing generics in every file.
- **Chained route definitions** are mandatory for Hono RPC to infer types. Each feature router builds via one fluent chain: `const route = new Hono<Env>().get(...).post(...)...` and exports its `typeof route`. The root app composes them with `app.route('/api/v1/clients', clients)` in a single chain, and exports `export type AppType = typeof app`.
- **Inline handlers** in route definitions (don't extract handlers into separate functions — breaks param/validator inference).
- **Built-in middlewares only** where they fit: `hono/logger`, `hono/cors`, `hono/secure-headers`, `hono/request-id`, `hono/body-limit`, `hono/etag`. No third-party logger/cors libraries.
- **`c.set`/`c.get`** for request-scoped data (`tenant`, `requestId`).
- **`zValidator`** chained with the handler; access via `c.req.valid('json' | 'query' | 'param')`.
- **`app.request()`** for tests — no HTTP server in unit tests.
- **`onError` + `notFound`** for uniform error responses.

---

## Directory layout

```
apps/api/
  package.json
  tsconfig.json
  eslint.config.mjs
  src/
    index.ts                  # node-server entry: reads PORT, starts serve(), wires shutdown
    app.ts                    # composes routers into the root app; exports AppType
    env.ts                    # zod-validated process.env (fails fast on boot)
    factory.ts                # createFactory<Env>() — exports `factory`, type `AppEnv`
    middleware/
      auth.ts                 # requireTenant() / requireTenant(permission) — sets c.var.tenant
      error.ts                # onError + notFound (shared { error, code? } shape)
    lib/
      responses.ts            # ok / created / error helpers
      validate.ts             # re-exports zValidator + shared error hook
    routes/
      health.ts               # GET /health, GET /ready
      clients.ts              # sample domain — fully chained for RPC
    types.ts                  # AppEnv (Variables), AppType re-export
```

## Workspace wiring

- `pnpm-workspace.yaml` already includes `apps/*` — no change.
- Root `package.json`:
  - Add `"dev:api": "pnpm --filter @repo/api dev"`.
  - Include `--filter=@repo/api` in the existing top-level `dev` script.
- `turbo.json` already covers `dev`/`build`/`lint`/`typecheck` — no change.
- `apps/api/package.json`:
  - `"name": "@repo/api"`, `"private": true`, `"type": "module"`.
  - Scripts:
    - `dev`: `ROOT_ENV_FILES=.env.database.dev node ../../scripts/with-root-env.mjs tsx watch src/index.ts`
    - `build`: `tsc -p tsconfig.json`
    - `start`: `node dist/index.js`
    - `lint`, `typecheck`, `test:unit` (vitest) matching sibling packages.
  - Deps: `hono`, `@hono/node-server`, `@hono/zod-validator`, `zod` (pinned by root override), `@repo/auth`, `@repo/database`, `@repo/salon-core`.
  - DevDeps: `tsx`, `typescript`, `@types/node`, `vitest`, `@repo/typescript-config`, `@repo/eslint-config`.
- `apps/api/tsconfig.json` extends `@repo/typescript-config/base.json`, sets `outDir: dist`, `rootDir: src`.
- `apps/api/eslint.config.mjs` uses `@repo/eslint-config/base`.

## Env handling

- Reuses `scripts/with-root-env.mjs` (root `.env.local` + `DATABASE_ENV_FILE`) — `DATABASE_URL`, `JWT_SECRET`, etc. resolve without duplication.
- `src/env.ts` Zod-validates exactly what the API consumes: `DATABASE_URL`, `JWT_SECRET` (until Better Auth lands, then becomes `BETTER_AUTH_SECRET` + `BETTER_AUTH_URL`), `PORT` (default `3002`), `NODE_ENV`, `CORS_ORIGINS` (comma-separated). Throws on boot if anything is missing.

## Factory (`src/factory.ts`)

```ts
import { createFactory } from 'hono/factory'
import type { TenantUser } from '@repo/auth/tenant'

export type AppEnv = {
  Variables: {
    tenant: TenantUser           // set by requireTenant middleware
    requestId: string            // set by hono/request-id
  }
}

export const factory = createFactory<AppEnv>()
```

All routers and middleware import `factory` / `AppEnv` from here — never re-declare generics. `factory.createMiddleware(...)` and `factory.createApp()` inherit the `Env` automatically.

## Server entry (`src/index.ts`)

- Calls `env.parse()` at the top (fail fast).
- `serve({ fetch: app.fetch, port: env.PORT }, info => log(info.address, info.port))`.
- Registers `SIGINT`/`SIGTERM`: stop accepting, then close the Postgres pool exposed by `@repo/database` so dev reloads don't leak connections.

## Root app (`src/app.ts`)

```ts
const app = factory.createApp()
  .use(logger())                                  // hono/logger (gated by NODE_ENV !== 'test')
  .use(requestId())                               // hono/request-id → c.var.requestId
  .use(secureHeaders())                           // hono/secure-headers
  .use(cors({ origin: env.CORS_ORIGINS, credentials: true, ... })) // hono/cors
  .use(bodyLimit({ maxSize: 2 * 1024 * 1024 }))   // hono/body-limit (sane default; per-route override allowed)
  .route('/health', health)
  .route('/api/v1/clients', clients)
  .onError(errorHandler)
  .notFound(notFoundHandler)

export type AppType = typeof app
export { app }
```

The single fluent chain is what preserves RPC types end-to-end.

## Auth middleware (`src/middleware/auth.ts`) — the swap seam

Two factory-built middlewares created with `factory.createMiddleware`:

- `requireTenant()` — resolves the current user from `c.req.raw` (standard `Request`), sets `c.var.tenant`, or returns 401 via the shared `error()` helper.
- `requireTenant(permission: TenantPermission)` — same plus 403 on missing permission.

**Today (in-house auth):** calls `getTenantUser(c.req.raw)` from `@repo/auth/tenant`. That function already accepts a standard `Request` and delegates to `getCurrentUserFromRequest`, which reads `Authorization: Bearer`. If cookie reading is needed and the shared helper doesn't cover it, parse the `Cookie` header **locally inside this middleware** (using `hono/cookie`'s `getCookie(c, 'session')`) and call `verifySession()` from `@repo/auth/auth` directly — do **not** mutate `@repo/auth` for this step.

**After Better Auth migration:** the body of this middleware becomes roughly:
```ts
const session = await auth.api.getSession({ headers: c.req.raw.headers })
if (!session) return error(c, 'Unauthorized', 401)
c.set('tenant', toTenantUser(session.user))
```
Nothing else in the codebase has to change — routes only read `c.var.tenant`.

## Error & response shape

`src/lib/responses.ts`:
- `ok(c, data, status = 200)` → `c.json(data, status)`
- `created(c, data)` → `c.json(data, 201)`
- `error(c, message, status, code?)` → `c.json({ error, code }, status)` — **matches the current Next.js contract** so the existing `@repo/api-client` works unmodified once it's pointed at the new base URL.

`src/middleware/error.ts`:
- `onError`: `HTTPException` → its status/message; `ZodError` → 400 with field errors (mirrors `apps/app/app/api/validation.ts` exactly); unknown → log with `requestId`, return 500 with the same Persian fallback message in use today.
- `notFound`: 404 `{ error: 'Not Found' }`.

## Validation

`src/lib/validate.ts` re-exports `zValidator` with a shared error hook that routes through the same 400 emitter as `onError`. Schemas imported from `@repo/salon-core/forms/*` — no new schemas, no duplication.

## Sample domain: `clients` (`src/routes/clients.ts`)

Behavior-identical to `apps/app/app/api/clients/**`. All handlers chained behind `requireTenant('manage_clients')` (matches current authorization) and validators chained inline so RPC types include input shapes.

| Method | Path                              | Reuses (from `@repo/database/clients` + `@repo/salon-core/forms`) |
|--------|-----------------------------------|------------------------------------------------------------------|
| GET    | `/`                               | `getAllClients(salonId)`                                         |
| POST   | `/`                               | `createClient(...)` + `clientCreateSchema`                       |
| GET    | `/:id`                            | `getClientById(salonId, id)`                                     |
| PATCH  | `/:id`                            | `updateClient(...)` + `clientUpdateSchema`                       |
| DELETE | `/:id`                            | `deleteClient(salonId, id)`                                      |
| GET    | `/:id/summary`                    | existing summary fn                                              |
| GET / POST / PATCH | `/:id/follow-ups`     | existing follow-up fns                                           |

- Duplicate-phone branch returns `409 { error, code: 'duplicate-phone' }` exactly as today.
- The router is built as one fluent chain and `export type ClientsRoute = typeof clients` so the root app's `AppType` keeps full inference. Handlers are written inline.

## Testing

- Vitest at `src/**/*.test.ts`.
- Use `app.request(...)` from the skill's testing pattern — no HTTP server, no port. Cover for the clients router:
  - 401 when no auth.
  - 200 list shape (with a stubbed `getAllClients`).
  - 400 invalid-body shape parity with the existing Next.js error shape.
  - 409 duplicate-phone code.

## Better Auth migration seam (out of scope for this PR; documented so the structure is right)

When we switch:
1. Add `better-auth` and `better-auth/adapters/drizzle` to `@repo/auth` (or a new `@repo/auth-next`).
2. Add `BETTER_AUTH_SECRET` + `BETTER_AUTH_URL` to `env.ts`; remove `JWT_SECRET` once unused.
3. Mount the handler in `app.ts`: `.on(['GET','POST'], '/api/auth/*', c => auth.handler(c.req.raw))`.
4. Rewrite the **body** of `requireTenant` to call `auth.api.getSession({ headers: c.req.raw.headers })`. Route handlers, response shapes, and the RPC type don't change.
5. Add `trustedOrigins` to the Better Auth config from `CORS_ORIGINS`.

The current plan deliberately keeps the auth interface narrow (`c.var.tenant: TenantUser`) so this is a single-file change plus config.

## What is explicitly **out of scope**

- No edits to `apps/app`, `apps/web`, `apps/native`, `@repo/api-client`, or any client code.
- No edits to `@repo/auth` (any cookie parsing the middleware needs is done locally in `apps/api`).
- No Better Auth introduction yet — the seam is documented, not implemented.
- No OpenAPI / Swagger.
- No Docker / Vercel / CI changes.
- No migration of routes beyond `clients`.

## Critical files to read while implementing

- `apps/app/app/api/clients/route.ts` and `apps/app/app/api/clients/[id]/route.ts` — exact behavior to mirror.
- `apps/app/app/api/clients/[id]/summary/route.ts` and `apps/app/app/api/clients/[id]/follow-ups/**` — secondary endpoints.
- `apps/app/app/api/validation.ts` — exact 400 shape to match.
- `apps/app/middleware.ts` and `apps/app/next.config.mjs` — current CORS behavior to mirror, then tighten via `CORS_ORIGINS`.
- `packages/auth/src/auth.ts` — confirm whether `getCurrentUserFromRequest` reads cookies; drives whether `requireTenant` needs local cookie parsing.
- `packages/auth/src/tenant.ts` — already confirmed: standard `Request` compatible, returns `TenantUser`.
- `packages/database/src/client.ts` — confirm exported pool handle for graceful shutdown.
- `scripts/with-root-env.mjs` — confirm it's a drop-in for `tsx watch`.
- `.agents/skills/hono/SKILL.md` — re-check before touching middleware/RPC chaining.
- `.agents/skills/better-auth-best-practices/SKILL.md` — read before doing the migration seam (later PR).

## Verification

1. **Install & types**
   - `pnpm install` at repo root.
   - `pnpm --filter @repo/api typecheck` passes.
   - `pnpm --filter @repo/api build` produces `dist/index.js`.
2. **Run locally**
   - `pnpm dev:api` starts on port 3002 with env from `.env.local` + `.env.database.dev`.
   - `curl http://localhost:3002/health` → `{ ok: true }`.
3. **Parity check for `clients`** (against `apps/app` on 3000)
   - Log in via `apps/app` to get a session token.
   - `curl -H 'Authorization: Bearer <token>' http://localhost:3002/api/v1/clients` returns the same payload as `http://localhost:3000/api/clients`.
   - Duplicate-phone create → `409 { error, code: 'duplicate-phone' }`.
   - Invalid body → 400 with the same Zod error shape as today.
   - No-auth request → 401.
4. **RPC type smoke (scratch, not committed)**
   - `import type { AppType } from '@repo/api'` and `const client = hc<AppType>('http://localhost:3002')` — confirm `client.api.v1.clients.$get` and `$post({ json: ... })` are fully typed.
5. **Tests**
   - `pnpm --filter @repo/api test:unit` — clients router cases pass using `app.request(...)`.
6. **Graceful shutdown**
   - `Ctrl+C` the dev server; next start shows no Postgres "connection terminated unexpectedly" warnings.
