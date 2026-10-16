#!/usr/bin/env bash
set -euo pipefail

# Creates local_scheduler, applies migration 001, reminds to seed.
# Usage: ./scripts/setup-studio-db.sh
# Requires: createdb, psql on PATH; optional .env with DATABASE_URL

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
MIGRATION="${REPO_ROOT}/sql/migrations/001_scheduled_tasks_and_runs.sql"

if [[ -f "${REPO_ROOT}/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "${REPO_ROOT}/.env"
  set +a
fi

DB_NAME="${LOCAL_SCHEDULER_DB_NAME:-local_scheduler}"
OS_USER="$(whoami)"
DEFAULT_URL="postgresql://${OS_USER}@127.0.0.1:5432/${DB_NAME}"
DATABASE_URL="${DATABASE_URL:-$DEFAULT_URL}"

# .env.example placeholders — use the macOS Postgres role (same as Luckee Hub createdb steps)
case "${DATABASE_URL}" in
  *YOUR_USER*|*REPLACE_WITH_WHOAMI*)
    echo "⚠️  DATABASE_URL still has a placeholder; using ${DEFAULT_URL}"
    DATABASE_URL="${DEFAULT_URL}"
    ;;
esac

if ! command -v createdb >/dev/null 2>&1 || ! command -v psql >/dev/null 2>&1; then
  echo "❌ createdb/psql not on PATH. Install PostgreSQL 16 clients (see Luckee Hub location_installation README)."
  exit 1
fi

if ! psql postgres -c "SELECT 1" >/dev/null 2>&1; then
  echo "❌ Postgres is not reachable. Start postgresql@16 (brew services start postgresql@16)."
  exit 1
fi

if ! psql "${DATABASE_URL}" -c "SELECT 1" >/dev/null 2>&1; then
  echo "📦 Creating database ${DB_NAME}…"
  createdb "${DB_NAME}"
fi

echo "📦 Applying ${MIGRATION}…"
psql "${DATABASE_URL}" -f "${MIGRATION}"

echo "✅ Schema ready on ${DATABASE_URL}"
echo "   Next: ensure DATABASE_URL is in .env, then run: npm run db:seed"
