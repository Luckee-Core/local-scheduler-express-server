#!/usr/bin/env bash
set -euo pipefail

# Lists merged tasks and optionally run-now for non-Gmail workers.
# Usage:
#   ./scripts/verify-seeded-workers.sh
#   ./scripts/verify-seeded-workers.sh --run-now

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
RUN_NOW=false
if [[ "${1:-}" == "--run-now" ]]; then
  RUN_NOW=true
fi

curl -sf "${BASE}/api/tasks" > /tmp/local-scheduler-tasks.json || {
  echo "❌ GET /api/tasks failed"
  exit 1
}

echo "📋 Tasks:"
python3 - <<'PY'
import json
with open("/tmp/local-scheduler-tasks.json") as f:
    data = json.load(f)
tasks = data.get("data") or data.get("tasks") or []
if isinstance(tasks, dict):
    tasks = list(tasks.values())
for t in tasks:
    biz = (t.get("schedulerProject") or {}).get("name", "?")
    repo = t.get("schedulerProjectRepo") or {}
    exec_type = repo.get("executionType", "?")
    target = t.get("executionTarget", "")
    en = t.get("enabled")
    print(f"  - {t.get('id')}: business={biz} repo_type={exec_type} enabled={en} target={target}")
PY

NON_GMAIL=(
  philly-ai-consulting-email-queue
  city-nonprofits-monday-digest-process-due
)

if [[ "${RUN_NOW}" != true ]]; then
  echo ""
  echo "Tip: ./scripts/verify-seeded-workers.sh --run-now"
  echo "     Digest process-due may send real emails if queue rows are due."
  exit 0
fi

for task_id in "${NON_GMAIL[@]}"; do
  echo ""
  echo "📥 run-now ${task_id}"
  curl -sf -X POST "${BASE}/api/tasks/${task_id}/run-now" | head -c 800
  echo ""
done

echo "✅ Non-Gmail worker verify finished"
