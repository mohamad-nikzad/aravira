# VPS connectivity and Iranian mirror audit

Audit date: **2026-06-05**

This document records outbound connectivity, Iranian mirror coverage, and CI/CD
feasibility for the Saluna ParsPack VPS. It complements
[`VPS_AIRGAPPED_DEPLOYMENT.md`](./VPS_AIRGAPPED_DEPLOYMENT.md), which describes
the tarball-based deploy workflow.

## Executive verdict

The Iranian-infra deployment plan is **doable**, but the desired end state should
not be laptop-built tarballs. Tarballs are a bootstrap and disaster-recovery
fallback.

The real-world target should be:

```text
HamGit push
  -> Hamravesh/HamGit runner builds only changed app images
  -> CI pushes versioned images to registry.hamdocker.ir
  -> CI SSHs to the ParsPack origin IP
  -> VPS pulls and restarts only affected services
```

This gives Saluna:

- faster deploys because `api`, `web`, and `pwa` can deploy independently
- no large `deploy/releases/*.tar.gz` files on the developer laptop during
  normal releases
- real app versions such as `0.7.1`, not only date-style image tags
- registry/cache-based image retention instead of local artifact hoarding
- tarball fallback when registry/CI access breaks

Do **not** optimize for:

- GitHub Actions deploying directly to the ParsPack VPS
- production builds on the VPS as the default path
- Docker Hub / npmjs / default Alpine CDN access from the VPS
- one shared image tag for all apps forever

## VPS identity

| Item | Value |
| --- | --- |
| **Origin IP (SSH)** | `195.177.255.24` |
| **Hostname** | `srv3907571007` |
| **Provider** | ParsPack |
| **OS** | Debian 13 (trixie) |
| **Docker** | 26.1.5 |

**Do not SSH to the Arvan CDN addresses** (`185.143.233.234`, `185.143.234.234`).
`saluna.ir` / `api.saluna.ir` resolve there for HTTP(S). Port 22 times out on
those IPs. Use the ParsPack origin IP above.

### Access notes

| Method | Status |
| --- | --- |
| `root` + password (`.codex/deploy/vps_root_password.txt`) | Works |
| `deploy` + `.codex/deploy/saluna_vps_ed25519` | Permission denied (not configured) |

### Production stack (at time of audit)

All containers healthy under `/opt/saluna`:

| Container | Image tag (example) | Status |
| --- | --- | --- |
| `saluna-api` | `saluna-api:2026-06-04-1304` | healthy |
| `saluna-web` | `saluna-web:2026-06-04-1304` | healthy |
| `saluna-pwa` | `saluna-pwa:2026-06-04-1304` | healthy |
| `saluna-gateway` | `nginx:1.27-alpine` | healthy |
| `saluna-postgres` | `postgres:16-alpine` | healthy |
| `saluna-registry` | `registry:2` | healthy (localhost `:5000`) |

Public endpoints (via Arvan) returned **HTTP 200** from outside Iran at audit
time (`https://saluna.ir/`, `https://api.saluna.ir/health`).

### Current app versions

The repo now has explicit app SemVer baselines. These are the app versions to
build on from this point forward:

| App | Package | Current app version | Current Docker image tag reality |
| --- | --- | ---: | --- |
| API | `apps/api/package.json` | `0.7.0` | date tag, currently `2026-06-05-1` locally |
| Public web | `apps/web/package.json` | `0.4.0` | date tag, currently `2026-06-05-1` locally |
| Manager PWA | `apps/pwa/package.json` | `0.7.0` | date tag, currently `2026-06-05-1` locally |

Target image tags should combine app version and git SHA:

```text
registry.hamdocker.ir/<namespace>/saluna-api:0.7.1-e6fa2b7
registry.hamdocker.ir/<namespace>/saluna-web:0.4.1-e6fa2b7
registry.hamdocker.ir/<namespace>/saluna-pwa:0.7.1-e6fa2b7
```

Use patch bumps for fixes (`0.7.0` -> `0.7.1`) and minor bumps for meaningful
features or breaking pre-`1.0.0` changes (`0.7.1` -> `0.8.0`).

