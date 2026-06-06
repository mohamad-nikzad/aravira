#!/usr/bin/env bash
set -euo pipefail

ROOT="${ROOT:-$(pwd)}"
cd "$ROOT"

ENV_FILE="${ENV_FILE:-.env.production}"
RELEASE_DIR="${RELEASE_DIR:-releases}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
LOAD_INFRA="${LOAD_INFRA:-0}"
USE_REGISTRY="${USE_REGISTRY:-0}"
START_REGISTRY="${START_REGISTRY:-$USE_REGISTRY}"
SEED_CATALOG_PRESETS="${SEED_CATALOG_PRESETS:-1}"
SKIP_BACKUP="${SKIP_BACKUP:-0}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing ${ENV_FILE}. Run from /opt/saluna or set ENV_FILE." >&2
  exit 1
fi

saluna_image_tag_override="${SALUNA_IMAGE_TAG-}"
saluna_image_tag_was_set="${SALUNA_IMAGE_TAG+x}"
saluna_api_image_tag_override="${SALUNA_API_IMAGE_TAG-}"
saluna_api_image_tag_was_set="${SALUNA_API_IMAGE_TAG+x}"
saluna_web_image_tag_override="${SALUNA_WEB_IMAGE_TAG-}"
saluna_web_image_tag_was_set="${SALUNA_WEB_IMAGE_TAG+x}"
saluna_pwa_image_tag_override="${SALUNA_PWA_IMAGE_TAG-}"
saluna_pwa_image_tag_was_set="${SALUNA_PWA_IMAGE_TAG+x}"
set -a
# shellcheck disable=SC1090
. "$ENV_FILE"
set +a
if [[ -n "$saluna_image_tag_was_set" ]]; then
  export SALUNA_IMAGE_TAG="$saluna_image_tag_override"
fi
if [[ -n "$saluna_api_image_tag_was_set" ]]; then
  export SALUNA_API_IMAGE_TAG="$saluna_api_image_tag_override"
fi
if [[ -n "$saluna_web_image_tag_was_set" ]]; then
  export SALUNA_WEB_IMAGE_TAG="$saluna_web_image_tag_override"
fi
if [[ -n "$saluna_pwa_image_tag_was_set" ]]; then
  export SALUNA_PWA_IMAGE_TAG="$saluna_pwa_image_tag_override"
fi

if [[ -z "${SALUNA_IMAGE_TAG:-}" ]]; then
  echo "SALUNA_IMAGE_TAG is required in ${ENV_FILE} or the environment." >&2
  exit 1
fi

SALUNA_API_IMAGE_TAG="${SALUNA_API_IMAGE_TAG:-$SALUNA_IMAGE_TAG}"
SALUNA_WEB_IMAGE_TAG="${SALUNA_WEB_IMAGE_TAG:-$SALUNA_IMAGE_TAG}"
SALUNA_PWA_IMAGE_TAG="${SALUNA_PWA_IMAGE_TAG:-$SALUNA_IMAGE_TAG}"
export SALUNA_API_IMAGE_TAG SALUNA_WEB_IMAGE_TAG SALUNA_PWA_IMAGE_TAG

REGISTRY_PORT="${REGISTRY_PORT:-5000}"
if [[ "$USE_REGISTRY" == "1" ]]; then
  export SALUNA_IMAGE_REGISTRY="${SALUNA_IMAGE_REGISTRY:-127.0.0.1:${REGISTRY_PORT}/}"
fi

APP_BUNDLE="${APP_BUNDLE:-${RELEASE_DIR}/saluna-apps-${SALUNA_IMAGE_TAG}.tar.gz}"
INFRA_BUNDLE="${INFRA_BUNDLE:-${RELEASE_DIR}/saluna-infra-postgres16-nginx127.tar.gz}"

compose() {
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"
}

load_bundle() {
  local bundle="$1"
  if [[ ! -f "$bundle" ]]; then
    echo "Missing bundle: ${bundle}" >&2
    exit 1
  fi

  if [[ -f "${bundle}.sha256" ]]; then
    local bundle_dir
    local bundle_name
    bundle_dir="$(dirname "$bundle")"
    bundle_name="$(basename "$bundle")"

    if command -v sha256sum >/dev/null 2>&1; then
      (cd "$bundle_dir" && sha256sum -c "${bundle_name}.sha256")
    else
      (cd "$bundle_dir" && shasum -a 256 -c "${bundle_name}.sha256")
    fi
  fi

  echo "Loading ${bundle}"
  gzip -dc "$bundle" | docker load
}

backup_database() {
  if [[ "$SKIP_BACKUP" == "1" ]]; then
    echo "Skipping backup because SKIP_BACKUP=1"
    return
  fi

  mkdir -p backups
  local backup_file="backups/saluna-predeploy-${SALUNA_IMAGE_TAG}-$(date +%Y%m%d-%H%M%S).sql.gz"
  echo "Writing pre-migration backup to ${backup_file}"
  docker exec saluna-postgres sh -c \
    'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' \
    | gzip -c > "$backup_file"
}

wait_for_postgres() {
  echo "Waiting for Postgres to become ready"
  for _ in $(seq 1 60); do
    if docker exec saluna-postgres pg_isready \
      -U "${POSTGRES_USER:-saluna}" \
      -d "${POSTGRES_DB:-saluna}" >/dev/null 2>&1; then
      return
    fi
    sleep 2
  done

  echo "Postgres did not become ready in time." >&2
  exit 1
}

smoke_check() {
  local host="$1"
  local path="$2"
  echo "Smoke check: ${host}${path}"
  compose exec -T gateway wget -q -O /dev/null \
    --header="Host: ${host}" \
    "http://127.0.0.1${path}"
}

if [[ "$LOAD_INFRA" == "1" ]]; then
  load_bundle "$INFRA_BUNDLE"
fi

if [[ "$START_REGISTRY" == "1" ]]; then
  echo "Starting VPS-local registry on 127.0.0.1:${REGISTRY_PORT}"
  compose --profile registry up -d --force-recreate registry
fi

if [[ "$USE_REGISTRY" == "1" ]]; then
  echo "Pulling app images from ${SALUNA_IMAGE_REGISTRY}"
  echo "  api: ${SALUNA_API_IMAGE_TAG}"
  echo "  web: ${SALUNA_WEB_IMAGE_TAG}"
  echo "  pwa: ${SALUNA_PWA_IMAGE_TAG}"
  compose pull api web pwa
else
  load_bundle "$APP_BUNDLE"
fi

echo "Starting Postgres"
compose up -d postgres
wait_for_postgres

backup_database

echo "Applying database migrations"
compose run --rm api node apps/api/dist/migrate.cjs

if [[ "$SEED_CATALOG_PRESETS" == "1" ]]; then
  echo "Seeding catalog presets"
  compose run --rm api node apps/api/dist/seed-catalog-presets.cjs
fi

echo "Starting application stack"
compose up -d

smoke_check "${API_DOMAIN:-api.saluna.ir}" /health
smoke_check "${APP_DOMAIN:-app.saluna.ir}" /healthz
smoke_check "${PUBLIC_DOMAIN:-saluna.ir}" /

echo "Release ${SALUNA_IMAGE_TAG} is running:"
echo "  api: ${SALUNA_API_IMAGE_TAG}"
echo "  web: ${SALUNA_WEB_IMAGE_TAG}"
echo "  pwa: ${SALUNA_PWA_IMAGE_TAG}"
