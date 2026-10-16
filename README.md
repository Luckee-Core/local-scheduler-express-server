# Local Scheduler Express Server

Local-only daemon that registers scheduled HTTP tasks against worker Express apps, manages worker lifecycle, and persists tasks and run history in **local Postgres**.

Default port: **3022** (Luckee Hub catalog; binds `127.0.0.1` only).

## Mac Studio deployment

Full runbook (Gmail storage + spawn/stop dispatcher + launchd):

- Luckee Hub: `luckee-hub-express-server/data/location_installation/local-scheduler-studio-deployment.md`
- Phases 2–3 (API on another Mac, dedicated cron host): `three-device-gmail-and-cron-evolution.md`

**Fleet rule:** one active scheduler launchd per environment.

## Quick start

```bash
npm install
cp .env.example .env
npm run db:setup
cp scheduler.local.json.studio.example scheduler.local.json
# Edit scheduler.local.json with absolute paths to worker repos
npm run dev
```

Or use Luckee Hub **Local database** for `local-scheduler` after registry `localDatabase` is configured.

Verify:

```bash
curl http://127.0.0.1:3022/api/health
curl http://127.0.0.1:3022/api/tasks
./scripts/verify-gmail-pipeline.sh
```

## Configuration

| File / env | Purpose |
|------------|---------|
| `DATABASE_URL` | Local Postgres `local_scheduler` |
| `scheduler.local.json` | Machine worker paths (gitignored); optional `dependsOn`, `healthPath` for storage workers; see `scheduler.local.json.studio.example` |
| `data/tasks.registry.json` | Seed fixture for `npm run db:seed` |
| `.env` | `PORT`, `SCHEDULER_WORKERS_DIR`; worker secrets (`GMAIL_MANAGER_CRON_SECRET`, etc.) |

Gmail dispatcher on the same Mac as cron: `my-gmail-manager-express-server/.env.studio-cron.example`.

## API

- `GET /api/health` — health + `database` status
- `GET /api/tasks` — merged tasks
- `POST /api/tasks` — create task (`?upsert=true` to update by id)
- `PATCH /api/tasks/:id` — update fields including `enabled`
- `DELETE /api/tasks/:id` — remove task
- `POST /api/tasks/:id/run-now` — run immediately (ignores `enabled` and schedule; cron still requires `enabled`)
- `GET /api/runs` — run history
- `GET /api/workers` — worker spawn/runtime status (manifest + health probe)
- `GET /api/workers/:workerProjectId/logs?lines=200` — tail worker log file

### Hub vs worker logs

The **Local Scheduler** Hub terminal shows only this Express process. When a task spawns a worker (`start_if_needed_stop_if_started`), worker `npm start` output goes to:

`$SCHEDULER_WORKERS_DIR/{workerProjectId}.log` (default `/tmp/local-scheduler/workers/`)

The scheduler prints `tail -f` path on spawn and progress while waiting for health. Luckee Hub can attach a **Scheduler spawn log** terminal tab on the worker project during `starting` / recent `failed` phases (terminal sync).

Register from another project:

```bash
./scripts/register-task.sh ./my-task.json
```

## Production: launchd (macOS login item)

```bash
./scripts/install-launchd.sh
```

Loads `.env` from repo root. Logs: `~/Library/Logs/local-scheduler/express.out.log`

Worker spawn logs: `$SCHEDULER_WORKERS_DIR` (default `/tmp/local-scheduler/workers/{workerProjectId}.log`).

## Phase 3 — move cron to another Mac

1. `launchctl unload` on old host.
2. `pg_dump -Fc local_scheduler` → restore on new host (or `npm run db:seed`).
3. Copy `.env`, `scheduler.local.json` (fix paths), dispatcher `.env` with `STORAGE_EXPRESS_URL` → studio LAN IP.
4. `./scripts/install-launchd.sh` on new host; run `./scripts/verify-gmail-pipeline.sh`.

See Luckee Hub `three-device-gmail-and-cron-evolution.md`.

## Architecture

Follow **`.cursor/rules/AGENTS.md`** and **`.cursor/architecture/`** (ADRs 001–011).

## Related

- **local-scheduler-web** — optional dashboard (`NEXT_PUBLIC_API_URL=http://127.0.0.1:3022`), studio desktop only