---

## Outbound internet summary

The VPS has **limited outbound internet**: Iranian/local infrastructure works;
most international destinations do not.

### Inbound

Working. Site is live behind Arvan Cloud TLS termination.

### International (blocked or filtered)

| Test | Result |
| --- | --- |
| Ping `8.8.8.8`, `1.1.1.1`, `google.com` | 100% packet loss |
| `google.com`, `registry.npmjs.org`, `hub.docker.com`, `api.github.com` | Timeout (~15s) |
| `deb.debian.org` | Timeout |
| `dl-cdn.alpinelinux.org` (default Alpine CDN) | Timeout |
| `docker.io` / `registry-1.docker.io` pull | Timeout |
| `api.ipify.org` (public IP check) | Failed |

### Iranian / local (working)

| Service | Result |
| --- | --- |
| `arvancloud.ir` | HTTP 200 (~0.06s) |
| `repo.abrha.net` (Debian apt) | HTTP 200; `apt update` succeeds |
| `parspack.com` | HTTP 200 |
| `liara.ir`, `api.liara.ir` | HTTP 200 |
| `runflare.com`, `chabokan.net` | HTTP 200 |

From inside the `api` container: `arvancloud.ir` OK, `google.com` fails (same
pattern as the host).

**Implication:** Do not rely on `docker pull` from Docker Hub, `pnpm install`
from `registry.npmjs.org`, or default Alpine apt CDN on the VPS. Use Iranian
mirrors or build elsewhere and ship tarballs (current airgap workflow).

---

## HamGit / Hamravesh (CI/CD platforms)

Tested for a future GitHub-like CI/CD pipeline.

### Reachable from VPS

| Service | Result |
| --- | --- |
| `hamgit.ir` (HTTPS + API) | HTTP 200 / 401 |
| `hamgit.ir` SSH (port 22) | Open; handshake OK (needs deploy key) |
| `hamravesh.com` | HTTP 200 |
| `console.hamravesh.com` | HTTP 200 |
| `docs.hamravesh.com` | HTTP 200 |
| `registry.hamdocker.ir` | Reachable (401 without credentials) |
| `hub.hamdocker.ir`, `mcr.hamdocker.ir`, `quay.hamdocker.ir` | Reachable |
| `repo.hmirror.ir` (npm) | HTTP 200 |
| From `api` container → all of the above | Reachable |

### Not reachable / wrong hostnames

| Service | Result |
| --- | --- |
| `registry.hamravesh.com`, `cr.hamravesh.com` | DNS does not resolve |
| `registry.docker.ir` | Timeout |
| `github.com` git / npm | Timeout |

Hamravesh uses **`registry.hamdocker.ir`** (not `registry.hamravesh.com`). Docker
Hub images are mirrored at **`hub.hamdocker.ir/library/{image}:{tag}`**.

### HamDocker image pulls (from VPS)

| Image | Result |
| --- | --- |
| `hub.hamdocker.ir/library/node:22.12.0-alpine` | OK |
| `hub.hamdocker.ir/library/node:22-alpine` | OK |
| `hub.hamdocker.ir/library/nginx:1.27-alpine` | OK |
| `hub.hamdocker.ir/library/nginx:1.27.5-alpine` | OK |
| `hub.hamdocker.ir/library/registry:2` | OK |
| `hub.hamdocker.ir/library/alpine:3.20` | OK |
| `hello-world` from `docker.io` | FAIL |

### CI/CD options

| Approach | Viable? | Notes |
| --- | --- | --- |
| **HamGit shared runners** (Hamravesh cloud) | **Recommended** | Build on Hamravesh; push to `registry.hamdocker.ir`; deploy to VPS over SSH |
| **Self-hosted GitLab Runner on VPS** | Possible | VPS reaches HamGit + mirrors; builds consume VPS CPU/RAM |
| **Hamravesh Darkube** | Possible | Moves hosting off ParsPack; native HamGit integration |
| **Direct GitHub Actions → VPS** | **No** | GitHub unreachable from VPS |

