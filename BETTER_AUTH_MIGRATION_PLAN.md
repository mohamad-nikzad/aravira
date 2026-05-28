# Migrate to Better Auth (username + organization plugins)

> **Revised 2026-05-28.** The original plan targeted a Next.js full-stack `apps/app`
> that has since been superseded. The current client topology and scope decisions
> are reflected below.

## Context

`@repo/auth` is a hand-rolled JWT + bcrypt stack: phone+password login, custom
`requireTenant` middleware, role checks (`manager`/`staff`), and a one-salon-per-user
model where `users.salonId` is a NOT NULL FK. Every domain table carries `salonId`.

**No real data exists** — everything in the DB is throwaway test users/data. We can
drop tables, wipe the DB, and regenerate the migration baseline freely. No backfill,
no data-preservation step, no migration-of-existing-rows anywhere in this plan.

### Current topology (what actually exists)

- **`apps/api` (Hono)** — the single auth backend. Mounts routes under `/api/v1/*`.
- **`apps/pwa`** — TanStack Router SPA. Talks to Hono via `@repo/api-client` with
  `credentials: 'include'` (cross-origin **cookie** session). Does **not** import
  `@repo/auth` or `better-auth/react`.
- **`apps/native`** — Expo app. Uses the **same** `@repo/api-client`, but with a
  **bearer token** stored in `expo-secure-store`.
- **`apps/app`** — old Next.js full-stack app with its own API routes wired into
  `@repo/auth`'s `auth-next`/`tenant-next` exports. **Out of scope** (see below).
- **`apps/web`** — marketing site. No auth. Untouched.

### Scope decisions for this migration

1. Replace the in-house auth on **Hono + PWA only**.
2. **`apps/native` is considered but not changed now.** We keep a token path alive
   (Better Auth `bearer` plugin) so native can adopt it later without a redesign,
   but we do not preserve its current `{ user, token }` response contract and we
   accept that native is broken until it's migrated separately.
3. **`apps/app` is out of scope and allowed to break.** We leave `@repo/auth`'s
   legacy files (`auth.ts`, `auth-next.ts`, `tenant.ts`, `tenant-next.ts`,
   `signup.ts`) in place so we don't actively rip it out, but we will not keep it
   building. The schema rewrite below will break its direct DB usage; that's accepted.

---

## Auth model: session-based (not JWT + refresh)

Better Auth is **session-based by default**, and that is the right fit here:

- The source of truth is a row in the `session` table. The client holds a signed,
  httpOnly session token; every request resolves it against the DB.
- A short-lived **cookie cache** (~30–60s) avoids a Postgres read on every request,
  while the DB row stays authoritative.
- Sessions are **rolling** (`expiresIn` + `updateAge`) — activity slides the expiry
  forward. There is no separate refresh token to rotate.

Why session over JWT+refresh for us:

| | Session (chosen) | JWT + refresh |
|---|---|---|
| Revocation | Delete the row → instant cutoff (manager fires staff, access dies now) | Access token valid until expiry; needs a denylist (= a DB lookup, i.e. sessions but worse) |
| Where it shines | One service, one DB — exactly us | Many services / edge verifying statelessly |
| Our deployment | Postgres is right there; lookup is cheap + cached | Iran/VPS, no Cloudflare Workers — no edge tier where stateless JWT pays off |
| Complexity | Built in | Hand-rolled rotation, reuse detection, denylist |

**One model, two transports**: cookie for the PWA (browser), `Authorization: Bearer`
for native (via the `bearer` plugin) — both backed by the same `session` table.

Token storage per client:
- **PWA**: httpOnly + Secure + `SameSite=None` cookie (never localStorage — httpOnly
  keeps it out of reach of XSS). This is what the API already sets today.
- **Native (later)**: session token in `expo-secure-store` (Keychain/Keystore), sent
  as a bearer header.

Lifetimes to set deliberately:
- `session.expiresIn: 7d`, `session.updateAge: 1d` (rolling).
- `session.cookieCache: { enabled: true, maxAge: 60 }` to spare Postgres on the PWA hot path.

---

## Architecture

```
@repo/auth
 ├─ src/server.ts       → exports `auth` (betterAuth instance)   [NEW]
 ├─ src/client.ts       → exports `authClient` (web only)        [NEW]
 ├─ src/permissions.ts  → role → permission map                 [NEW]
 ├─ src/auth.ts, auth-next.ts, tenant.ts, tenant-next.ts, signup.ts  [LEGACY, kept for apps/app]
 └─ src/index.ts        → re-exports

apps/api (Hono)         ← ONLY place Better Auth is mounted
 ├─ app.ts → app.on(["GET","POST"], "/api/v1/auth/*", c => auth.handler(c.req.raw))
 ├─ middleware/auth.ts  → requireTenant() wraps auth.api.getSession()
 ├─ routes/auth.ts      → keep only the signup-salon wrapper
 └─ routes/staff.ts     → signUpEmail + addMember + salon_member sidecar

apps/pwa (TanStack SPA)
 └─ keeps cookie session via @repo/api-client (credentials: 'include')
```

