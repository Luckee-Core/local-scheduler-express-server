import { execSync } from 'child_process';
import { portListening } from './port-listening';

const PROBE_CURL_MAX_SECONDS = 0.5;
const BODY_SNIPPET_MAX = 120;

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

export type ExpressHealthProbe = {
  ok: boolean;
  portListening: boolean;
  healthUrl: string;
  failureReason: string | null;
  bodySnippet: string | null;
};

/**
 * Probes Express health with structured failure reasons for logging.
 */
export const probeExpressHealth = (apiPort: number, healthPath: string): ExpressHealthProbe => {
  const healthUrl = `http://127.0.0.1:${apiPort}${healthPath}`;
  const listening = portListening(apiPort);

  if (!listening) {
    return {
      ok: false,
      portListening: false,
      healthUrl,
      failureReason: 'port_not_listening',
      bodySnippet: null,
    };
  }

  const out = curlProbe(`"${healthUrl}"`);
  if (out && out.includes('"status"') && out.includes('"ok"')) {
    const snippet = out.length > BODY_SNIPPET_MAX ? `${out.slice(0, BODY_SNIPPET_MAX)}…` : out;
    return {
      ok: true,
      portListening: true,
      healthUrl,
      failureReason: null,
      bodySnippet: snippet,
    };
  }

  if (curlProbe(`-o /dev/null "${healthUrl}"`) !== null) {
    return {
      ok: true,
      portListening: true,
      healthUrl,
      failureReason: null,
      bodySnippet: null,
    };
  }

  const snippet =
    out && out.length > 0
      ? out.length > BODY_SNIPPET_MAX
        ? `${out.slice(0, BODY_SNIPPET_MAX)}…`
        : out
      : null;

  return {
    ok: false,
    portListening: true,
    healthUrl,
    failureReason: 'health_response_invalid',
    bodySnippet: snippet,
  };
};
