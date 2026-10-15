# 009 — Local scheduler service

## Status

Accepted (supersedes “No database v1” in earlier drafts)

## Context

`local-scheduler-express-server` is a **local-only** daemon that registers scheduled HTTP tasks against worker Express apps (Lead Studio, etc.), manages worker lifecycle, and persists task catalog and run history. It is not a cloud API.

## Decision

### Security

- Server binds **`127.0.0.1` only**.
- Never expose this server to LAN without auth.
- Task registration via **REST on localhost** (`POST/PATCH/DELETE /api/tasks`); no API keys in v2.

### Persistence v2 (local Postgres)

- **`DATABASE_URL`** — local Postgres database (e.g. `local_scheduler`).
- **`scheduled_tasks`** — task catalog (replaces committed `data/tasks.registry.json` at runtime).
- **`scheduler_runs`** — run history (replaces `SCHEDULER_RUNS_DIR` JSON files).
- **`scheduler.local.json`** (gitignored) — **worker machine paths only** (`workers.*.expressDir`, `port`, `nvmSh`). Per-task `enabled` lives in Postgres.
- **Worker PID/logs** — still filesystem under `SCHEDULER_WORKERS_DIR` (default `/tmp/local-scheduler/workers/`).
- Migrations in `sql/migrations/` per [010 – No SQL functions](./010-no-sql-functions.md).

Seed: `data/tasks.registry.json` remains a **fixture** for `npm run db:seed`, not a runtime read path after cutover.

### Managed client carve-out

This app uses **`getManagedPgPool()`** from `src/services/managed/`, not Supabase. Handlers: get pool → null → `500` → validate → `processX()` → try/catch. See [004](./004-managed-clients-and-startup-init.md) appendix **Local Postgres scheduler**.

### Services

| Service | Path | Role |
|---------|------|------|
| tasks | `src/services/tasks/` | `GET/POST/PATCH/DELETE /api/tasks`, `POST /api/tasks/:id/run-now` |
| runs | `src/services/runs/` | `GET /api/runs`, `GET /api/runs/:id` |
| scheduler | `src/services/scheduler/` | In-process `node-cron`; `registerTaskJobs()` after boot and after task mutations |
| worker-lifecycle | `src/services/worker-lifecycle/` | Health probe, spawn worker, stop if started by scheduler |

### Data layer

| Path | Role |
|------|------|
| `src/data/scheduled_tasks/` | CRUD for `scheduled_tasks` table |
| `src/data/scheduler_runs/` | CRUD for `scheduler_runs` table |
| `src/data/worker-local-config/` | Read/write `scheduler.local.json` (workers only) |

### Cron and schedule windows

- `node-cron` expressions include **weekday + hour range** from the task schedule (`buildCronExpression`); ticks outside the window do not run and are **not** recorded as runs. `processTick` still guards with `isWithinScheduleWindow` before execute.
- Global `tickInProgress` may skip overlapping ticks while one task is still running.

### Worker lifecycle

- If worker health OK at tick start: call endpoint; **do not** stop worker afterward.
- If scheduler spawned worker: `SIGTERM` after task completes (or fails).

### Health

- `GET /api/health` may include `database: "ok" | "unavailable"` when pool is configured.

## Related

- [001 – File & service organization](./001-file-and-service-organization.md)
- [002 – Router factory & handler pattern](./002-router-factory-and-handler-pattern.md)
- [008 – Domain models](./008-domain-models.md)
- [010 – No SQL functions](./010-no-sql-functions.md)
