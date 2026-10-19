# 011 — Remote worker base URL

## Status

Partially implemented — **production HTTPS** via `scheduler_project_repo.production_base_url` ([012](./012-scheduler-projects-and-execution-targets.md)). **LAN `baseUrl` in `scheduler.local.json`** is still not implemented.

## Context

Worker HTTP targets are hardcoded to `http://127.0.0.1:{port}` in `ensureWorkerReady` and health checks. That requires the **local-scheduler process and worker Express** to run on the same host (or spawned child on that host).

`scheduler_project_repo.execution_type === 'production'` uses `production_base_url` with lifecycle `call_only` — no spawn.

A future layout might still require **private LAN** workers without production URLs:

- Cron on host **A**
- User-facing dispatcher always-on on host **B**
- Storage on host **C**

## Decision (LAN — not implemented)

1. Extend `scheduler.local.json` per worker:

```json
"my-gmail-manager": {
  "expressDir": "/path/to/repo",
  "port": 3052,
  "host": "127.0.0.1",
  "baseUrl": null
}
```

- `baseUrl` when set (e.g. `http://192.168.1.20:3052`) overrides `http://127.0.0.1:{port}` for job `fetch` only.
- Health check uses the same origin as `baseUrl`.

2. Security for LAN mode:

- Scheduler API remains `127.0.0.1` only.
- Remote worker URLs should be RFC1918 or loopback; reject public IPs in config parse (fail closed).
- Production URLs use DB constraint `https://` only ([012](./012-scheduler-projects-and-execution-targets.md)).

## Implemented (production)

- Lifecycle `call_only` on production projects.
- `processExecuteTask` health + job fetch to `scheduler_project_repo.production_base_url`.

## Related

- [009 – Local scheduler service](./009-local-scheduler-service.md)
- [012 – Scheduler projects and execution targets](./012-scheduler-projects-and-execution-targets.md)
- Luckee Hub `data/location_installation/three-device-gmail-and-cron-evolution.md`
