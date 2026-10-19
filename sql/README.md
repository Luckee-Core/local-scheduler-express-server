# Local Scheduler SQL

Apply migrations against your local Postgres database (e.g. `local_scheduler`):

```bash
createdb local_scheduler  # once
for f in sql/migrations/*.sql; do psql "$DATABASE_URL" -f "$f"; done
npm run db:seed           # scheduler-project*.registry.json + tasks.registry.json
```

Migrations: `001_scheduled_tasks_and_runs.sql`, `002_scheduler_project_and_repo.sql`, `003_city_nonprofits_repo_local.sql`, then `npm run db:seed`.

If you still have legacy `scheduler_projects` from an old checkout, `002` migrates into `scheduler_project` / `scheduler_project_repo` and drops it.

Migrations follow ADR 010: tables and indexes only; no SQL functions or triggers.
