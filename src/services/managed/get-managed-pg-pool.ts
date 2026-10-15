import type { Pool } from 'pg';

let managedPool: Pool | null = null;

/**
 * Stores the singleton pool created at startup.
 */
export const setManagedPgPool = (pool: Pool | null): void => {
  managedPool = pool;
};

/**
 * Returns the managed Postgres pool, or null when it was not initialized.
 */
export const getManagedPgPool = (): Pool | null => managedPool;
