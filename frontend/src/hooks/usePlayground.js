import { useCallback, useMemo, useState } from 'react';
import { EXAMPLES } from '../content/examples';

/** Size of the editor canvas (SVG units). */
export const CANVAS = { width: 800, height: 540 };
export const MAX_VERTICES = 40; // enough for the India dataset (31 regions)
export const MAX_NAME_LENGTH = 24;
const MIN_GAP = 64; // closest two vertices may be placed automatically
const MARGIN = 48;

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
  for (let gap = MIN_GAP; gap > 20; gap -= 8) {
    for (let y = MARGIN; y <= CANVAS.height - MARGIN; y += gap) {
      for (let x = MARGIN; x <= CANVAS.width - MARGIN; x += gap) {
        if (vertices.every((v) => Math.hypot(v.x - x, v.y - y) >= gap)) return { x, y };
      }
    }
  }
  return { x: CANVAS.width / 2, y: CANVAS.height / 2 };
}

function circleLayout(n) {
  const cx = CANVAS.width / 2;
  const cy = CANVAS.height / 2;
  const radius = Math.min(cx, cy) - 60;
  return Array.from({ length: n }, (_, i) => ({
    x: Math.round(cx + radius * Math.cos(-Math.PI / 2 + (2 * Math.PI * i) / n)),
    y: Math.round(cy + radius * Math.sin(-Math.PI / 2 + (2 * Math.PI * i) / n)),
  }));
}

/** Scale and center a set of points into the canvas, keeping their proportions. */
function fitToCanvas(points) {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const w = Math.max(...xs) - minX || 1;
  const h = Math.max(...ys) - minY || 1;
  const scale = Math.min((CANVAS.width - 2 * MARGIN) / w, (CANVAS.height - 2 * MARGIN) / h);
  const offX = (CANVAS.width - w * scale) / 2;
  const offY = (CANVAS.height - h * scale) / 2;
  return points.map((p) => ({ x: Math.round(offX + (p.x - minX) * scale), y: Math.round(offY + (p.y - minY) * scale) }));
}

const EMPTY = { vertices: [], edges: [], nextId: 1, version: 0, origin: { kind: 'custom', title: 'Custom Graph' }, originVersion: 0, runVersion: -1 };

/**
 * Editable graph of the Graph Playground. Vertices have a stable ID that
 * never changes ("v1", "v2", … or the dataset's own IDs such as "IN-MH"),
 * a display name that can be renamed, and an optional short label.
 * Every operation validates its input and returns an error message (or null),
 * so an invalid graph is never built: no self-loops, no duplicate edges, no
 * duplicate names, no dangling edges.
 *
 * `version` counts structural changes (vertices, edges, names; not moves),
 * so a coloring computed for an older version is never shown as current.
 */
