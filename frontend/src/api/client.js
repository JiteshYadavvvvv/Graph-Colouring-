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
    this.kind = kind; // 'network' | 'server' | 'not_found' | 'invalid' | 'invalid_response'
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
  malformed: 'The coloring engine sent a response in an unexpected format.',
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

/**
 * `shape` (optional) checks a successful response's body, so a proxy error
 * page or an outdated backend shows a clear message instead of crashing a
 * component later.
 */
async function request(path, { method = 'GET', body, shape } = {}) {
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
    throw fail(MESSAGES.unreadable, { kind: 'invalid_response', status: response.status, method, url });
  }
  if (shape && !shape(payload)) {
    throw fail(MESSAGES.malformed, { kind: 'invalid_response', status: response.status, method, url });
  }
  return payload;
}

const isObject = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);

const SHAPES = {
  graph: (g) => isObject(g) && Array.isArray(g.vertices) && isObject(g.adjacency) && isObject(g.layout) && isObject(g.statistics),
  color: (r) => isObject(r) && Array.isArray(r.steps) && isObject(r.coloring) && Array.isArray(r.order),
  conflicts: (r) => isObject(r) && typeof r.valid === 'boolean' && Array.isArray(r.conflicts),
  compare: (r) => isObject(r) && Array.isArray(r.results),
};

/**
 * A graph to work on: a built-in dataset key ("india" or { dataset: "india" })
 * or a custom graph from the Playground ({ graph: adjacency, names }).
 */
function sourceBody(source) {
  if (typeof source === 'string') return { dataset: source };
  if (source.graph) return { graph: source.graph, names: source.names };
  return { dataset: source.dataset };
}

// Built-in datasets never change while the app runs, so each one is fetched
// at most once. Failed requests are not cached, so Retry really retries.
const graphCache = new Map();

export const getHealth = () => request('health');

export const getDatasets = () => request('datasets', { shape: Array.isArray });

export function getGraph(dataset) {
  const path = `graph/${encodeURIComponent(dataset)}`;
  if (!graphCache.has(dataset)) {
    const pending = request(path, { shape: SHAPES.graph });
    graphCache.set(dataset, pending);
    pending.catch(() => graphCache.delete(dataset));
  }
  return graphCache.get(dataset);
}

/** Validates a Playground graph on the backend and returns it in dataset format. */
export const analyzeGraph = ({ adjacency, names, layout }) =>
  request('analyze', { method: 'POST', body: { graph: adjacency, names, layout }, shape: SHAPES.graph });

export const runColoring = (source, strategy = 'natural') =>
  request('color', { method: 'POST', body: { ...sourceBody(source), strategy }, shape: SHAPES.color });

export const checkConflicts = (source, coloring) =>
  request('conflicts', { method: 'POST', body: { ...sourceBody(source), coloring }, shape: SHAPES.conflicts });

export const compareAlgorithms = (source) =>
  request('compare', { method: 'POST', body: sourceBody(source), shape: SHAPES.compare });
