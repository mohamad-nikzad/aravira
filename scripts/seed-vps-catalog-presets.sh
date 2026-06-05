#!/usr/bin/env bash
# Upsert catalog_presets on the production VPS Postgres (via api container).
#
# Usage:
#   VPS_HOST=YOUR_VPS_ORIGIN_IP ./scripts/seed-vps-catalog-presets.sh
#   ./scripts/seed-vps-catalog-presets.sh YOUR_VPS_ORIGIN_IP
#
# Use the ParsPack VPS public IP (Arvan CDN IPs will not accept SSH).

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VPS_HOST="${VPS_HOST:-${1:-}}"
SSH_USER="${SSH_USER:-deploy}"
SSH_KEY="${SSH_KEY:-$ROOT/.codex/deploy/saluna_vps_ed25519}"

if [[ -z "$VPS_HOST" ]]; then
  echo "Set VPS_HOST or pass the VPS origin IP as the first argument." >&2
  echo "Example: VPS_HOST=203.0.113.10 ./scripts/seed-vps-catalog-presets.sh" >&2
  exit 1
fi

if [[ ! -f "$SSH_KEY" ]]; then
  echo "SSH key not found: $SSH_KEY" >&2
  exit 1
fi

ssh -i "$SSH_KEY" -o StrictHostKeyChecking=accept-new "${SSH_USER}@${VPS_HOST}" bash -s <<'REMOTE'
set -euo pipefail
cd /opt/saluna
set -a
. ./.env.production
set +a
docker compose --env-file .env.production -f docker-compose.prod.yml run --rm api \
  node apps/api/dist/seed-catalog-presets.cjs
REMOTE

echo "Catalog presets seeded on VPS (${VPS_HOST})."
