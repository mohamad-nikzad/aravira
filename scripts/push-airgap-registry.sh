#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

ENV_FILE="${ENV_FILE:-.env.production}"
SSH_USER="${SSH_USER:-deploy}"
VPS_HOST="${VPS_HOST:-${1:-}}"
SSH_KEY="${SSH_KEY:-}"
REGISTRY_PORT="${REGISTRY_PORT:-5000}"
LOCAL_REGISTRY_PORT="${LOCAL_REGISTRY_PORT:-5000}"
REMOTE_PUSH_LOADED="${REMOTE_PUSH_LOADED:-0}"

if [[ -z "$VPS_HOST" ]]; then
  echo "Set VPS_HOST or pass the VPS origin IP/host as the first argument." >&2
  exit 1
fi

if [[ -f "$ENV_FILE" ]]; then
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
fi

if [[ -z "${SALUNA_IMAGE_TAG:-}" ]]; then
  echo "SALUNA_IMAGE_TAG is required. Set it in ${ENV_FILE} or the environment." >&2
  exit 1
fi

SALUNA_API_IMAGE_TAG="${SALUNA_API_IMAGE_TAG:-$SALUNA_IMAGE_TAG}"
SALUNA_WEB_IMAGE_TAG="${SALUNA_WEB_IMAGE_TAG:-$SALUNA_IMAGE_TAG}"
SALUNA_PWA_IMAGE_TAG="${SALUNA_PWA_IMAGE_TAG:-$SALUNA_IMAGE_TAG}"
export SALUNA_API_IMAGE_TAG SALUNA_WEB_IMAGE_TAG SALUNA_PWA_IMAGE_TAG

ssh_args=()
if [[ -n "$SSH_KEY" ]]; then
  ssh_args+=("-i" "$SSH_KEY")
fi

remote="${SSH_USER}@${VPS_HOST}"
local_registry="127.0.0.1:${LOCAL_REGISTRY_PORT}"

if [[ "$REMOTE_PUSH_LOADED" == "1" ]]; then
  echo "Pushing already-loaded VPS images into 127.0.0.1:${REGISTRY_PORT}"
  ssh "${ssh_args[@]}" "$remote" bash -s -- "$REGISTRY_PORT" "$SALUNA_API_IMAGE_TAG" "$SALUNA_WEB_IMAGE_TAG" "$SALUNA_PWA_IMAGE_TAG" <<'REMOTE'
set -euo pipefail
registry_port="$1"
shift
images=(saluna-api saluna-web saluna-pwa)
tags=("$@")
for index in "${!images[@]}"; do
  image="${images[$index]}"
  tag="${tags[$index]}"
  docker tag "${image}:${tag}" "127.0.0.1:${registry_port}/${image}:${tag}"
  docker push "127.0.0.1:${registry_port}/${image}:${tag}"
done
REMOTE
  echo "Seeded VPS-local registry from images already loaded on the VPS."
  exit 0
fi

echo "Opening SSH tunnel to ${remote} registry on 127.0.0.1:${REGISTRY_PORT}"
ssh "${ssh_args[@]}" -N \
  -L "${LOCAL_REGISTRY_PORT}:127.0.0.1:${REGISTRY_PORT}" \
  "$remote" &
tunnel_pid=$!
trap 'kill "$tunnel_pid" >/dev/null 2>&1 || true' EXIT
sleep 2

docker tag "saluna-api:${SALUNA_API_IMAGE_TAG}" "${local_registry}/saluna-api:${SALUNA_API_IMAGE_TAG}"
docker push "${local_registry}/saluna-api:${SALUNA_API_IMAGE_TAG}"
docker tag "saluna-web:${SALUNA_WEB_IMAGE_TAG}" "${local_registry}/saluna-web:${SALUNA_WEB_IMAGE_TAG}"
docker push "${local_registry}/saluna-web:${SALUNA_WEB_IMAGE_TAG}"
docker tag "saluna-pwa:${SALUNA_PWA_IMAGE_TAG}" "${local_registry}/saluna-pwa:${SALUNA_PWA_IMAGE_TAG}"
docker push "${local_registry}/saluna-pwa:${SALUNA_PWA_IMAGE_TAG}"

echo "Pushed Saluna app images to the VPS-local registry:"
echo "  api: ${SALUNA_API_IMAGE_TAG}"
echo "  web: ${SALUNA_WEB_IMAGE_TAG}"
echo "  pwa: ${SALUNA_PWA_IMAGE_TAG}"
echo "Apply on the VPS with USE_REGISTRY=1 so Compose pulls ${local_registry}/ images locally."
