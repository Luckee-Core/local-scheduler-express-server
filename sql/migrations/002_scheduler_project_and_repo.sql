-- Business (scheduler_project) + deploy targets (scheduler_project_repo).
-- Upgrades DBs that still have legacy scheduler_projects / scheduler_project_id from an older checkout.

CREATE TABLE IF NOT EXISTS scheduler_project (
  id text PRIMARY KEY,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS scheduler_project_repo (
  id text PRIMARY KEY,
  scheduler_project_id text NOT NULL REFERENCES scheduler_project(id),
  express_repo_name text NOT NULL,
  execution_type text NOT NULL CHECK (execution_type IN ('local', 'production')),
  production_base_url text,
  default_port integer,
  health_path text NOT NULL DEFAULT '/api/health',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT scheduler_project_repo_production_url_chk CHECK (
    (execution_type = 'production' AND production_base_url IS NOT NULL AND production_base_url ~ '^https://')
    OR (execution_type = 'local' AND production_base_url IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS scheduler_project_repo_scheduler_project_id_idx
  ON scheduler_project_repo (scheduler_project_id);

INSERT INTO scheduler_project (id, name)
VALUES
  ('my-gmail-manager', 'Gmail Manager'),
  ('philly-ai-consulting', 'Philly AI Consulting'),
  ('city-nonprofits', 'Philly Nonprofits')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, updated_at = now();

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'scheduler_projects'
  ) THEN
    INSERT INTO scheduler_project_repo (
      id, scheduler_project_id, express_repo_name, execution_type, production_base_url, default_port, health_path
    )
    SELECT
      sp.id,
      CASE
        WHEN sp.id = 'my-gmail-manager-storage' THEN 'my-gmail-manager'
        ELSE sp.id
      END,
      CASE sp.id
        WHEN 'my-gmail-manager' THEN 'my-gmail-manager-express-server'
        WHEN 'my-gmail-manager-storage' THEN 'my-gmail-manager-storage-express-server'
        WHEN 'philly-ai-consulting' THEN 'philly-ai-consulting-express-server'
        WHEN 'city-nonprofits' THEN 'city-nonprofits-express-server'
        ELSE sp.id || '-express-server'
      END,
      sp.type,
      sp.production_base_url,
      sp.default_port,
      sp.health_path
    FROM scheduler_projects sp
    ON CONFLICT (id) DO UPDATE SET
      scheduler_project_id = EXCLUDED.scheduler_project_id,
      express_repo_name = EXCLUDED.express_repo_name,
      execution_type = EXCLUDED.execution_type,
      production_base_url = EXCLUDED.production_base_url,
      default_port = EXCLUDED.default_port,
      health_path = EXCLUDED.health_path,
      updated_at = now();
  END IF;
END $$;

INSERT INTO scheduler_project_repo (
  id, scheduler_project_id, express_repo_name, execution_type, production_base_url, default_port, health_path
)
VALUES
  (
    'my-gmail-manager',
    'my-gmail-manager',
    'my-gmail-manager-express-server',
    'local',
    NULL,
    3052,
    '/api/health'
  ),
  (
    'my-gmail-manager-storage',
    'my-gmail-manager',
    'my-gmail-manager-storage-express-server',
    'local',
    NULL,
    3010,
    '/api/health'
  ),
  (
    'philly-ai-consulting',
    'philly-ai-consulting',
    'philly-ai-consulting-express-server',
    'local',
    NULL,
    3044,
    '/api/health'
  ),
  (
    'city-nonprofits',
    'city-nonprofits',
    'city-nonprofits-express-server',
    'production',
    'https://city-nonprofits-express-server-production-ba3c.up.railway.app',
    3028,
    '/api/health'
  )
ON CONFLICT (id) DO NOTHING;

ALTER TABLE scheduled_tasks
  ADD COLUMN IF NOT EXISTS scheduler_project_repo_id text;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'scheduled_tasks'
      AND column_name = 'scheduler_project_id'
  ) THEN
    UPDATE scheduled_tasks
    SET scheduler_project_repo_id = COALESCE(scheduler_project_id, worker_project_id)
    WHERE scheduler_project_repo_id IS NULL;
  ELSE
    UPDATE scheduled_tasks
    SET scheduler_project_repo_id = worker_project_id
    WHERE scheduler_project_repo_id IS NULL;
  END IF;
END $$;

UPDATE scheduled_tasks
SET worker_project_id = scheduler_project_repo_id
WHERE worker_project_id IS DISTINCT FROM scheduler_project_repo_id;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'scheduled_tasks_scheduler_project_id_fkey'
  ) THEN
    ALTER TABLE scheduled_tasks DROP CONSTRAINT scheduled_tasks_scheduler_project_id_fkey;
  END IF;
END $$;

ALTER TABLE scheduled_tasks DROP COLUMN IF EXISTS scheduler_project_id;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'scheduled_tasks_scheduler_project_repo_id_fkey'
  ) THEN
    ALTER TABLE scheduled_tasks
      ALTER COLUMN scheduler_project_repo_id SET NOT NULL;

    ALTER TABLE scheduled_tasks
      ADD CONSTRAINT scheduled_tasks_scheduler_project_repo_id_fkey
      FOREIGN KEY (scheduler_project_repo_id) REFERENCES scheduler_project_repo(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS scheduled_tasks_scheduler_project_repo_id_idx
  ON scheduled_tasks (scheduler_project_repo_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'scheduled_tasks_lifecycle_chk'
  ) THEN
    ALTER TABLE scheduled_tasks
      ADD CONSTRAINT scheduled_tasks_lifecycle_chk
      CHECK (lifecycle IN ('start_if_needed_stop_if_started', 'call_only'));
  END IF;
END $$;

DROP TABLE IF EXISTS scheduler_projects;
