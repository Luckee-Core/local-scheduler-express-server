# Local Scheduler Express Server

Local-only daemon that registers scheduled HTTP tasks against worker Express apps (Lead Studio, etc.), manages worker lifecycle, and persists run history on disk.

Default port: **4120** (binds `127.0.0.1` only).

## Quick start

```bash
npm install
cp .env.example .env
cp scheduler.local.json.example scheduler.local.json
# Edit scheduler.local.json with absolute paths to worker repos
npm run dev
```

Verify:

```bash
curl http://127.0.0.1:4120/api/tasks
```

## Configuration

| File | Purpose |
|------|---------|
| `data/tasks.registry.json` | Committed task catalog |
| `scheduler.local.json` | Machine paths + enable flags (gitignored) |
| `.env` | `PORT`, `SCHEDULER_RUNS_DIR`, `SCHEDULER_WORKERS_DIR` |

First shipped task: **lead-studio-email-queue** — POSTs to Lead Studio `process-due` every 15 minutes on weekdays 8–5 ET.

## API

- `GET /api/health` — health check
- `GET /api/tasks` — merged tasks
- `PATCH /api/tasks/:id` — update `enabled`
- `POST /api/tasks/:id/run-now` — run immediately
- `GET /api/runs` — run history

## Optional: launchd (macOS login item)

```bash
./scripts/install-launchd.sh
```

Starts the scheduler express server on login. The web UI is started separately (`local-scheduler-web` on port 4121).

## Disable cloud cron

If you previously used Supabase `pg_cron` for Lead Studio email queue, disable it after switching to local scheduler. See `mentorai-server/supabase/cron-jobs/unschedule-lead-contact-email-scheduler.sql`.

## Architecture

Follow **`.cursor/rules/AGENTS.md`** and **`.cursor/architecture/`** (ADRs 001–008).

## Related

- **local-scheduler-web** — dashboard UI on port 4121
- **Luckee Dev Hub** — optional future link; not required for v1
