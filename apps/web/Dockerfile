# syntax=docker/dockerfile:1.7
#
# Astro 6 SSR (@astrojs/node standalone) for air-gapped VPS deploy.
# Build from the monorepo root (see docs/VPS_AIRGAPPED_DEPLOYMENT.md):
#
#   docker build -f apps/web/Dockerfile -t saloon-web:1.0 .
#
# Optional build-time env for sitemap / astro:env (defaults exist in astro.config):
#
#   docker build -f apps/web/Dockerfile \
#     --build-arg PUBLIC_APP_URL=https://salon.example \
#     --build-arg PUBLIC_API_URL=https://api.example \
#     -t saloon-web:1.0 .
#
# Optional ROOT_ENV_FILES (comma-separated basenames under repo root), loaded by
# scripts/with-root-env.mjs during build — copy env files into the build stage first
# if you use this (e.g. CI secret mount).

ARG NODE_VERSION=22.12.0

FROM node:${NODE_VERSION}-alpine AS base

RUN apk add --no-cache libc6-compat \
  && npm install -g pnpm@9.15.9

WORKDIR /app

# --- Stage 1: install dependencies (minimal workspace slice) ---
FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/web/package.json ./apps/web/
COPY packages/salon-core/package.json ./packages/salon-core/
COPY packages/typescript-config/package.json ./packages/typescript-config/

RUN pnpm install --frozen-lockfile --filter @repo/web...

# --- Stage 1 (continued): build ---
FROM deps AS build

COPY scripts/with-root-env.mjs ./scripts/
COPY packages/typescript-config ./packages/typescript-config
COPY packages/salon-core ./packages/salon-core
COPY apps/web ./apps/web

ARG PUBLIC_APP_URL=http://localhost:3001
ARG PUBLIC_API_URL=http://localhost:3000
ARG ROOT_ENV_FILES=
ENV PUBLIC_APP_URL=${PUBLIC_APP_URL} \
  PUBLIC_API_URL=${PUBLIC_API_URL} \
  ROOT_ENV_FILES=${ROOT_ENV_FILES} \
  NODE_ENV=production

# with-root-env.mjs loads ROOT_ENV_FILES from repo root when present
RUN pnpm --filter @repo/web build

# --- Stage 2: production runtime dependencies (Alpine-native sharp, etc.) ---
FROM base AS runner-deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/web/package.json ./apps/web/
COPY packages/salon-core ./packages/salon-core/

RUN pnpm install --frozen-lockfile --prod --filter @repo/web...

# --- Stage 2: slim runtime image ---
FROM base AS runner

WORKDIR /app/apps/web

ENV NODE_ENV=production \
  HOST=0.0.0.0 \
  PORT=3001

# Hoisted node_modules at repo root; Node resolves from apps/web upward
COPY --from=runner-deps /app/node_modules /app/node_modules
COPY --from=runner-deps /app/packages/salon-core /app/packages/salon-core
COPY --from=build /app/apps/web/dist ./dist

USER node

EXPOSE 3001

CMD ["node", "dist/server/entry.mjs"]
