# 008 — Local scheduler service

## Status

Accepted

## Context

`local-scheduler-express-server` is a **local-only** daemon that registers scheduled HTTP tasks against worker Express apps (Lead Studio, etc.), manages worker lifecycle, and persists run history on disk. It is not a cloud API.

## Decision

### Security

- Server binds **`127.0.0.1` only**.
- Never expose this server to LAN without auth.

### No database v1

- Task catalog: `data/tasks.registry.json` (committed)
- Machine paths + enable flags: `scheduler.local.json` (gitignored)
- Run history: `SCHEDULER_RUNS_DIR` (default `/tmp/local-scheduler/runs/`)
- Worker PID files: `SCHEDULER_WORKERS_DIR` (default `/tmp/local-scheduler/workers/`)

### Services

| Service | Path | Role |
|---------|------|------|
| tasks | `src/services/tasks/` | `GET/PATCH /api/tasks`, `POST /api/tasks/:id/run-now` |
| runs | `src/services/runs/` | `GET /api/runs`, `GET /api/runs/:id` |
| scheduler | `src/services/scheduler/` | In-process `node-cron`; `initializeScheduler()` on boot |
| worker-lifecycle | `src/services/worker-lifecycle/` | Health probe, spawn worker, stop if started by scheduler |

### Data layer

| Path | Role |
|------|------|
| `src/data/task-registry/` | Read/merge registry + local JSON; write local overrides |
| `src/data/scheduler-run/` | Append/list run JSON files |

### Handler pattern carve-out

No managed Supabase/Anthropic client. ADR 002 step 1 (get managed client + null check) is **N/A**. Handlers: validate → `processX()` → try/catch.

### Worker lifecycle

- If worker health OK at tick start: call endpoint; **do not** stop worker afterward.
- If scheduler spawned worker: `SIGTERM` after task completes (or fails).

## Related

- [001 – File & service organization](./001-file-and-service-organization.md)
- [002 – Router factory & handler pattern](./002-router-factory-and-handler-pattern.md)
