import { Pool } from 'pg';
import { setManagedPgPool } from './get-managed-pg-pool';

/**
 * Creates the managed Postgres pool.
 */
export const initializePgPool = async (): Promise<void> => {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    console.error('❌ [initializePgPool] DATABASE_URL is not set');
    setManagedPgPool(null);
    return;
  }

  const pool = new Pool({
    connectionString,
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });

  pool.on('error', (error) => {
    console.error('❌ [initializePgPool] Pool error', error);
  });

  setManagedPgPool(pool);

  try {
    await pool.query('SELECT 1');
    console.log('✅ [initializePgPool] Postgres pool ready');
  } catch (error) {
    console.error('❌ [initializePgPool] SELECT 1 failed', error);
  }
};
