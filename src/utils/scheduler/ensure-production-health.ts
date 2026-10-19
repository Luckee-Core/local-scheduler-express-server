const HEALTH_TIMEOUT_MS = 10_000;

/**
 * GET health on a production worker before running a job.
 */
export const ensureProductionHealth = async (healthUrl: string): Promise<void> => {
  console.log(`📥 [ensureProductionHealth] GET ${healthUrl}`);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);

  try {
    const response = await fetch(healthUrl, { method: 'GET', signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Production health check failed: HTTP ${response.status} for ${healthUrl}`);
    }
    console.log(`✅ [ensureProductionHealth] OK ${healthUrl}`);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Production health check failed';
    console.error(`❌ [ensureProductionHealth] ${message}`);
    throw new Error(message);
  } finally {
    clearTimeout(timeout);
  }
};
