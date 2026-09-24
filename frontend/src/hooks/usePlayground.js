import { useCallback, useMemo, useState } from 'react';
import { EXAMPLES } from '../content/examples';

/** Size of the editor canvas (SVG units). */
export const CANVAS = { width: 640, height: 430 };
export const MAX_VERTICES = 30;
export const MAX_NAME_LENGTH = 24;
const MIN_GAP = 56; // closest two vertices may be placed automatically

const pairKey = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`);

/** A, B, …, Z, then A2, B2, … : the first one no vertex uses yet. */
function nextFreeName(vertices) {
  const used = new Set(vertices.map((v) => v.name.toLowerCase()));
  for (let round = 1; ; round += 1) {
    for (let i = 0; i < 26; i += 1) {
      const name = String.fromCharCode(65 + i) + (round > 1 ? round : '');
      if (!used.has(name.toLowerCase())) return name;
    }
  }
}

/** A position at least MIN_GAP away from every vertex, scanning a grid. */
function freeSpot(vertices) {
  const margin = 40;
  for (let gap = MIN_GAP; gap > 20; gap -= 8) {
    for (let y = margin; y <= CANVAS.height - margin; y += gap) {
      for (let x = margin; x <= CANVAS.width - margin; x += gap) {
        if (vertices.every((v) => Math.hypot(v.x - x, v.y - y) >= gap)) return { x, y };
      }
    }
  }
  return { x: CANVAS.width / 2, y: CANVAS.height / 2 };
}

function circleLayout(n) {
  const cx = CANVAS.width / 2;
  const cy = CANVAS.height / 2;
  const radius = Math.min(cx, cy) - 50;
  return Array.from({ length: n }, (_, i) => ({
    x: Math.round(cx + radius * Math.cos(-Math.PI / 2 + (2 * Math.PI * i) / n)),
    y: Math.round(cy + radius * Math.sin(-Math.PI / 2 + (2 * Math.PI * i) / n)),
  }));
}

const EMPTY = { vertices: [], edges: [], nextId: 1 };

/**
 * Editable graph for the Graph Playground. Vertices have a stable ID
 * ("v1", "v2", …) that never changes, and a display name that can be renamed.
 * Every operation validates its input and returns an error message (or null),
 * so an invalid graph is never built: no self-loops, no duplicate edges, no
 * duplicate names, no dangling edges.
 */
export function usePlayground() {
  const [state, setState] = useState(EMPTY);
  const [selected, setSelected] = useState(null);

  const byId = useMemo(() => Object.fromEntries(state.vertices.map((v) => [v.id, v])), [state.vertices]);
  const edgeSet = useMemo(() => new Set(state.edges.map(([a, b]) => pairKey(a, b))), [state.edges]);

  const addVertex = useCallback(
    (position) => {
      if (state.vertices.length >= MAX_VERTICES) return `The Playground holds at most ${MAX_VERTICES} vertices.`;
      const id = `v${state.nextId}`;
      const spot = position ?? freeSpot(state.vertices);
      const vertex = {
        id,
        name: nextFreeName(state.vertices),
        x: Math.round(Math.min(Math.max(spot.x, 24), CANVAS.width - 24)),
        y: Math.round(Math.min(Math.max(spot.y, 24), CANVAS.height - 24)),
      };
      setState((s) => ({ ...s, vertices: [...s.vertices, vertex], nextId: s.nextId + 1 }));
      setSelected(id);
      return null;
    },
    [state],
  );

  const removeVertex = useCallback((id) => {
    setState((s) => ({
      ...s,
      vertices: s.vertices.filter((v) => v.id !== id),
      edges: s.edges.filter(([a, b]) => a !== id && b !== id),
    }));
    setSelected((current) => (current === id ? null : current));
  }, []);

  const renameVertex = useCallback(
    (id, rawName) => {
      const name = rawName.trim().replace(/\s+/g, ' ');
      if (!name) return 'A vertex name cannot be empty.';
      if (name.length > MAX_NAME_LENGTH) return `Names can be at most ${MAX_NAME_LENGTH} characters.`;
      const taken = state.vertices.some((v) => v.id !== id && v.name.toLowerCase() === name.toLowerCase());
      if (taken) return `Another vertex is already called “${name}”.`;
      setState((s) => ({ ...s, vertices: s.vertices.map((v) => (v.id === id ? { ...v, name } : v)) }));
      return null;
    },
    [state.vertices],
  );

  const moveVertex = useCallback((id, x, y) => {
    const clampedX = Math.round(Math.min(Math.max(x, 24), CANVAS.width - 24));
    const clampedY = Math.round(Math.min(Math.max(y, 24), CANVAS.height - 24));
    setState((s) => ({ ...s, vertices: s.vertices.map((v) => (v.id === id ? { ...v, x: clampedX, y: clampedY } : v)) }));
  }, []);

  const addEdge = useCallback(
    (a, b) => {
      if (!byId[a] || !byId[b]) return 'Choose two existing vertices.';
      if (a === b) return 'A vertex cannot be connected to itself (self-loops are not allowed).';
      if (edgeSet.has(pairKey(a, b))) return `${byId[a].name} and ${byId[b].name} are already connected.`;
      setState((s) => ({ ...s, edges: [...s.edges, [a, b]] }));
      return null;
    },
    [byId, edgeSet],
  );

  const removeEdge = useCallback((a, b) => {
    const key = pairKey(a, b);
    setState((s) => ({ ...s, edges: s.edges.filter(([x, y]) => pairKey(x, y) !== key) }));
  }, []);

  const clear = useCallback(() => {
    setState(EMPTY);
    setSelected(null);
  }, []);

  /** Random graph G(n, p): n vertices on a circle, each pair joined with probability p. */
  const randomGraph = useCallback((n, p) => {
    const count = Math.min(Math.max(Math.round(n), 2), MAX_VERTICES);
    const positions = circleLayout(count);
    const vertices = positions.map((pos, i) => ({
      id: `v${i + 1}`,
      name: String.fromCharCode(65 + (i % 26)) + (i >= 26 ? Math.floor(i / 26) + 1 : ''),
      ...pos,
    }));
    const edges = [];
    for (let i = 0; i < count; i += 1) {
      for (let j = i + 1; j < count; j += 1) {
        if (Math.random() < p) edges.push([vertices[i].id, vertices[j].id]);
      }
    }
    setState({ vertices, edges, nextId: count + 1 });
    setSelected(null);
  }, []);

  const loadExample = useCallback((key) => {
    const example = EXAMPLES[key];
    if (!example) return;
    const idOf = {};
    const vertices = example.vertices.map((v, i) => {
      idOf[v.name] = `v${i + 1}`;
      return { id: `v${i + 1}`, name: v.name, x: v.x, y: v.y };
    });
    const edges = example.edges.map(([a, b]) => [idOf[a], idOf[b]]);
    setState({ vertices, edges, nextId: vertices.length + 1 });
    setSelected(null);
  }, []);

  /** The graph in the API's format: adjacency list of IDs, names, positions. */
  const toSpec = useCallback(() => {
    const adjacency = Object.fromEntries(state.vertices.map((v) => [v.id, []]));
    for (const [a, b] of state.edges) {
      adjacency[a].push(b);
      adjacency[b].push(a);
    }
    return {
      adjacency,
      names: Object.fromEntries(state.vertices.map((v) => [v.id, v.name])),
      layout: Object.fromEntries(state.vertices.map((v) => [v.id, { x: v.x, y: v.y }])),
    };
  }, [state]);

  const degree = useCallback((id) => state.edges.filter(([a, b]) => a === id || b === id).length, [state.edges]);

  return {
    vertices: state.vertices,
    edges: state.edges,
    byId,
    selected,
    setSelected,
    addVertex,
    removeVertex,
    renameVertex,
    moveVertex,
    addEdge,
    removeEdge,
    clear,
    randomGraph,
    loadExample,
    toSpec,
    degree,
  };
}
