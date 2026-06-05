#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

ENV_FILE="${ENV_FILE:-.env.production}"
RELEASE_DIR="${RELEASE_DIR:-deploy/releases}"
REMOTE_DIR="${REMOTE_DIR:-/opt/saluna}"
SSH_USER="${SSH_USER:-deploy}"
VPS_HOST="${VPS_HOST:-${1:-}}"
SSH_KEY="${SSH_KEY:-}"
UPLOAD_INFRA="${UPLOAD_INFRA:-0}"
UPLOAD_ENV="${UPLOAD_ENV:-1}"

if [[ -z "$VPS_HOST" ]]; then
  echo "Set VPS_HOST or pass the VPS origin IP/host as the first argument." >&2
  exit 1
fi

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
  echo "SALUNA_IMAGE_TAG is required. Set it in ${ENV_FILE} or the environment." >&2
  exit 1
fi

APP_BUNDLE="${APP_BUNDLE:-${RELEASE_DIR}/saluna-apps-${SALUNA_IMAGE_TAG}.tar.gz}"
INFRA_BUNDLE="${INFRA_BUNDLE:-${RELEASE_DIR}/saluna-infra-postgres16-nginx127.tar.gz}"

ssh_args=()
scp_args=()
if [[ -n "$SSH_KEY" ]]; then
  ssh_args+=("-i" "$SSH_KEY")
  scp_args+=("-i" "$SSH_KEY")
fi

remote="${SSH_USER}@${VPS_HOST}"

if [[ ! -f "$APP_BUNDLE" ]]; then
  echo "Missing app bundle: ${APP_BUNDLE}" >&2
  exit 1
fi

echo "Preparing ${remote}:${REMOTE_DIR}"
ssh "${ssh_args[@]}" -o StrictHostKeyChecking=accept-new "$remote" \
  "mkdir -p '${REMOTE_DIR}/deploy/nginx' '${REMOTE_DIR}/releases' '${REMOTE_DIR}/scripts'"

echo "Uploading app bundle"
scp "${scp_args[@]}" "$APP_BUNDLE" "$APP_BUNDLE.sha256" \
  "$remote:${REMOTE_DIR}/releases/"

if [[ "$UPLOAD_INFRA" == "1" ]]; then
  if [[ ! -f "$INFRA_BUNDLE" ]]; then
    echo "Missing infra bundle: ${INFRA_BUNDLE}" >&2
    exit 1
  fi
  echo "Uploading infra bundle"
  scp "${scp_args[@]}" "$INFRA_BUNDLE" "$INFRA_BUNDLE.sha256" \
    "$remote:${REMOTE_DIR}/releases/"
fi

echo "Uploading compose, nginx templates, and deploy script"
scp "${scp_args[@]}" docker-compose.prod.yml "$remote:${REMOTE_DIR}/"
scp "${scp_args[@]}" scripts/apply-airgap-release.sh "$remote:${REMOTE_DIR}/scripts/"
scp "${scp_args[@]}" -r deploy/nginx/templates "$remote:${REMOTE_DIR}/deploy/nginx/"

if [[ "$UPLOAD_ENV" == "1" ]]; then
  if [[ ! -f "$ENV_FILE" ]]; then
    echo "Missing env file: ${ENV_FILE}" >&2
    exit 1
  fi
  scp "${scp_args[@]}" "$ENV_FILE" "$remote:${REMOTE_DIR}/.env.production"
fi

ssh "${ssh_args[@]}" "$remote" "chmod +x '${REMOTE_DIR}/scripts/apply-airgap-release.sh'"

echo "Uploaded release ${SALUNA_IMAGE_TAG} to ${remote}:${REMOTE_DIR}"
echo "Apply it with:"
echo "  ssh ${remote} 'cd ${REMOTE_DIR} && SALUNA_IMAGE_TAG=${SALUNA_IMAGE_TAG} ./scripts/apply-airgap-release.sh'"