Suggested pipeline for ParsPack today:

```
push to hamgit.ir
  → shared runner builds (hub.hamdocker.ir + repo.hmirror.ir/npm + Arvan apk)
  → push images to registry.hamdocker.ir/<namespace>/saluna-{api,web,pwa}:<tag>
  → deploy job SSHs to 195.177.255.24 and runs apply-airgap-release.sh (or compose pull/up)
```

Prep still needed: working CI deploy SSH key, HamDocker registry credentials.

### Target Saluna CI/CD design

Build and deploy independently by app:

| Changed app | Build image | Version source | Deploy action | Extra step |
| --- | --- | --- | --- | --- |
| `api` | `saluna-api` | `apps/api/package.json` | pull/restart `api` | backup + migrations + API smoke check |
| `web` | `saluna-web` | `apps/web/package.json` | pull/restart `web` | public site smoke check |
| `pwa` | `saluna-pwa` | `apps/pwa/package.json` | pull/restart `pwa` | manager PWA smoke check |

Keep deployment state on the VPS as small text/env metadata, not as large
tarballs:

```env
SALUNA_API_VERSION=0.7.0
SALUNA_API_IMAGE_TAG=0.7.0-e6fa2b7
SALUNA_WEB_VERSION=0.4.0
SALUNA_WEB_IMAGE_TAG=0.4.0-e6fa2b7
SALUNA_PWA_VERSION=0.7.0
SALUNA_PWA_IMAGE_TAG=0.7.0-e6fa2b7
```

For shared package changes, deploy the affected app set:

| Changed path | Deploy |
| --- | --- |
| `apps/api/**` | `api` |
| `apps/web/**` | `web` |
| `apps/pwa/**` | `pwa` |
| `packages/auth/**`, `packages/notifications/**` | `api` |
| `packages/database/**` | `api`, `pwa` |
| `packages/api-client/**`, `packages/data-client/**`, `packages/ui/**`, `packages/brand-tokens/**` | `pwa` |
| `packages/brand/**`, `packages/salon-core/**` | all app images |
| root dependency metadata (`package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`) | all app images |
| `docker-compose.prod.yml`, `deploy/nginx/**`, deploy scripts | infra deploy, no app version bump unless behavior changes |

Current repo blockers before this can be the normal path:

- [x] `docker-compose.prod.yml` uses per-app image tags with fallback
  compatibility.
- [x] Tarball build/apply/upload/push helpers understand
  `SALUNA_API_IMAGE_TAG`, `SALUNA_WEB_IMAGE_TAG`, and `SALUNA_PWA_IMAGE_TAG`
  while preserving `SALUNA_IMAGE_TAG` for legacy releases.
- [x] PWA asset/cache version defaults to `SALUNA_PWA_IMAGE_TAG` when an
  explicit `VITE_PWA_ASSET_VERSION` is not provided.
- [x] Add registry-first build/push scripts that can build and push one app
  image.
- [x] Add a registry-first deploy script that pulls only one app image, restarts
  only that service, runs API migrations only for API deploys, and records the
  new tag after the smoke check succeeds.
- [x] Dockerfiles no longer assume default Alpine/npm behavior; HamDocker,
  hmirror npm, and Arvan apk configurable for CI.
- [x] Add an initial HamGit/GitLab CI scaffold that builds changed app images
  with Iranian mirrors and exposes manual deploy jobs per app.
- [ ] The `deploy` SSH user/key is not configured yet; CI should not deploy
  through root/password.
- [x] API migrations need to run only for API deploys, with a backup before
  migration.

### HamGit CI scaffold

The repo now includes [`.gitlab-ci.yml`](../.gitlab-ci.yml) as the first
registry-first CI/CD slice for HamGit/Hamravesh-style runners.

What it does:

- uses HamDocker base images for the CI job images and Docker-in-Docker service
- rewrites Alpine apk repositories to Arvan before installing CI tools
- builds only changed app images on `main`
- tags images as `<app-package-version>-<CI_COMMIT_SHORT_SHA>`
- pushes to `SALUNA_IMAGE_REGISTRY`, for example
  `registry.hamdocker.ir/<namespace>/`