export function usePlayground() {
  const [state, setState] = useState(EMPTY);
  const [selected, setSelected] = useState(null);

  const byId = useMemo(() => Object.fromEntries(state.vertices.map((v) => [v.id, v])), [state.vertices]);
  const edgeSet = useMemo(() => new Set(state.edges.map(([a, b]) => pairKey(a, b))), [state.edges]);

  const change = (updater) => setState((s) => ({ ...updater(s), version: s.version + 1 }));

  /** Replace the whole graph, remembering where it came from. */
  const replace = (vertices, edges, origin) => {
    setState((s) => {
      const version = s.version + 1;
      let nextId = 1;
      while (vertices.some((v) => v.id === `v${nextId}`)) nextId += 1;
      return { vertices, edges, nextId, version, origin, originVersion: version, runVersion: -1 };
    });
    setSelected(null);
  };

  const addVertex = useCallback(
    (position) => {
      if (state.vertices.length >= MAX_VERTICES) return `The Playground holds at most ${MAX_VERTICES} vertices.`;
      let n = state.nextId;
      while (byId[`v${n}`]) n += 1;
      const id = `v${n}`;
      const spot = position ?? freeSpot(state.vertices);
      const vertex = {
        id,
        name: nextFreeName(state.vertices),
        x: Math.round(Math.min(Math.max(spot.x, 24), CANVAS.width - 24)),
        y: Math.round(Math.min(Math.max(spot.y, 24), CANVAS.height - 24)),
      };
      change((s) => ({ ...s, vertices: [...s.vertices, vertex], nextId: n + 1 }));
      setSelected(id);
      return null;
    },
    [state, byId],
  );

  const removeVertex = useCallback((id) => {
    change((s) => ({
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
      // A renamed vertex gets a label derived from its new name.
      change((s) => ({ ...s, vertices: s.vertices.map((v) => (v.id === id ? { ...v, name, label: undefined } : v)) }));
      return null;
    },
    [state.vertices],
  );

  // Moving a vertex changes the drawing, not the graph, so it keeps the version.
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
      change((s) => ({ ...s, edges: [...s.edges, [a, b]] }));
      return null;
    },
    [byId, edgeSet],
  );

  const removeEdge = useCallback((a, b) => {
    const key = pairKey(a, b);
    change((s) => ({ ...s, edges: s.edges.filter(([x, y]) => pairKey(x, y) !== key) }));
  }, []);

  const clear = useCallback(() => replace([], [], { kind: 'custom', title: 'Custom Graph' }), []);

  /** Random graph G(n, p): n vertices on a circle, each pair joined with probability p. */
  const randomGraph = useCallback((n, p) => {
    const count = Math.min(Math.max(Math.round(n), 2), MAX_VERTICES);
    const vertices = circleLayout(count).map((pos, i) => ({
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
    replace(vertices, edges, { kind: 'random', title: `Random graph G(${count}, ${p})` });
  }, []);

  /** One of the small application examples (content/examples.js). */
  const loadExample = useCallback((key) => {
    const example = EXAMPLES[key];
    if (!example) return;
    const positions = fitToCanvas(example.vertices);
    const idOf = {};
    const vertices = example.vertices.map((v, i) => {
      idOf[v.name] = `v${i + 1}`;
      return { id: `v${i + 1}`, name: v.name, ...positions[i] };
    });
    const edges = example.edges.map(([a, b]) => [idOf[a], idOf[b]]);
    replace(vertices, edges, { kind: 'example', key, title: example.title, hint: example.hint });
  }, []);

  /** A built-in dataset, exactly as served by GET /api/graph/{key}. */
  const loadDataset = useCallback((graph) => {
    const positions = fitToCanvas(graph.vertices.map((v) => graph.layout[v]));
    const vertices = graph.vertices.map((v, i) => ({
      id: v,
      name: graph.names?.[v] ?? v,
      label: graph.labels?.[v],
      ...positions[i],
    }));
    replace(vertices, graph.edges.map(([a, b]) => [a, b]), {
      kind: 'dataset',
      key: graph.key,
      title: graph.name,
      description: graph.description,
      characteristics: graph.characteristics,
    });
  }, []);

  /** Remember that the backend colored the graph as it is now. */
  const markRun = useCallback(() => setState((s) => ({ ...s, runVersion: s.version })), []);

  /** The graph in the API's format: adjacency list of IDs, names, labels, positions. */
  const toSpec = useCallback(() => {
    const adjacency = Object.fromEntries(state.vertices.map((v) => [v.id, []]));
    for (const [a, b] of state.edges) {
      adjacency[a].push(b);
      adjacency[b].push(a);
    }
    const labels = Object.fromEntries(state.vertices.filter((v) => v.label).map((v) => [v.id, v.label]));
    return {
      adjacency,
      names: Object.fromEntries(state.vertices.map((v) => [v.id, v.name])),
      labels: Object.keys(labels).length ? labels : undefined,
      layout: Object.fromEntries(state.vertices.map((v) => [v.id, { x: v.x, y: v.y }])),
    };
  }, [state]);

  const degree = useCallback((id) => state.edges.filter(([a, b]) => a === id || b === id).length, [state.edges]);

  return {
    vertices: state.vertices,
    edges: state.edges,
    version: state.version,
    origin: state.origin,
    unmodified: state.version === state.originVersion,
    colored: state.runVersion === state.version,
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
    loadDataset,
    markRun,
    toSpec,
    degree,
  };
}
