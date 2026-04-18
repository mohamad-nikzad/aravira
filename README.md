# Aravira Saloon

## Database setup

This project is intentionally configured to stay portable across Neon, Supabase, Railway, Render, or your own VPS.

- The app uses standard PostgreSQL through `drizzle-orm` and `postgres`
- Runtime reads `DATABASE_URL`
- Migrations and seeds prefer `DATABASE_URL_DIRECT` and fall back to `DATABASE_URL`
- Moving to another provider is mostly a matter of changing env vars and running migrations

## Neon + Vercel

1. Create a Postgres database in Neon.
2. Copy the pooled connection string into Vercel as `DATABASE_URL`.
3. Copy the direct connection string into Vercel as `DATABASE_URL_DIRECT`.
4. For local work, add the same database variables to `.env.database.main` (and a dev branch file if you use split env; see **Local development** below). Put `JWT_SECRET` in `.env.local`.
5. Set `JWT_SECRET` in both Vercel and `.env.local`.

Example:

```env
DATABASE_URL=postgresql://user:password@ep-xxxx-pooler.region.aws.neon.tech/dbname?sslmode=require
DATABASE_URL_DIRECT=postgresql://user:password@ep-xxxx.region.aws.neon.tech/dbname?sslmode=require
JWT_SECRET=replace-with-a-long-random-secret
```

## Local development

Use a **split env** so you can switch Neon branches without editing secrets:

- `.env.local` — `JWT_SECRET`, VAPID keys, and anything else that is not branch-specific
- `.env.database.dev` — `DATABASE_URL` + `DATABASE_URL_DIRECT` for your **dev** Neon branch
- `.env.database.multitenant` — `DATABASE_URL` + `DATABASE_URL_DIRECT` for the multi-tenant MVP feature branch
- `.env.database.main` — same for your **production** Neon branch

Scripts (via Bun) load `.env.local` first, then the database file, so the database URLs always match the command you run:

```bash
bun install
bun run db:push       # schema → dev branch (default)
bun run db:seed       # seed dev branch
bun run dev           # Next.js against dev branch

bun run db:migrate:multitenant  # checked-in migrations → multi-tenant feature branch
bun run db:seed:multitenant     # seed multi-tenant feature branch
bun run dev:multitenant         # Next.js against multi-tenant feature branch

bun run dev:main      # Next.js against production branch (read/write — be careful)
bun run db:push:main  # schema → production (use with care)
```

## Switching providers later

If you move to another provider or a VPS:

1. Create a new PostgreSQL database.
2. Update `DATABASE_URL`.
3. Update `DATABASE_URL_DIRECT` if you want migrations/seeds to use a direct connection.
4. Run `bun run db:push` or your preferred Drizzle migration flow.
5. Seed if needed with `bun run db:seed`.

No Neon-specific SDK is required by the app, so the code does not need to change just because the host changes.
