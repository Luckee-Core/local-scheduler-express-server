CREATE TABLE IF NOT EXISTS scheduled_tasks (
  id text PRIMARY KEY,
  name text NOT NULL,
  worker_project_id text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  worker jsonb NOT NULL,
  request jsonb NOT NULL,
  schedule jsonb NOT NULL,
  lifecycle text NOT NULL DEFAULT 'start_if_needed_stop_if_started',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS scheduled_tasks_enabled_idx ON scheduled_tasks (enabled);
CREATE INDEX IF NOT EXISTS scheduled_tasks_worker_project_id_idx ON scheduled_tasks (worker_project_id);

CREATE TABLE IF NOT EXISTS scheduler_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id text NOT NULL REFERENCES scheduled_tasks(id) ON DELETE CASCADE,
  task_name text NOT NULL,
  started_at timestamptz NOT NULL,
  finished_at timestamptz NOT NULL,
  duration_ms integer NOT NULL,
  status text NOT NULL CHECK (status IN ('success', 'failed', 'skipped')),
  http_status integer,
  error text,
  response_summary text,
  trigger text NOT NULL CHECK (trigger IN ('scheduled', 'manual'))
);

CREATE INDEX IF NOT EXISTS scheduler_runs_task_id_finished_at_idx ON scheduler_runs (task_id, finished_at DESC);
CREATE INDEX IF NOT EXISTS scheduler_runs_finished_at_idx ON scheduler_runs (finished_at DESC);
