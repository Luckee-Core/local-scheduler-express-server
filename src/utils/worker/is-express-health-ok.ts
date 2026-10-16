import { probeExpressHealth } from './probe-express-health';

/**
 * True when Express health responds on the configured API port.
 */
export const isExpressHealthOk = (apiPort: number, healthPath: string): boolean =>
  probeExpressHealth(apiPort, healthPath).ok;
