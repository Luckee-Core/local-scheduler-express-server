import { execSync } from 'child_process';
import { portListening } from './port-listening';

const PROBE_CURL_MAX_SECONDS = 0.5;

const curlProbe = (args: string): string | null => {
  try {
    return execSync(`curl -fsS --max-time ${PROBE_CURL_MAX_SECONDS} ${args} 2>/dev/null`, {
      encoding: 'utf8',
      timeout: 1000,
    });
  } catch {
    return null;
  }
};

/**
 * True when Express health responds on the configured API port.
 */
export const isExpressHealthOk = (apiPort: number, healthPath: string): boolean => {
  if (!portListening(apiPort)) {
    return false;
  }
  const url = `http://127.0.0.1:${apiPort}${healthPath}`;
  const out = curlProbe(`"${url}"`);
  if (out && out.includes('"status"') && out.includes('"ok"')) {
    return true;
  }
  return curlProbe(`-o /dev/null "${url}"`) !== null;
};
