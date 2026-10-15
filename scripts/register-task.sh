#!/usr/bin/env bash
# Example: register a task from a JSON file on localhost scheduler.
set -euo pipefail
FILE="${1:-}"
BASE="${SCHEDULER_URL:-http://127.0.0.1:4120}"
if [[ -z "$FILE" ]]; then
  echo "Usage: $0 path/to/task.json"
  exit 1
fi
curl -sS -X POST "${BASE}/api/tasks?upsert=true" \
  -H 'Content-Type: application/json' \
  -d @"$FILE"
