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

export function pad2(n) {
  return String(n).padStart(2, '0');
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
