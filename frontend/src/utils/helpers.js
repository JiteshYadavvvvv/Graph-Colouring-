import { PALETTE } from './constants';

/** Fill color for backend color number k (1-based). Generates extra hues if needed. */
export function colorFill(k) {
  if (!k) return null;
  if (k <= PALETTE.length) return PALETTE[k - 1].fill;
  const hue = (k * 137.508) % 360;
  return `hsl(${hue.toFixed(0)} 62% 52%)`;
}

/** Label color that is readable on top of color k. */
export function colorInk(k) {
  if (!k) return '#172033';
  return k <= PALETTE.length ? PALETTE[k - 1].ink : '#FFFFFF';
}

export function colorName(k) {
  if (!k) return 'Uncolored';
  return k <= PALETTE.length ? PALETTE[k - 1].name : `Hue ${k}`;
}

/**
 * Display name of a vertex. Vertices are identified by stable IDs (e.g.
 * "IN-MH"); names ("Maharashtra") are only ever used for display.
 */
export function nameOf(graph, vertex) {
  return graph?.names?.[vertex] ?? vertex;
}

/** Stable key for an undirected edge. */
export function edgeKey(u, v) {
  return u < v ? `${u}|${v}` : `${v}|${u}`;
}

/**
 * Rebuild the coloring that is visible at a given playback position, using
 * ONLY the colors the backend assigned in its steps. Nothing is invented here.
 */
export function coloringAtCursor(steps, cursor) {
  const coloring = {};
  if (!steps || cursor.step < 0) return coloring;
  for (let i = 0; i < cursor.step; i += 1) {
    coloring[steps[i].vertex] = steps[i].assigned_color;
  }
  const current = steps[cursor.step];
  if (current && cursor.phase >= 3) coloring[current.vertex] = current.assigned_color;
  return coloring;
}

/** Sorted list of the distinct color numbers used in a coloring. */
export function usedColors(coloring) {
  return [...new Set(Object.values(coloring))].sort((a, b) => a - b);
}

/** Color classes: [{ color, members: [vertex, ...] }], members in `order`. */
export function colorClasses(coloring, order) {
  return usedColors(coloring).map((color) => ({
    color,
    members: order.filter((v) => coloring[v] === color),
  }));
}

export function pad2(n) {
  return String(n).padStart(2, '0');
}

/** "3 vertices", "1 vertex". */
export function plural(n, singular, pluralForm = `${singular}s`) {
  return `${n} ${n === 1 ? singular : pluralForm}`;
}

/** Bounding box of layout points, padded, as an SVG viewBox. */
export function layoutViewBox(layout, padding) {
  const pts = Object.values(layout);
  if (!pts.length) return { x: 0, y: 0, w: 100, h: 100 };
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const minX = Math.min(...xs) - padding;
  const minY = Math.min(...ys) - padding;
  return {
    x: minX,
    y: minY,
    w: Math.max(...xs) + padding - minX,
    h: Math.max(...ys) + padding - minY,
  };
}

/** Formats a backend time in ms: 0.0123 → "12.3 µs", 1.5 → "1.50 ms". */
export function formatMs(ms) {
  if (ms === null || ms === undefined) return '—';
  if (ms < 1) return `${(ms * 1000).toFixed(1)} µs`;
  return `${ms.toFixed(2)} ms`;
}
