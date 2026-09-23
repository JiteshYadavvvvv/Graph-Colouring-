/**
 * The only module that talks to the FastAPI backend.
 *
 * In development, Vite proxies /api to http://127.0.0.1:8000. Set
 * VITE_API_URL to call a backend on another origin directly.
 */
const BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const TIMEOUT_MS = 10000;

export class ApiError extends Error {
  constructor(message, { kind = 'server', status = 0 } = {}) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind; // 'network' | 'server' | 'not_found' | 'invalid'
    this.status = status;
  }
}

const OFFLINE_MESSAGE =
  'Unable to connect to the coloring engine. Make sure the FastAPI backend is running on port 8000.';

function describeDetail(detail) {
  if (!detail) return null;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) return detail.map((d) => d.msg).join('; ');
  return null;
}

async function request(path, { method = 'GET', body } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch {
    throw new ApiError(OFFLINE_MESSAGE, { kind: 'network' });
  } finally {
    clearTimeout(timer);
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    // Not JSON: the proxy itself failed (backend down) or something else answered.
  }

  if (!response.ok) {
    // Vite's proxy answers 500/502/504 with no JSON body when the backend is down.
    if (!payload && response.status >= 500) {
      throw new ApiError(OFFLINE_MESSAGE, { kind: 'network', status: response.status });
    }
    const kind = response.status === 404 ? 'not_found' : response.status === 422 ? 'invalid' : 'server';
    const message = describeDetail(payload?.detail) || `The coloring engine returned an error (${response.status}).`;
    throw new ApiError(message, { kind, status: response.status });
  }
  if (payload === null) {
    throw new ApiError('The coloring engine sent an unreadable response.', { kind: 'server' });
  }
  return payload;
}

export const getHealth = () => request('/api/health');

export const getDatasets = () => request('/api/datasets');

export const getGraph = (dataset) => request(`/api/graph/${encodeURIComponent(dataset)}`);

export const runColoring = (dataset, strategy = 'natural') =>
  request('/api/color', { method: 'POST', body: { dataset, strategy } });

export const checkConflicts = (dataset, coloring) =>
  request('/api/conflicts', { method: 'POST', body: { dataset, coloring } });
