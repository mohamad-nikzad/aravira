#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

ENV_FILE="${ENV_FILE:-.env.production}"
RELEASE_DIR="${RELEASE_DIR:-deploy/releases}"
INCLUDE_INFRA="${INCLUDE_INFRA:-0}"
INCLUDE_REGISTRY="${INCLUDE_REGISTRY:-0}"
INFRA_ONLY="${INFRA_ONLY:-0}"
DOCKER_PLATFORM="${DOCKER_PLATFORM:-linux/amd64}"

if [[ -f "$ENV_FILE" ]]; then
  saluna_image_tag_override="${SALUNA_IMAGE_TAG-}"
  saluna_image_tag_was_set="${SALUNA_IMAGE_TAG+x}"
  set -a
  # shellcheck disable=SC1090
  . "$ENV_FILE"
  set +a
  if [[ -n "$saluna_image_tag_was_set" ]]; then
    export SALUNA_IMAGE_TAG="$saluna_image_tag_override"
  fi
fi

if [[ -z "${SALUNA_IMAGE_TAG:-}" ]]; then
  SALUNA_IMAGE_TAG="$(git rev-parse --short=12 HEAD)"
  export SALUNA_IMAGE_TAG
  echo "SALUNA_IMAGE_TAG was not set; using git SHA ${SALUNA_IMAGE_TAG}."
fi

VITE_PWA_ASSET_VERSION="${VITE_PWA_ASSET_VERSION:-$SALUNA_IMAGE_TAG}"
POSTGRES_IMAGE="${POSTGRES_IMAGE:-postgres:16-alpine}"
NGINX_IMAGE="${NGINX_IMAGE:-nginx:1.27-alpine}"
REGISTRY_IMAGE="${REGISTRY_IMAGE:-registry:2}"

mkdir -p "$RELEASE_DIR"

sha256_file() {
  local file="$1"
  local dir
  local name
  dir="$(dirname "$file")"
  name="$(basename "$file")"

  if command -v sha256sum >/dev/null 2>&1; then
    (cd "$dir" && sha256sum "$name" > "${name}.sha256")
  else
    (cd "$dir" && shasum -a 256 "$name" > "${name}.sha256")
  fi
}

save_bundle() {
  local bundle="$1"
  shift

  echo "Saving ${bundle}"
  docker save --platform "$DOCKER_PLATFORM" "$@" | gzip -c > "$bundle"
  sha256_file "$bundle"
}

APP_BUNDLE="${RELEASE_DIR}/saluna-apps-${SALUNA_IMAGE_TAG}.tar.gz"
INFRA_BUNDLE="${RELEASE_DIR}/saluna-infra-postgres16-nginx127.tar.gz"

if [[ "$INFRA_ONLY" != "1" ]]; then
  echo "Building Saluna app images with tag ${SALUNA_IMAGE_TAG}"

  docker build \
    --platform "$DOCKER_PLATFORM" \
    -f apps/api/Dockerfile \
    -t "saluna-api:${SALUNA_IMAGE_TAG}" \
    .

  docker build \
    --platform "$DOCKER_PLATFORM" \
    -f apps/web/Dockerfile \
    --build-arg "PUBLIC_APP_URL=${PUBLIC_APP_URL:-https://saluna.ir}" \
    --build-arg "PUBLIC_API_URL=${PUBLIC_API_URL:-https://api.saluna.ir}" \
    -t "saluna-web:${SALUNA_IMAGE_TAG}" \
    .

  docker build \
    --platform "$DOCKER_PLATFORM" \
    -f apps/pwa/Dockerfile \
    --build-arg "VITE_API_BASE_URL=${VITE_API_BASE_URL:-https://api.saluna.ir}" \
    --build-arg "VITE_APP_URL=${VITE_APP_URL:-https://app.saluna.ir}" \
    --build-arg "VITE_WEB_URL=${VITE_WEB_URL:-https://saluna.ir}" \
    --build-arg "VITE_PWA_ASSET_VERSION=${VITE_PWA_ASSET_VERSION}" \
    -t "saluna-pwa:${SALUNA_IMAGE_TAG}" \
    .

  save_bundle \
    "$APP_BUNDLE" \
    "saluna-api:${SALUNA_IMAGE_TAG}" \
    "saluna-web:${SALUNA_IMAGE_TAG}" \
    "saluna-pwa:${SALUNA_IMAGE_TAG}"
fi

if [[ "$INCLUDE_INFRA" == "1" || "$INFRA_ONLY" == "1" ]]; then
  infra_images=("$POSTGRES_IMAGE" "$NGINX_IMAGE")
  if [[ "$INCLUDE_REGISTRY" == "1" ]]; then
    infra_images+=("$REGISTRY_IMAGE")
  fi

  echo "Pulling infra images for ${DOCKER_PLATFORM}: ${infra_images[*]}"
  docker pull --platform "$DOCKER_PLATFORM" "$POSTGRES_IMAGE"
  docker pull --platform "$DOCKER_PLATFORM" "$NGINX_IMAGE"
  if [[ "$INCLUDE_REGISTRY" == "1" ]]; then
    docker pull --platform "$DOCKER_PLATFORM" "$REGISTRY_IMAGE"
  fi

  save_bundle "$INFRA_BUNDLE" "${infra_images[@]}"
fi

MANIFEST="${RELEASE_DIR}/saluna-release-${SALUNA_IMAGE_TAG}.env"
{
  echo "SALUNA_IMAGE_TAG=${SALUNA_IMAGE_TAG}"
  echo "APP_BUNDLE=$(basename "$APP_BUNDLE")"
  echo "INFRA_BUNDLE=$(basename "$INFRA_BUNDLE")"
  echo "INCLUDE_INFRA=${INCLUDE_INFRA}"
  echo "INCLUDE_REGISTRY=${INCLUDE_REGISTRY}"
  echo "DOCKER_PLATFORM=${DOCKER_PLATFORM}"
  echo "BUILT_AT=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "GIT_SHA=$(git rev-parse HEAD 2>/dev/null || true)"
} > "$MANIFEST"

echo "Release files are in ${RELEASE_DIR}:"
if [[ -f "$APP_BUNDLE" ]]; then
  echo "  - ${APP_BUNDLE}"
  echo "  - ${APP_BUNDLE}.sha256"
fi
if [[ -f "$INFRA_BUNDLE" ]]; then
  echo "  - ${INFRA_BUNDLE}"
  echo "  - ${INFRA_BUNDLE}.sha256"
fi
echo "  - ${MANIFEST}"
