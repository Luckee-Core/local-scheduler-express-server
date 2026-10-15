# Local Scheduler Express Server

Local-only daemon that registers scheduled HTTP tasks against worker Express apps, manages worker lifecycle, and persists tasks and run history in **local Postgres**.

Default port: **4120** (binds `127.0.0.1` only).

## Quick start

```bash
npm install
cp .env.example .env
createdb local_scheduler  # once
psql "$DATABASE_URL" -f sql/migrations/001_scheduled_tasks_and_runs.sql
npm run db:seed
cp scheduler.local.json.example scheduler.local.json
# Edit scheduler.local.json with absolute paths to worker repos
npm run dev
```

Verify:

```bash
curl http://127.0.0.1:4120/api/health
curl http://127.0.0.1:4120/api/tasks
```

## Configuration

| File / env | Purpose |
|------------|---------|
| `DATABASE_URL` | Local Postgres (e.g. `postgres://localhost:5432/local_scheduler`) |
| `scheduler.local.json` | Machine worker paths (gitignored) |
| `data/tasks.registry.json` | Seed fixture for `npm run db:seed` |
| `.env` | `PORT`, `SCHEDULER_WORKERS_DIR`; worker secrets e.g. `PHILLY_AI_CONSULTING_CRON_SECRET` (must match consulting Express `CRON_SECRET`), `CITY_NONPROFITS_CRON_SECRET`, `GMAIL_MANAGER_CRON_SECRET` |

## API

- `GET /api/health` — health + `database` status
- `GET /api/tasks` — merged tasks
- `POST /api/tasks` — create task (`?upsert=true` to update by id)
- `PATCH /api/tasks/:id` — update fields including `enabled`
- `DELETE /api/tasks/:id` — remove task
- `POST /api/tasks/:id/run-now` — run immediately
- `GET /api/runs` — run history

Register from another project:

```bash
./scripts/register-task.sh ./my-task.json
```

## Optional: launchd (macOS login item)

```bash
./scripts/install-launchd.sh
```

## Architecture

Follow **`.cursor/rules/AGENTS.md`** and **`.cursor/architecture/`** (ADRs 001–010, 009-local).

## Related

- **local-scheduler-web** — dashboard UI on port 4121