- exposes one manual deploy job per app: `deploy-api`, `deploy-web`,
  `deploy-pwa`
- passes the built app version/tag to
  [`scripts/deploy-registry-app.sh`](../scripts/deploy-registry-app.sh), which
  performs the VPS pull/restart/smoke-check flow

Required protected CI variables:

| Variable | Purpose |
| --- | --- |
| `SALUNA_IMAGE_REGISTRY` | Registry/repository prefix, e.g. `registry.hamdocker.ir/<namespace>/` |
| `HAMDOCKER_USERNAME` | HamDocker registry username |
| `HAMDOCKER_PASSWORD` | HamDocker registry password/token |
| `VPS_HOST` | ParsPack origin IP, currently `195.177.255.24` |
| `VPS_SSH_USER` | Non-root deploy user, expected `deploy` once configured |
| `VPS_SSH_PRIVATE_KEY` | Private key for the deploy user |

Keep deploy jobs **manual** until:

- the `deploy` user can SSH to `195.177.255.24`
- `/opt/saluna/.env.production` sets `SALUNA_IMAGE_REGISTRY` to the same
  HamDocker namespace used by CI
- the VPS can `docker login registry.hamdocker.ir`
- one API deploy has been tested end-to-end with backup, migration, restart,
  and `/health` smoke check

CI caveat: the scaffold assumes HamGit runners support Docker-in-Docker or an
equivalent Docker daemon. If shared runners do not allow privileged Docker,
switch the build jobs to Hamravesh's supported image-builder pattern and keep
the same scripts/tags/deploy contract.

---

## Package mirror audit (Saluna lockfile)

Tool: [`scripts/check-hmirror-packages.mjs`](../scripts/check-hmirror-packages.mjs)

```bash
node scripts/check-hmirror-packages.mjs
node scripts/check-hmirror-packages.mjs --json-out /tmp/hmirror-report.json
```

Parses the `packages:` section of `pnpm-lock.yaml` (peer-suffix keys stripped;
`@repo/*` workspace packages excluded).

### npm — `repo.hmirror.ir/npm`

| Metric | Count |
| --- | --- |
| Unique packages checked | 1,684 |
| Exact locked version found | 1,660 |
| Missing version | 0 |
| Timeouts (large metadata) | 23 |
| Missing package | 0 (1 parser false positive for quoted names) |

Timeouts are slow mirror responses, not absence. Manually verified with a
60s timeout — all of these **exist** at the locked version:

- `astro@6.4.2`
- `better-auth@1.6.11`
- `drizzle-orm@0.39.3`, `drizzle-kit@0.30.6`
- `react-dom@19.1.0`
- `date-fns@4.1.0`
- `@playwright/test@1.59.1`
- `@cloudflare/workers-types@4.20260518.1`

Notable production dependencies confirmed on the mirror:

`@astrojs/node`, `@astrojs/react`, `hono`, `@hono/node-server`, `vite`,
`@vitejs/plugin-react`, `@tanstack/react-router`, `tailwindcss`, `sharp`,
`esbuild`, `@esbuild/linux-x64`, `lightningcss`, `typescript`, `turbo`, `zod`,
`postgres`, `grammy`, `vitest`, `wrangler`, `pnpm@9.15.9`.

**Caveat:** The mirror’s `latest` field in registry metadata can look stale when
versions are sorted lexicographically (e.g. `astro` listing `4.15.12` as “latest”
while `6.4.2` is present). Always check the **pinned** version, not `latest`.

### Real `pnpm install` smoke tests (on VPS)

Run inside `hub.hamdocker.ir/library/node:22.12.0-alpine` with:

- `npm config set registry https://repo.hmirror.ir/npm/`
- Alpine repos → `https://mirror.arvancloud.ir/alpine` (see apk section below)
- `pnpm@9.15.9` installed globally via npm mirror