Better Auth is **not** mounted in Next.js (the old `[...all]` / `toNextJsHandler`
approach is dropped — the PWA isn't a Next.js app).

---

## Phased rollout

Each phase is independently committable and ends with a **gate** that must pass
before starting the next. Phases 1–3 are server-only (PWA still runs on the legacy
endpoints until Phase 4 cuts it over).

| Phase | Scope | Outcome |
|---|---|---|
| 0 | Package + config skeleton | `auth` instance compiles, no behavior change |
| 1 | Database schema | Better Auth tables + sidecars exist on a clean baseline |
| 2 | Hono mount + middleware | Better Auth handler live; `requireTenant` reads BA sessions |
| 3 | Signup + staff wrappers | New users/orgs created through Better Auth |
| 4 | PWA cutover | PWA logs in/out via Better Auth; legacy auth retired from the live path |

---

### Phase 0 — Package + Better Auth config skeleton

Stand up the `auth` instance without wiring it to anything yet.

**Do**
- `packages/auth/package.json` — add `better-auth` (keep `bcryptjs`/`jose`; legacy
  files stay for the frozen apps/app).
- Create `packages/auth/src/server.ts`:
  ```ts
  import { betterAuth } from "better-auth";
  import { drizzleAdapter } from "better-auth/adapters/drizzle";
  import { username } from "better-auth/plugins/username";
  import { organization } from "better-auth/plugins/organization";
  import { bearer } from "better-auth/plugins/bearer";
  import { db } from "@repo/database";

  export const auth = betterAuth({
    database: drizzleAdapter(db, { provider: "pg" }),
    basePath: "/api/v1/auth",
    emailAndPassword: { enabled: true },
    session: {
      expiresIn: 60 * 60 * 24 * 7,   // 7d
      updateAge: 60 * 60 * 24,        // roll daily
      cookieCache: { enabled: true, maxAge: 60 },
    },
    plugins: [
      username({ minUsernameLength: 10, maxUsernameLength: 15 }), // 11-digit 09xxxxxxxxx fits
      organization({ allowUserToCreateOrganization: false }),     // only our signup wrapper creates orgs
      bearer(),                                                   // native token transport (future)
    ],
    trustedOrigins: [process.env.PWA_ORIGIN!],
  });
  ```
- Create `packages/auth/src/permissions.ts` — `mapRole` (`owner`/`admin` → `manager`,
  `member` → `staff`) + reuse the permission sets from `tenant.ts`.
- Env: add `BETTER_AUTH_SECRET` (32+ chars), `BETTER_AUTH_URL`, `PWA_ORIGIN` to
  `.env.local` / `.env.example`. Keep `JWT_SECRET` (legacy).
- `packages/auth/src/index.ts` — add new exports beside the legacy re-exports.

**Gate**
- `pnpm --filter @repo/auth typecheck` green. No runtime behavior changed yet.

---

### Phase 1 — Database schema

Generate Better Auth tables and the salon sidecars on a clean baseline.

**Do**
1. `npx @better-auth/cli@latest generate --config packages/auth/src/server.ts` →
   Drizzle defs for `user`, `session` (with `activeOrganizationId`), `account`,
   `verification`, `organization`, `member`, `invitation`, plus `username`/
   `displayUsername`.
2. **Do not mass-rename `salonId` → `organizationId`.** Keep the TS field `salonId`
   and DB column `salon_id`; just **repoint the FK target** from `salons.id` to
   `organization.id`. Column name and FK target are independent in Drizzle, so all 23
   domain tables and every `salonId` query stay as-is — far less churn/risk.
3. Add typed sidecars:
   ```
   salon_profile { organizationId PK (FK organization.id), timezone, locale,
                   status, phone, address }
   salon_member  { id, userId (FK user.id), organizationId (FK organization.id),
                   displayName, color, active, createdAt }
   ```
   `role` lives on Better Auth's `member` row, not on `salon_member`.
4. Drop the old `users` table from the new path.
5. Wipe `packages/database/drizzle/*`, then `pnpm db:generate` + `pnpm db:push` for a
   single clean baseline. (This is what breaks the frozen apps/app — accepted.)

**Gate**
- `pnpm db:push` succeeds against a wiped DB. `pnpm --filter @repo/database typecheck` green.

---

### Phase 2 — Hono mount + tenant middleware

Make Better Auth sessions the source of truth for the API.

**Do**
- `apps/api/src/app.ts` — mount the handler:
  ```ts
  app.on(["GET", "POST"], "/api/v1/auth/*", (c) => auth.handler(c.req.raw));
  ```
  (CORS already allows `Authorization` + `credentials: true`; cross-origin cookie
  needs `SameSite=None; Secure`, already set.)
- `apps/api/src/middleware/auth.ts` — rewrite `requireTenant`. Derive `salonId` from
  the user's **single member row** (not `session.activeOrganizationId`):
  ```ts
  export const requireTenant = (perm?: TenantPermission) =>
    factory.createMiddleware(async (c, next) => {
      const session = await auth.api.getSession({ headers: c.req.raw.headers });
      if (!session?.user) return error(c, "دسترسی غیرمجاز", 401);

      const member = await getMemberForUser(session.user.id);
      if (!member) return error(c, "دسترسی غیرمجاز", 403);

      const role = mapRole(member.role); // 'manager' | 'staff'
      if (perm && !hasTenantPermission(role, perm)) return error(c, "دسترسی غیرمجاز", 403);

      c.set("tenant", {
        userId: session.user.id,
        salonId: member.organizationId,
        role,
        name: session.user.name,
        phone: session.user.username,
      });
      await next();
    });
  ```
  The `TenantUser` shape is preserved → **no domain route changes needed**.

**Gate**
- A row seeded directly (user + org + member) authenticates: `GET /api/v1/auth/get-session`
  returns the session, and a `requireTenant`-guarded route returns 200 with correct
  `salonId`/`role`. Manager-only route returns 403 for a `member`.

---

### Phase 3 — Signup + add-staff wrappers

Replace the hand-rolled creation paths with Better Auth server APIs.

**Do**
- `apps/api/src/routes/auth.ts` — keep one wrapper `POST /api/v1/auth/signup`
  (transaction):
  1. `auth.api.signUpEmail({ body: { email: `${phone}@aravira.local`, username: phone, name, password } })`
  2. `auth.api.createOrganization({ body: { name: salonName, slug, userId } })`
     (server-side call bypasses `allowUserToCreateOrganization: false`)
  3. Insert `salon_profile`
  4. Issue the session (cookie set by Better Auth)

  Drop the hand-rolled `login`/`logout`/`me` — Better Auth's handler serves
  `/sign-in`, `/sign-out`, `/get-session` under `/api/v1/auth/*`.
- `apps/api/src/routes/staff.ts` — manager-only `POST /api/v1/staff`:
  1. `auth.api.signUpEmail(...)` (server-side; no session impact for the caller)
  2. `auth.api.addMember({ body: { userId, role: "member", organizationId: c.var.tenant.salonId } })`
  3. Insert `salon_member` sidecar (color, active). No email invite.

**Gate**
- Signup → org + `salon_profile` + owner membership created; session cookie returned.
- Manager adds staff → new user + `member(role: member)` + `salon_member`; staff can
  sign in; `c.var.tenant.role === 'staff'`.
- `pnpm --filter @repo/api test` green (auth/staff route tests updated).

---

### Phase 4 — PWA cutover

Point the PWA at Better Auth and retire the legacy auth from the live path.

**Do**
- `packages/api-client/src/endpoints.ts` / `auth.ts` — align auth paths with Better
  Auth (`sign-in`/`sign-out`/`get-session`); keep `signup` wrapper + a `me` shim that
  returns the legacy `User` (role mapped, `salonId` from member row) so
  [apps/pwa/src/lib/auth.tsx](apps/pwa/src/lib/auth.tsx) stays untouched.
- PWA login/signup — call the new endpoints. **Sign-in decision still open**:
  - **(a)** add `better-auth/react` `authClient` to the PWA and call
    `authClient.signIn.username(...)` (documented happy path), or
  - **(b)** keep the PWA uniform on `@repo/api-client` by POSTing to the raw
    `/api/v1/auth/sign-in/username` JSON endpoint.
  - If (a): create `packages/auth/src/client.ts` (web auth client). If (b): no new file.
- The PWA already uses `credentials: 'include'`
  ([apps/pwa/src/lib/api-client.ts](apps/pwa/src/lib/api-client.ts)) — cookie session
  needs no transport change.

**Gate (full migration acceptance)**
1. PWA login: username sign-in → cookie set → `/me` shim returns legacy `User`
   (`role: 'manager'`, `salonId` from member row) → redirect to app.
2. Revocation: deleting the session row immediately 401s the next PWA request.
3. Tenant-isolation test (`apps/api/__tests__/tenant-isolation.test.ts`) still passes.
4. `pnpm typecheck && pnpm test` green for `apps/api`, `apps/pwa`, `@repo/auth`,
   `@repo/api-client`. (`apps/app` excluded — known broken, out of scope.)

---

## Out of scope (allowed to break)

- `apps/native`, `apps/web`.
- `apps/app` and `@repo/auth`'s legacy files (`auth.ts`, `auth-next.ts`, `tenant.ts`,
  `tenant-next.ts`, `signup.ts`) — left in place, not kept building.
