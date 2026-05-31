# Air-Gapped VPS Deployment (Iran / no-internet servers)

This is the deployment workflow for Iranian VPS servers that have **no internet
access at all**. The server cannot reach Docker Hub, the npm registry, Google
Fonts, Cloudflare, or any external service.

> **Core principle:** Build everything on a machine that **has** internet,
> produce sealed artifacts, copy them to the VPS, and run them there. The VPS
> never fetches anything at build or run time.

## Stack recap

- pnpm + turbo monorepo
- `@repo/api` — Hono (Node server via `@hono/node-server`)
- `@repo/web`, `@repo/pwa` — Next.js
- Postgres 16 (`docker-compose.yml`)
- Drizzle ORM migrations (`@repo/database`)

> CF Workers and Expo push are **not** used in production (Iran constraints).

## What "no internet" breaks, and the fix

| Step | Needs internet | Air-gapped solution |
|---|---|---|
| `docker pull postgres:16` | Docker Hub | `docker save` → tarball → `docker load` |
| `pnpm install` on VPS | npm registry | bundle deps into the image on the build box |
| `tsx src/index.ts` at runtime | resolves deps live | pre-bundle Hono to plain JS |
| Next.js build | npm + Google Fonts | build on build box, ship `standalone` output |
| CF Workers / push | Cloudflare | not used in prod |

## Recommended approach: Docker image tarballs

One sealed image per service. The OS, Node runtime, and deps travel together —
most robust for air-gap. The **build box** is your laptop or any CI runner that
has internet + Docker.

---

## Phase 0 — One-time VPS prep (needs USB stick or one-time connectivity)

The VPS needs **Docker + docker compose plugin installed**. Either:

- Install from your distro's offline package mirror, or
- Download the Docker static binaries + compose plugin on the build box and
  `scp` them over.

Verify, then everything after this is fully offline:

```bash
docker --version
docker compose version
```

---

## Phase 1 — Build artifacts (on the build box, with internet)

Three images to build + one to pull:

1. **`api`** — multi-stage: `pnpm install` + bundle Hono (esbuild) → slim
   `node:20-alpine` runtime. Move off `tsx`-at-runtime to a real bundle so
   node_modules don't need resolving live.
2. **`web`** and **`pwa`** — Next.js with `output: 'standalone'` in
   `next.config`, so each ships a self-contained server + only the node_modules
   it needs. **Self-host fonts** (`next/font/local`) — `next/font/google`
   fetches at build time.
3. **postgres** — just pull the official image; no custom build.

```bash
# build app images (with internet)
docker build -t saloon-api:1.0  -f apps/api/Dockerfile .
docker build -t saloon-web:1.0  -f apps/web/Dockerfile .
docker build -t saloon-pwa:1.0  -f apps/pwa/Dockerfile .
docker pull postgres:16-alpine

# seal them into one tarball
docker save saloon-api:1.0 saloon-web:1.0 saloon-pwa:1.0 postgres:16-alpine \
  | gzip > saloon-release-1.0.tar.gz
```

---

## Phase 2 — Transfer

```bash
scp saloon-release-1.0.tar.gz user@vps:/opt/saloon/
scp docker-compose.prod.yml .env.production user@vps:/opt/saloon/
```

If SSH is restricted, this is the USB-stick step — same tarball.

---

## Phase 3 — Load & run (on the VPS, offline)

```bash
cd /opt/saloon
gunzip -c saloon-release-1.0.tar.gz | docker load   # imports all 4 images
docker compose -f docker-compose.prod.yml up -d
```

`docker-compose.prod.yml` references the loaded image tags
(`saloon-api:1.0`, etc.) with **no `build:` and no registry**, so Docker uses
the locally-loaded images and never reaches out.

---

## Phase 4 — Migrations

Migrations run on the VPS against the real DB. `drizzle-kit` + the migration SQL
are already inside the `api` image, so it works offline. Run once after the DB
container is healthy, before the API serves traffic:

```bash
docker compose -f docker-compose.prod.yml run --rm api pnpm db:migrate:main
```

---

## Phase 5 — Updates / redeploys

Repeat phases 1–4 with a new tag (`1.1`):

- `docker load` adds the new image alongside the old.
- `docker compose up -d` swaps containers.
- Keep the previous tag for rollback — point the compose file back to it.
- The Postgres volume (`postgres_data`) persists across deploys. **Never delete it.**

---

## Repo gaps to close before the first deploy

1. **No Dockerfiles** — need three (api, web, pwa).
2. **API runs `tsx` at runtime** — fine for dev; bundle it for prod so the
   runtime image stays slim and deterministic.
3. **`next.config` needs `output: 'standalone'`** for web and pwa.
4. **Google Fonts** — anything using `next/font/google` must move to
   `next/font/local` with font files committed, or builds/runtime stall
   reaching `fonts.googleapis.com`.
5. **No `docker-compose.prod.yml`** — current compose only has Postgres. Need a
   prod variant wiring all 4 services + an internal Docker network so
   api↔db↔web talk over container DNS, not the internet.

---

## Quick reference

```bash
# Build box
docker build -t saloon-api:<v> -f apps/api/Dockerfile .
docker build -t saloon-web:<v> -f apps/web/Dockerfile .
docker build -t saloon-pwa:<v> -f apps/pwa/Dockerfile .
docker pull postgres:16-alpine
docker save saloon-api:<v> saloon-web:<v> saloon-pwa:<v> postgres:16-alpine | gzip > saloon-release-<v>.tar.gz
scp saloon-release-<v>.tar.gz user@vps:/opt/saloon/

# VPS (offline)
gunzip -c saloon-release-<v>.tar.gz | docker load
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml run --rm api pnpm db:migrate:main
```
