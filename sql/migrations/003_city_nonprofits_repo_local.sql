-- City Nonprofits digest: studio spawns local Express (like Gmail), not Railway call_only.

UPDATE scheduler_project_repo
SET execution_type = 'local',
    production_base_url = NULL
WHERE id = 'city-nonprofits';

UPDATE scheduled_tasks
SET lifecycle = 'start_if_needed_stop_if_started'
WHERE id IN (
  'city-nonprofits-monday-digest-enqueue',
  'city-nonprofits-monday-digest-process-due'
);
