/**
 * Structural metrics of a graph given as vertex IDs and an edge list. These
 * are simple counts (no coloring is computed here; coloring always comes from
 * the backend), so the Graph Playground can show them live while editing.
 */
export function graphMetrics(vertexIds, edges) {
  const V = vertexIds.length;
  const E = edges.length;
  const degree = Object.fromEntries(vertexIds.map((v) => [v, 0]));
  for (const [a, b] of edges) {
    degree[a] += 1;
    degree[b] += 1;
  }
  const degrees = Object.values(degree);
  return {
    V,
    E,
    minDegree: V ? Math.min(...degrees) : 0,
    maxDegree: V ? Math.max(...degrees) : 0,
    averageDegree: V ? (2 * E) / V : 0,
    // Fraction of all possible vertex pairs that are edges: E / (V(V-1)/2).
    density: V > 1 ? (2 * E) / (V * (V - 1)) : 0,
  };
}

/** A complete graph K_n: every pair of its n ≥ 2 vertices is joined by an edge. */
export function isComplete({ V, E }) {
  return V >= 2 && E === (V * (V - 1)) / 2;
}

const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];

/** 5 → "five" (up to ten), larger numbers as digits. */
export function numberWord(n) {
  return WORDS[n] ?? String(n);
}
