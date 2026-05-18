# Plan: Port remaining Next.js API routes to `apps/api`

## Context

The Hono API app (`apps/api`) has landed with `clients` ported end-to-end as the reference pattern (see `API_APP_PLAN.md`). All other domains still live in `apps/app/app/api/**` as Next.js route handlers. This plan ports the remaining **38 route files across 12 domains** to Hono, preserving response shapes so `@repo/api-client` keeps working once the base URL flips.

**Ground rules carried forward from `API_APP_PLAN.md`:**
- Mount under `/api/v1/<domain>` (not `/api/`).
- Single fluent `app.route(...)` chain in `src/app.ts` to preserve RPC type inference.
- Each domain router is one chained `new Hono<AppEnv>()...` and exports `typeof route`.
- Handlers are inline; validators use `zValidator` from `src/lib/validate.ts` with schemas from `@repo/salon-core/forms/*` — **no new schemas**.
- All auth goes through `requireTenant(permission?)` from `src/middleware/auth.ts`; routes only read `c.var.tenant`.
- Response shapes match the current Next.js contract (including 400/409 error codes) so the typed client doesn't change.
- No edits to `apps/app` clients, `@repo/api-client`, or `@repo/auth` in this batch (we keep the Next.js routes in place during rollout; the swap is a client-side base-URL flip done separately).
- Better Auth is still **not** introduced here — auth seam stays narrow per the original plan.

---

## What the new API already provides

- `src/factory.ts`, `src/app.ts`, `src/index.ts`, `src/env.ts`
- `src/middleware/auth.ts` — `requireTenant(permission?)` reading `c.req.raw`
- `src/middleware/error.ts` — `onError` + `notFound` with shared shape
- `src/lib/responses.ts` — `ok` / `created` / `error`
- `src/lib/validate.ts` — `zValidator` with shared error hook
- `src/routes/health.ts`, `src/routes/clients.ts` (reference)

Everything below reuses these. No new framework primitives are added.

---

## Domains to port (inventory)

Counts include nested routes. Methods listed are what the existing Next.js files export.

| # | Domain (`/api/v1/...`) | Endpoints | Notes |
|---|---|---|---|
| 1 | `auth` | `POST /login`, `POST /logout`, `GET /me`, `POST /signup` | Public (no `requireTenant`); cookies via `hono/cookie` |
| 2 | `appointments` | `GET /`, `POST /`, `GET /:id`, `PATCH /:id`, `DELETE /:id`, `GET /availability`, `POST /:id/complete-client` | Side effects: notifications + web push; placeholder-client logic |
| 3 | `services` | `GET /`, `POST /`, `GET /:id`, `PATCH /:id`, `GET /:id/addons`, `GET /:id/combo-components`, `PUT /:id/combo-components`, `POST /import-starter-templates` | Role-aware visibility (staff = active only) |
| 4 | `service-families` | `GET /`, `POST /`, `PATCH /:id` | Standard CRUD |
| 5 | `service-categories` | `GET /`, `POST /`, `PATCH /:id` | Standard CRUD |
| 6 | `service-addons` | `GET /`, `POST /`, `PATCH /:id` | Standard CRUD |
| 7 | `staff` | `GET /`, `POST /`, `GET /:id/schedule`, `PUT /:id/schedule`, `PATCH /:id/services`, `GET /booking-availability` | Manager-only writes |
| 8 | `notifications` | `GET /` (`?unreadOnly`), `POST /:id/read`, `POST /read-all`, `POST /test` | `/test` gated on `ENABLE_NOTIFICATION_TEST` + non-prod |
| 9 | `push` | `GET /config`, `POST /subscribe`, `DELETE /subscribe` | Returns VAPID public key; web-push integration |
| 10 | `settings` | `GET /business`, `PATCH /business` | Manager-only PATCH |
| 11 | `dashboard` / `today` / `retention` / `onboarding` / `notification-preferences` | Mostly `GET`; `PATCH` on retention/onboarding/notification-preferences | Analytics + user/workspace state |

**Total: 38 route files → 11 routers under `apps/api/src/routes/`.**

For each row, the source of truth is `apps/app/app/api/<domain>/**`. Behaviour must be byte-identical for JSON bodies and status codes — including error `code` values like `'duplicate-phone'`.

---

## Cross-cutting work (do before/alongside domain porting)

### A. Side-effect helpers — extract from `apps/app/lib`

`appointments`, `notifications`, and `push` depend on helpers currently living in `apps/app/lib/**` (e.g. `createNotificationForUser`, `sendWebPushToUser`, `isWebPushConfigured`, VAPID config readers).

- **Move** these into a shared package — preferred location: `packages/notifications/` (new) or fold into `@repo/salon-core` if small. They must not import `next/*`.
- Update `apps/app` imports to the new package path in the same PR that moves them (no behaviour change, just relocation).
- `apps/api` then imports the same module — no duplication.

### B. Public-route handling (auth domain)

`requireTenant` is for tenant-scoped routes. `auth/login` and `auth/signup` are pre-auth and **must not** be wrapped. `auth/me` and `auth/logout` need the current bearer/cookie but tolerate "no session" cases differently than `requireTenant`'s 401:

- Add a thin `getOptionalTenant(c)` helper in `src/middleware/auth.ts` (returns `TenantUser | null`) for `auth/me`.
- Use `hono/cookie`'s `setCookie` / `deleteCookie` to mirror the current `session` cookie attributes (httpOnly, secure in prod, sameSite, path, maxAge). Copy attributes verbatim from the existing Next.js `login` handler — don't guess.

### C. Role-aware GETs