| Filter | Result | Duration |
| --- | --- | --- |
| `--filter @repo/api...` | **Exit 0** | ~67s |
| `--filter @repo/web...` | **Exit 0** | ~65s |
| `--filter @repo/pwa...` | **Exit 0** | ~68s |

`workerd` / `wrangler` postinstall warnings appeared (musl binary validation).
Harmless for production VPS runtime — Cloudflare dev tooling only.

### Docker base images (Dockerfile `ARG NODE_VERSION=22.12.0`)

| Upstream | HamDocker mirror | VPS pull |
| --- | --- | --- |
| `node:22.12.0-alpine` | `hub.hamdocker.ir/library/node:22.12.0-alpine` | OK |
| `nginx:1.27-alpine` | `hub.hamdocker.ir/library/nginx:1.27-alpine` | OK |

Replace `FROM node:…` / `FROM nginx:…` with mirrored URLs when building on
HamGit runners or the VPS.

### Alpine apk — **critical gap**

Dockerfiles run `apk add --no-cache libc6-compat` against the default Alpine CDN
(`dl-cdn.alpinelinux.org`). That CDN **times out** from the VPS.

| Mirror | `libc6-compat` on Alpine 3.21 | Notes |
| --- | --- | --- |
| `dl-cdn.alpinelinux.org` (default) | **FAIL** | Timeout |
| `repo.hmirror.ir/apk` | **FAIL** | HTTP 404 on v3.19–v3.23 indexes |
| `repo.abrha.net/alpine` | **FAIL** | HTTP 404 |
| `mirror.arvancloud.ir/alpine` | **OK** | Use this |

The Dockerfiles now expose build args for builds on the VPS or HamGit without
international internet:

```dockerfile
--build-arg NODE_IMAGE=hub.hamdocker.ir/library/node:22.12.0-alpine
--build-arg NGINX_IMAGE=hub.hamdocker.ir/library/nginx:1.27-alpine
--build-arg ALPINE_MIRROR=https://mirror.arvancloud.ir/alpine
--build-arg NPM_REGISTRY=https://repo.hmirror.ir/npm/
--build-arg PNPM_VERSION=9.15.9
```

For the helper scripts, use the matching environment variables:

```bash
SALUNA_NODE_IMAGE=hub.hamdocker.ir/library/node:22.12.0-alpine
SALUNA_NGINX_IMAGE=hub.hamdocker.ir/library/nginx:1.27-alpine
SALUNA_ALPINE_MIRROR=https://mirror.arvancloud.ir/alpine
SALUNA_NPM_REGISTRY=https://repo.hmirror.ir/npm/
SALUNA_PNPM_VERSION=9.15.9
```

### Other hmirror endpoints (Hamravesh blog)

| Mirror | Purpose |
| --- | --- |
| `repo.hmirror.ir/npm` | npm / pnpm |
| `repo.hmirror.ir/python/simple` | pip |
| `repo.hmirror.ir/go` | Go modules |
| `hub.hamdocker.ir` | Docker Hub cache |
| `mcr.hamdocker.ir` | Microsoft Container Registry cache |
| `gcr.hamdocker.ir` | Google Container Registry cache |
| `quay.hamdocker.ir` | Quay cache |

### Packages not needed on VPS deploy

The lockfile includes Expo / React Native (`apps/native`) dependencies. They
resolve on the npm mirror but are **not** required for api/web/pwa Docker builds.
Do not block VPS CI on native-only packages.

---

## Mirror configuration reference

### npm / pnpm (CI or Dockerfile)

```bash
npm config set registry https://repo.hmirror.ir/npm/
pnpm config set registry https://repo.hmirror.ir/npm/
```

Or in `.npmrc` (CI / Docker build):

```ini
registry=https://repo.hmirror.ir/npm/
```

### Docker Hub images

```dockerfile
FROM hub.hamdocker.ir/library/node:22.12.0-alpine
FROM hub.hamdocker.ir/library/nginx:1.27-alpine
```

