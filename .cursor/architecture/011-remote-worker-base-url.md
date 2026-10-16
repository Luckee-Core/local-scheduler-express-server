# 011 — Remote worker base URL (proposed)

## Status

Proposed — **not implemented**

## Context

Worker HTTP targets are hardcoded to `http://127.0.0.1:{port}` in `ensureWorkerReady` and health checks. That requires the **local-scheduler process and worker Express** to run on the same host (or spawned child on that host).

Studio Phase 1 and Phase 3 (dedicated cron host with co-located spawned dispatcher) fit this model. A future layout might require:

- Cron on host **A**
- User-facing dispatcher always-on on host **B**
- Storage on host **C**

Without co-locating a headless dispatcher on **A**, cron cannot call **B** today.

## Decision (if implemented)

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

2. Add lifecycle mode `call_only`:

- Never spawn or SIGTERM workers on another host.
- Scheduler only issues HTTP; operator keeps dispatcher running on API host.

3. Security:

- Scheduler API remains `127.0.0.1` only.
- Remote worker URLs must be RFC1918 or loopback; reject public IPs in config parse (fail closed).
- No change to storage LAN secret model (dispatcher → storage).

## Consequences

- Enables cron host ≠ API host without duplicate long-lived dispatchers on cron host.
- Increases misconfiguration risk (wrong URL, firewall).
- Until implemented, **move scheduler launchd with co-located worker spawn** per Luckee Hub [three-device-gmail-and-cron-evolution.md](https://github.com/luckee-hub/luckee-hub-express-server/blob/main/data/location_installation/three-device-gmail-and-cron-evolution.md).

## Related

- [009 – Local scheduler service](./009-local-scheduler-service.md)
- Luckee Hub `data/location_installation/three-device-gmail-and-cron-evolution.md`
