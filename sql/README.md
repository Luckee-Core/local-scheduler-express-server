# Local Scheduler SQL

Apply migrations against your local Postgres database (e.g. `local_scheduler`):

```bash
createdb local_scheduler  # once
psql "$DATABASE_URL" -f sql/migrations/001_scheduled_tasks_and_runs.sql
npm run db:seed           # optional: load from data/tasks.registry.json
```

Migrations follow ADR 010: tables and indexes only; no SQL functions or triggers.
