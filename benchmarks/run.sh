#!/usr/bin/env bash
# Run all benchmark scenarios sequentially against $BASE_URL.
#
# Required env / args:
#   BASE_URL   target host (default http://localhost:3000)
#   STACK      tag for this run (default nextjs-api-routes)
#              examples: nextjs-api-routes, hono-node, hono-bun, hono-edge
#
# Usage:
#   STACK=nextjs-api-routes BASE_URL=https://aravira-saloon.vercel.app ./benchmarks/run.sh
#   STACK=hono-node         BASE_URL=https://aravira-saloon.vercel.app ./benchmarks/run.sh
#   ./benchmarks/run.sh 03-dashboard           # single scenario, uses defaults
set -uo pipefail

if ! command -v k6 >/dev/null 2>&1; then
  echo "k6 not installed. Run: brew install k6" >&2
  exit 1
fi

BASE_URL="${BASE_URL:-http://localhost:3000}"
BENCH_PHONE="${BENCH_PHONE:-09120000000}"
BENCH_PASSWORD="${BENCH_PASSWORD:-admin123}"
STACK="${STACK:-nextjs-api-routes}"

if [[ "$BASE_URL" == *"localhost"* ]]; then
  ENV_NAME="local"
else
  ENV_NAME="prod"
fi

mkdir -p "benchmarks/results/${ENV_NAME}/${STACK}"

SCENARIO_DIR="benchmarks/scenarios"
if [[ $# -gt 0 ]]; then
  SCENARIOS=("$SCENARIO_DIR/$1.js")
else
  SCENARIOS=("$SCENARIO_DIR"/*.js)
fi

echo "Target: $BASE_URL"
echo "Env:    $ENV_NAME"
echo "Stack:  $STACK"
echo "Scenarios: ${#SCENARIOS[@]}"
echo

for s in "${SCENARIOS[@]}"; do
  name=$(basename "$s" .js)
  echo "=== Running $name ==="
  BASE_URL="$BASE_URL" STACK="$STACK" \
    BENCH_PHONE="$BENCH_PHONE" BENCH_PASSWORD="$BENCH_PASSWORD" \
    k6 run "$s" || echo "(k6 reported threshold breaches for $name — continuing)"
  echo
done

echo "Done. Reports in: benchmarks/results/${ENV_NAME}/${STACK}/"
echo
echo "Updating summary..."
node benchmarks/summarize.mjs "$ENV_NAME" "$STACK"
