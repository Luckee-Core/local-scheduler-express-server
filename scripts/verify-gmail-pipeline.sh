#!/usr/bin/env bash
set -euo pipefail

# Smoke-test scheduler health and Gmail task run-now endpoints.
# Usage: ./scripts/verify-gmail-pipeline.sh
# Optional: SCHEDULER_URL=http://127.0.0.1:3022

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

if [[ -f "${REPO_ROOT}/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "${REPO_ROOT}/.env"
  set +a
fi

PORT="${PORT:-3022}"
BASE="${SCHEDULER_URL:-http://127.0.0.1:${PORT}}"

GMAIL_TASKS=(
  gmail-manager-morning-inbox
  gmail-manager-process-ai-queue
  gmail-manager-brief-inbox-if-ready
  gmail-manager-process-deletions
)

echo "📋 Health ${BASE}/api/health"
HEALTH="$(curl -sf "${BASE}/api/health")" || {
  echo "❌ Scheduler not reachable at ${BASE}. Is launchd or npm run dev running?"
  exit 1
}
echo "${HEALTH}"

for task_id in "${GMAIL_TASKS[@]}"; do
  echo ""
  echo "📥 run-now ${task_id}"
  HTTP_CODE="$(curl -s -o /tmp/local-scheduler-verify-body.json -w "%{http_code}" \
    -X POST "${BASE}/api/tasks/${task_id}/run-now")"
  echo "   HTTP ${HTTP_CODE}"
  head -c 500 /tmp/local-scheduler-verify-body.json
  echo ""
  if [[ "${HTTP_CODE}" != "200" ]]; then
    echo "❌ run-now failed for ${task_id}"
    exit 1
  fi
done

echo ""
echo "📋 Recent runs"
curl -sf "${BASE}/api/runs?limit=8" | head -c 2000
echo ""
echo "✅ Gmail pipeline verify finished. Check worker log: \${SCHEDULER_WORKERS_DIR:-/tmp/local-scheduler/workers}/my-gmail-manager.log"
