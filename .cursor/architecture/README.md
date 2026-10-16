# Architecture Documentation

ADRs for **express-server-template** and apps created from it.

## ADR index

1. [001 – File & service organization](./001-file-and-service-organization.md) — `src/data/{table}/` CRUD only; `src/services/{feature}/` for HTTP and business logic. **No `src/domains/`.**
2. [002 – Router factory & handler pattern](./002-router-factory-and-handler-pattern.md) — Thin routers, handlers, `processX()`.
3. [003 – Data layer CRUD boundaries](./003-data-layer-crud-boundaries.md) — One table folder, one function per file; types in `src/model/`.
4. [004 – Managed clients & startup init](./004-managed-clients-and-startup-init.md) — Startup init, accessors; **pg Pool appendix** for this app.
5. [005 – Edge functions & Railway boundaries](./005-edge-functions-railway-only.md) — Edge → Railway only.
6. [006 – Logging & error response standards](./006-logging-and-error-response-standards.md) — Emoji logging, response shape.
7. [007 – Starter template layout](./007-starter-template-layout.md) — Shipped `src/services/` tree.
8. [008 – Domain models (`src/model`)](./008-domain-models.md) — table row + write-input types; never `src/data/{table}/types.ts`.
9. [009 – Local scheduler service](./009-local-scheduler-service.md) — Localhost daemon, Postgres, cron, worker lifecycle.
10. [010 – No SQL functions](./010-no-sql-functions.md) — tables, indexes, grants, RLS only; `updated_at` in CRUD.
11. [011 – Remote worker base URL](./011-remote-worker-base-url.md) — proposed; cron host vs API host without co-located spawn.

Stripe ADR (009 in template) is **not applicable** to this repo.

## How to use

1. Open the ADR for your feature.
2. Follow the patterns exactly.
3. Add ADRs when decisions change and update this index.