Push production images to `registry.hamdocker.ir/<your-namespace>/…` after
creating credentials in the Hamravesh console.

### Alpine apk

```dockerfile
RUN sed -i 's#https://dl-cdn.alpinelinux.org/alpine#https://mirror.arvancloud.ir/alpine#g' /etc/apk/repositories
```

### Debian apt (host OS, not app containers)

Already works via `repo.abrha.net` on the VPS host.

---

## Recommendations

### Immediate

1. Keep the tarball workflow working as a bootstrap/fallback path
   ([`VPS_AIRGAPPED_DEPLOYMENT.md`](./VPS_AIRGAPPED_DEPLOYMENT.md)).
2. SSH to **`195.177.255.24`**, not Arvan CDN IPs.
3. Fix deploy SSH key for the `deploy` user (or create a `gitlab-ci` user) before
   automating deploys.
4. Keep current app versions in package metadata:
   `api=0.7.0`, `web=0.4.0`, `pwa=0.7.0`.

### Next implementation slice

1. Done: add per-app image tag variables to Compose:
   `SALUNA_API_IMAGE_TAG`, `SALUNA_WEB_IMAGE_TAG`, `SALUNA_PWA_IMAGE_TAG`.
2. Done: teach tarball build/apply/upload/push helpers to resolve and preserve
   per-app image tags while falling back to `SALUNA_IMAGE_TAG`.
3. Done: add a registry-first deploy script that accepts `api`, `web`, or `pwa`,
   pulls only that image, restarts only that service, and records only that
   app's VPS state after smoke check success.
4. Done: add one-app build/push commands for `saluna-api`, `saluna-web`, and
   `saluna-pwa`.
5. Done for registry-first builds: add OCI labels to each image: app version,
   git revision, source URL.
6. Keep the tarball scripts, but stop using them for normal releases once the
   registry path is verified.

### Medium term (HamGit/Hamravesh CI/CD)

1. Mirror the repo to HamGit or make HamGit the production deployment remote.
2. Validate the initial `.gitlab-ci.yml` on HamGit shared runners, especially
   Docker-in-Docker support and HamDocker login.
3. Use HamDocker + hmirror npm + Arvan apk in all Dockerfiles and CI jobs.
4. Prefer **Hamravesh shared runners** over building on the small VPS.
5. Push images to `registry.hamdocker.ir/<namespace>/saluna-{api,web,pwa}` with
   tags like `0.7.1-<short-sha>`.
6. Re-run `node scripts/check-hmirror-packages.mjs` after major lockfile updates.

### Do not assume

- `repo.hmirror.ir/apk` works (it does not today).
- `registry.npmjs.org` or `docker.io` are reachable from the VPS.
- Arvan DNS IPs accept SSH.
- Mirror `latest` metadata reflects the newest semver (check pinned versions).

---

## Re-running this audit

From a connected machine:

```bash
# Lockfile vs hmirror npm
node scripts/check-hmirror-packages.mjs --json-out /tmp/hmirror-report.json

# VPS SSH (origin IP)
VPS_HOST=195.177.255.24 ./scripts/seed-vps-catalog-presets.sh   # after deploy key works
```

From the VPS (examples):

```bash
# Docker mirror pull
docker pull hub.hamdocker.ir/library/node:22.12.0-alpine

# npm mirror
curl -sS -o /dev/null -w "%{http_code}\n" https://repo.hmirror.ir/npm/astro

# Arvan apk index
curl -sS -o /dev/null -w "%{http_code}\n" \
  https://mirror.arvancloud.ir/alpine/v3.21/main/x86_64/APKINDEX.tar.gz
```

---

## Related docs

- [`VPS_AIRGAPPED_DEPLOYMENT.md`](./VPS_AIRGAPPED_DEPLOYMENT.md) — tarball deploy workflow
- [Hamravesh mirror guide](https://hamravesh.com/blog/container-registry-mirroring-and-caching/) — official hmirror/hamdocker docs
- [`scripts/check-hmirror-packages.mjs`](../scripts/check-hmirror-packages.mjs) — lockfile mirror checker
