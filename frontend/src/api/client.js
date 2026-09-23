/**
 * The only module that talks to the FastAPI backend.
 *
 * VITE_API_URL is the backend's origin, e.g. https://backend.example.app
 * (without /api; this module appends /api/... itself). Vite embeds it at
 * BUILD time: production builds read it from .env.production or from the
 * hosting platform's environment, and a change needs a new build.
 *
 * In development VITE_API_URL is normally unset: requests go to /api on the
 * dev server, and Vite proxies them to http://127.0.0.1:8000.
 */

// Normalize the configured origin so paths are always joined the same way:
// no trailing slashes, and a base that already ends in /api is tolerated
// (otherwise it would produce /api/api/...).
export const API_BASE_URL = (import.meta.env.VITE_API_URL ?? '')
  .trim()
  .replace(/\/+$/, '')
  .replace(/\/api$/, '');

// Serverless backends can take a few seconds on a cold start.
const TIMEOUT_MS = 20000;

export function apiUrl(path) {
  return `${API_BASE_URL}/api/${path.replace(/^\/+/, '')}`;
}

export class ApiError extends Error {
  constructor(message, { kind = 'server', status = 0, url = '' } = {}) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind; // 'network' | 'server' | 'not_found' | 'invalid'
    this.status = status;
    this.url = url;
  }
}

const MESSAGES = {
  network: 'Coloring engine is unreachable.',
  timeout: 'The coloring engine did not respond in time.',
  notFound: 'API endpoint not found.',
  server: 'Coloring engine encountered a server error.',
  unreadable: 'The coloring engine sent an unreadable response.',
};

function describeDetail(detail) {
  if (!detail) return null;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) return detail.map((d) => d.msg).join('; ');
  return null;
}

/** In development, name the failing request; production keeps the UI clean. */
function fail(message, { kind, status = 0, method, url }) {
  const shown = import.meta.env.DEV ? `${message} (${method} ${url}${status ? ` → ${status}` : ''})` : message;
  return new ApiError(shown, { kind, status, url });
}

async function request(path, { method = 'GET', body } = {}) {
  const url = apiUrl(path);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let response;
  try {
    response = await fetch(url, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (error) {
    // DNS failure, refused connection, blocked by CORS, or our own timeout.
    const timedOut = error?.name === 'AbortError';
    throw fail(timedOut ? MESSAGES.timeout : MESSAGES.network, { kind: 'network', method, url });
  } finally {
    clearTimeout(timer);
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    // Not JSON: a proxy, a static host, or a gateway answered instead of FastAPI.
  }

  if (!response.ok) {
    const { status } = response;
    const detail = describeDetail(payload?.detail);
    if (status >= 500) {
      // No JSON body means FastAPI never answered: the gateway (502/503/504)
      // or, in development, the Vite proxy (500) could not reach it.
      const unreachable = !payload && (status >= 502 || import.meta.env.DEV);
      throw fail(unreachable ? MESSAGES.network : MESSAGES.server, {
        kind: unreachable ? 'network' : 'server',
        status,
        method,
        url,
      });
    }
    if (status === 404) {
      // FastAPI explains a missing resource (e.g. an unknown dataset); a bare
      // 404 or {"detail": "Not Found"} means the URL itself matches no route.
      const specific = detail && detail !== 'Not Found' ? detail : null;
      throw fail(specific ?? MESSAGES.notFound, { kind: 'not_found', status, method, url });
    }
    throw fail(detail ?? `The coloring engine rejected the request (${status}).`, {
      kind: status === 422 ? 'invalid' : 'server',
      status,
      method,
      url,
    });
  }
  if (payload === null) {
    throw fail(MESSAGES.unreadable, { kind: 'server', status: response.status, method, url });
  }
  return payload;
}

export const getHealth = () => request('health');

export const getDatasets = () => request('datasets');

export const getGraph = (dataset) => request(`graph/${encodeURIComponent(dataset)}`);

export const runColoring = (dataset, strategy = 'natural') =>
  request('color', { method: 'POST', body: { dataset, strategy } });

export const checkConflicts = (dataset, coloring) =>
  request('conflicts', { method: 'POST', body: { dataset, coloring } });
