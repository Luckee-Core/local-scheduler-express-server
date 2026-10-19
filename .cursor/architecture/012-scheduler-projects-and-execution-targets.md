# 012 — Scheduler project, repo, and execution targets

## Status

Accepted

## Context

Scheduled tasks need a **business** catalog (Gmail Manager, Philly Nonprofits) separate from **deployable Express repos** (dispatcher, storage, production Railway). Schema lives in `002_scheduler_project_and_repo.sql` (`scheduler_project` + `scheduler_project_repo`). Legacy one-table `scheduler_projects` from older checkouts is migrated and dropped in that same file.

## Decision

### `scheduler_project` (business)

| Column | Role |
|--------|------|
| `id` | Slug |
| `name` | Display name |

Seed: `data/scheduler-project.registry.json`.

### `scheduler_project_repo` (deploy target)

| Column | Role |
|--------|------|
| `id` | Slug; **equals `scheduler.local.json` workers map key** and `scheduled_tasks.worker_project_id` |
| `scheduler_project_id` | FK to business |
| `express_repo_name` | GitHub repo folder name |
| `execution_type` | `local` or `production` |
| `production_base_url` | Required for `production`; `https://` only |
| `default_port`, `health_path` | Local merge / health |

Seed: `data/scheduler-project-repo.registry.json`.

### `scheduled_tasks.scheduler_project_repo_id`

FK to `scheduler_project_repo`. Tasks run against the **repo**. Business is joined for API/UI. `worker_project_id` stays in sync with `scheduler_project_repo_id` for spawn and logs.

### Lifecycle

| `execution_type` | Required `lifecycle` |
|------------------|----------------------|
| `local` | `start_if_needed_stop_if_started` |
| `production` | `call_only` |

### Execution

`resolveTaskExecutionTarget(task, repo, local)` — branch on `repo.execution_type`; spawn via `buildSpawnableWorker(repo.id, …)`.

Merged tasks: `schedulerProject`, `schedulerProjectRepo`, `executionTarget`.

### API

- `GET /api/projects` — businesses only
- `GET /api/projects/:id/repos` — repos for one business
- `GET /api/project-repos`, `GET /api/project-repos/:id` — all repos or one

### Examples

| Repo id | `execution_type` | Tasks |
|---------|------------------|--------|
| `my-gmail-manager` | `local` | Gmail job routes; spawn dispatcher |
| `city-nonprofits` | `local` | Monday digest enqueue + process-due; spawn Express on port 3028 |
| (future) | `production` | `call_only` to `production_base_url` when worker must stay on Railway |

## Related

- [009 – Local scheduler service](./009-local-scheduler-service.md)
- [011 – Remote worker base URL](./011-remote-worker-base-url.md)
- city-nonprofits-express ADR 026 — Monday digest studio tasks
