import { execSync } from 'child_process';

/**
 * True when something is listening on the TCP port.
 */
export const portListening = (port: number): boolean => {
  try {
    execSync(`lsof -iTCP:${port} -sTCP:LISTEN -t`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
};