Several GETs (`services`, `appointments`, `staff`) return a subset based on role. Today this lives inline in the route. Port the same branching into the Hono handler reading `c.var.tenant.role` / permissions — **don't** invent a new helper.

### D. CORS / cookies for cross-origin

Once clients call `apps/api` on a different origin from `apps/app`, the `session` cookie set by `auth/login` needs `sameSite: 'none'` + `secure: true` in non-dev, **and** `cors({ credentials: true })` must list the web origin. Verify `env.CORS_ORIGINS` covers all client origins (web + native dev).

This is gated behind the actual cutover. For this batch, keep the same cookie attributes as Next.js to avoid drift — note the follow-up in `## Out of scope` below.

---

## Per-domain porting recipe

Each domain follows the same pattern. Concretely, for a domain `foo`:

1. **Read source**: `apps/app/app/api/foo/**/*.ts` (every method) + `apps/app/app/api/validation.ts` for the 400 shape (already mirrored in `src/middleware/error.ts`).
2. **Create router**: `apps/api/src/routes/foo.ts`
   ```ts
   const foo = new Hono<AppEnv>()
     .use(requireTenant('manage_clients'))            // or .use(requireTenant()) for read-only authed
     .get('/', zValidator('query', listSchema), async (c) => { ... })
     .post('/', zValidator('json', createSchema), async (c) => { ... })
     .get('/:id', zValidator('param', idParamSchema), async (c) => { ... })
     // ...
   export type FooRoute = typeof foo
   export { foo }
   ```
   - If some routes are public/optional-auth (auth domain), do not chain a router-level `.use(requireTenant(...))`; wrap individual routes instead.
   - If a GET is role-aware, drop the permission requirement and branch on `c.var.tenant.role` inside the handler.
3. **Mount** in `src/app.ts` inside the existing fluent chain:
   ```ts
   .route('/api/v1/foo', foo)
   ```
4. **Reuse schemas** from `@repo/salon-core/forms/*`. If a schema doesn't exist for a query/param, add it to `salon-core/forms` — never inline in the route.
5. **Reuse DB functions** from `@repo/database/*`. No DB code in `apps/api`.
6. **Match error contracts**: codes like `'duplicate-phone'`, the specific 409s/422s in the Next.js handler, and the Persian fallback message.
7. **Tests** at `apps/api/src/routes/foo.test.ts` using `app.request(...)`:
   - 401 with no auth (where applicable).
   - 403 with wrong permission (where applicable).
   - Happy-path 200/201 shape.
   - One representative validation error → 400 with the shared shape.
   - Any domain-specific error code (e.g. `'duplicate-phone'`).
   - Role-aware GETs: one test per role branch.

---

## Suggested order (smallest blast radius first)

1. **Cross-cutting A** — extract `notifications` / `push` helpers out of `apps/app/lib`.
2. **service-families**, **service-categories**, **service-addons** — pure CRUD warm-up; validate the per-domain recipe end-to-end.
3. **settings/business**, **notification-preferences**, **onboarding**, **retention** — small surface, no side effects.
4. **services** (incl. nested addons / combo-components / import-starter-templates) — role-aware GET; combo validation.
5. **staff** (incl. schedule / services / booking-availability).
6. **dashboard**, **today** — read-only aggregates.
7. **notifications** + **push** — relies on helpers from step 1.
8. **appointments** — biggest; placeholder-client logic + notification/push side effects. Do last so the helpers and patterns are stable.
9. **auth** — depends on cookie/CORS decisions; do last so the cutover can be staged behind a base-URL flip.

This order also keeps each PR small (1–2 domains).

---

## Verification per PR

- `pnpm --filter @repo/api typecheck && pnpm --filter @repo/api build` clean.
- `pnpm --filter @repo/api test:unit` — new router tests pass.
- Manual parity check against the live Next.js route for at least one happy path and one error path:
  - `curl -H 'Authorization: Bearer <token>' http://localhost:3002/api/v1/<path>` matches `http://localhost:3000/api/<path>` (body + status).
- RPC smoke (scratch, not committed): `hc<AppType>('http://localhost:3002')` resolves the newly added paths with full input/output types.

---

## Out of scope (explicit)

- **Client cutover**: `@repo/api-client` keeps pointing at Next.js routes during this work. A separate PR flips the base URL to `apps/api` once parity is verified across domains.
- **Removing Next.js handlers** in `apps/app/app/api/**`: leave them in place until the client cutover ships and bakes. Removal is a follow-up.
- **Better Auth migration**: still deferred; the seam documented in `API_APP_PLAN.md` is unchanged.
- **Cross-origin cookie hardening** (`sameSite: 'none'`, `secure`, `trustedOrigins`): paired with the client cutover, not this batch.
- **OpenAPI / Swagger**, **rate limiting**, **Docker/CI changes** — out of scope.
- **New domains** not present in `apps/app/app/api/**` today.

---

## Critical files to read while implementing

- `API_APP_PLAN.md` — original conventions; don't deviate.
- `apps/api/src/routes/clients.ts`, `apps/api/src/app.ts`, `apps/api/src/middleware/auth.ts` — reference patterns.
- `apps/app/app/api/<domain>/**` — exact behaviour to mirror, per PR.
- `apps/app/app/api/validation.ts` — 400 shape (already mirrored in `src/middleware/error.ts`).
- `apps/app/lib/**` for notifications + web push helpers — these move to a shared package in cross-cutting step A.
- `@repo/salon-core/forms/*` — schema source of truth; extend here if a query/param schema is missing.
- `@repo/database/*` — DB functions; all data access stays here.
- `.agents/skills/hono/SKILL.md` — re-check before each router for chaining/RPC rules.
