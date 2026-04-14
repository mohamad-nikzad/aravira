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
4. Add the same variables to your local `.env.local`.
5. Set `JWT_SECRET` in both Vercel and `.env.local`.

Example:

```env
DATABASE_URL=postgresql://user:password@ep-xxxx-pooler.region.aws.neon.tech/dbname?sslmode=require
DATABASE_URL_DIRECT=postgresql://user:password@ep-xxxx.region.aws.neon.tech/dbname?sslmode=require
JWT_SECRET=replace-with-a-long-random-secret
```

## Local development

```bash
bun install
bun run db:push
bun run db:seed
bun run dev
```

## Switching providers later

If you move to another provider or a VPS:

1. Create a new PostgreSQL database.
2. Update `DATABASE_URL`.
3. Update `DATABASE_URL_DIRECT` if you want migrations/seeds to use a direct connection.
4. Run `bun run db:push` or your preferred Drizzle migration flow.
5. Seed if needed with `bun run db:seed`.

No Neon-specific SDK is required by the app, so the code does not need to change just because the host changes.