import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ACTIVE_FILL,
  ACTIVE_RING,
  CONFLICT_RED,
  NEIGHBOR_FILL,
  NEIGHBOR_RING,
  NEUTRAL_FILL,
  SELECT_RING,
  phaseTiming,
} from '../utils/constants';
import { colorFill, colorInk, edgeKey, layoutViewBox } from '../utils/helpers';

const EMPTY = new Set();

function initialPositions(graph) {
  return Object.fromEntries(graph.vertices.map((v) => [v, { ...graph.layout[v] }]));
}

/**
 * Interactive node-link diagram. Node positions start from the backend
 * layout, and users can drag nodes with a mouse, pen, or touch.
 *
 * Focus rules (shared with the map):
 *   - while the algorithm runs, the current vertex and the neighbors it is
 *     checking are highlighted, and only the edges being checked animate;
 *   - otherwise the hovered or selected vertex is in focus, its edges and
 *     neighbors are emphasized, and unrelated vertices are muted.
 */
export default function GraphSVG({
  graph,
  coloring = {},
  highlight = { active: null, neighbors: EMPTY, phase: 0, recent: null },
  selected = null,
  onSelect,
  conflicts = { vertices: EMPTY, edges: EMPTY },
  nodeRadius,
  draggable = true,
  phaseMs = 600,
  className = '',
  ariaLabel,
}) {
  const r = nodeRadius ?? (graph.vertices.length > 10 ? 17 : 24);
  const box = useMemo(() => layoutViewBox(graph.layout, r + 26), [graph.layout, r]);
  const [positions, setPositions] = useState(() => initialPositions(graph));
  const [hovered, setHovered] = useState(null);
  const [moved, setMoved] = useState(false);
  const svgRef = useRef(null);
  const drag = useRef(null);
  const reduceMotion = useReducedMotion();
  const t = phaseTiming(phaseMs);

  // A different dataset means a different set of nodes: start from its layout.
  useEffect(() => {
    setPositions(initialPositions(graph));
    setMoved(false);
  }, [graph]);

  const animating = Boolean(highlight.active);
  // During the animation the current vertex is in focus; otherwise hover, then selection.
  const focus = highlight.active ?? (drag.current?.moved ? null : hovered) ?? selected;
  const focusNeighbors = useMemo(() => {
    if (highlight.active) return highlight.phase >= 1 ? highlight.neighbors : EMPTY;
    if (focus) return new Set(graph.adjacency[focus] ?? []);
    return EMPTY;
  }, [highlight, focus, graph]);
  const dimOthers = !animating && Boolean(focus);
  const checkingEdges = animating && highlight.phase >= 1 && highlight.phase <= 2;

  const toSvgPoint = (event) => {
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  };

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const handlePointerDown = (vertex, event) => {
    if (event.button !== undefined && event.button !== 0) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const p = toSvgPoint(event);
    drag.current = {
      vertex,
      dx: positions[vertex].x - p.x,
      dy: positions[vertex].y - p.y,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
    };
  };

  const handlePointerMove = (event) => {
    const d = drag.current;
    if (!d || !draggable) return;
    if (!d.moved && Math.hypot(event.clientX - d.startX, event.clientY - d.startY) < 4) return;
    d.moved = true;
    const p = toSvgPoint(event);
    const x = clamp(p.x + d.dx, box.x + r, box.x + box.w - r);
    const y = clamp(p.y + d.dy, box.y + r, box.y + box.h - r);
    setPositions((prev) => ({ ...prev, [d.vertex]: { x, y } }));
    setMoved(true);
  };

  const handlePointerUp = () => {
    const d = drag.current;
    drag.current = null;
    if (d && !d.moved) onSelect?.(selected === d.vertex ? null : d.vertex);
  };

  // Draw the current / selected vertex and conflicts last so their rings sit
  // on top. Hover is deliberately ignored here: re-ordering the element under
  // the pointer would make the browser fire spurious enter/leave events.
  const pinned = highlight.active ?? selected;
  const drawOrder = useMemo(() => {
    const pinnedNeighbors = new Set(pinned ? graph.adjacency[pinned] ?? [] : []);
    const weight = (v) =>
      (conflicts.vertices.has(v) ? 4 : 0) + (v === pinned ? 3 : 0) + (pinnedNeighbors.has(v) ? 1 : 0);
    return [...graph.vertices].sort((a, b) => weight(a) - weight(b));
  }, [graph, conflicts.vertices, pinned]);

  const hoveredPos = hovered && positions[hovered];
  const tipText = hovered
    ? `${hovered} · degree ${graph.adjacency[hovered]?.length ?? 0} · ${coloring[hovered] ? `Color ${coloring[hovered]}` : 'uncolored'}`
    : '';
  const tipWidth = tipText.length * 6.6 + 22;
  const tipX = hoveredPos ? clamp(hoveredPos.x, box.x + tipWidth / 2 + 4, box.x + box.w - tipWidth / 2 - 4) : 0;
  const tipAbove = hoveredPos ? hoveredPos.y - r - 18 > box.y + 14 : true;

  return (
    <div className={`graph-svg-wrap ${className}`}>
      <svg
        ref={svgRef}
        className="graph-svg"
        viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`}
        role="group"
        aria-label={ariaLabel ?? `Graph with ${graph.vertices.length} vertices and ${graph.edges.length} edges`}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <defs>
          <pattern id="graph-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="#DCE2EC" />
          </pattern>
        </defs>
        <rect
          x={box.x}
          y={box.y}
          width={box.w}
          height={box.h}
          fill="url(#graph-grid)"
          onClick={() => onSelect?.(null)}
        />

        {/* Edges */}
        <g>
          {graph.edges.map(([u, v]) => {
            const a = positions[u];
            const b = positions[v];
            if (!a || !b) return null;
            const key = edgeKey(u, v);
            const isConflict = conflicts.edges.has(key);
            const touchesFocus =
              (u === focus && focusNeighbors.has(v)) || (v === focus && focusNeighbors.has(u));
            const checking = checkingEdges && touchesFocus;
            const faded = dimOthers && !touchesFocus && !isConflict;
            return (
              <line
                key={key}
                className={`graph-edge ${checking && !reduceMotion ? 'edge-flow' : ''}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                strokeLinecap="round"
                strokeDasharray={isConflict ? '7 5' : checking ? '6 5' : undefined}
                style={{
                  stroke: isConflict ? CONFLICT_RED : checking ? NEIGHBOR_RING : touchesFocus ? '#3157D5' : '#B8C2D6',
                  strokeWidth: isConflict ? 4 : touchesFocus ? 3 : 1.6,
                  opacity: faded ? 0.18 : 1,
                }}
              />
            );
          })}
        </g>

        {/* Nodes */}
        <g>
          {drawOrder.map((v) => {
            const pos = positions[v];
            if (!pos) return null;
            const color = coloring[v];
            const isActive = v === highlight.active;
            const isSelected = v === selected;
            const isHovered = v === hovered;
            const isNeighbor = focusNeighbors.has(v);
            const isConflict = conflicts.vertices.has(v);
            const faded = dimOthers && v !== focus && !isNeighbor && !isConflict;
            const justAssigned = isActive && highlight.phase === 3 && color;
            const fill = color
              ? colorFill(color)
              : isActive
                ? ACTIVE_FILL
                : isNeighbor && animating
                  ? NEIGHBOR_FILL
                  : NEUTRAL_FILL;
            const stroke = isConflict
              ? CONFLICT_RED
              : isActive
                ? ACTIVE_RING
                : isSelected
                  ? SELECT_RING
                  : isNeighbor
                    ? NEIGHBOR_RING
                    : '#FFFFFF';

            return (
              <g
                key={v}
                transform={`translate(${pos.x} ${pos.y})`}
                className={`graph-node ${draggable ? 'draggable' : ''}`}
                role="button"
                tabIndex={0}
                aria-label={`${v}, degree ${graph.adjacency[v].length}, ${color ? `color ${color}` : 'uncolored'}${isConflict ? ', in conflict' : ''}`}
                aria-pressed={isSelected}
                onPointerDown={(e) => handlePointerDown(v, e)}
                onPointerEnter={() => setHovered(v)}
                onPointerLeave={() => setHovered((h) => (h === v ? null : h))}
                onFocus={() => setHovered(v)}
                onBlur={() => setHovered((h) => (h === v ? null : h))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect?.(isSelected ? null : v);
                  }
                }}
                style={{ opacity: faded ? 0.32 : 1 }}
              >
                {(isConflict || isActive) && (
                  <circle
                    className={isConflict ? 'node-halo conflict' : 'node-halo active'}
                    r={r + 7}
                    fill={isConflict ? CONFLICT_RED : ACTIVE_RING}
                  />
                )}
                {justAssigned && !reduceMotion && (
                  <motion.circle
                    key={`ripple-${color}`}
                    r={r}
                    fill="none"
                    stroke={fill}
                    strokeWidth={4}
                    initial={{ scale: 1, opacity: 0.9 }}
                    animate={{ scale: 2, opacity: 0 }}
                    transition={{ duration: t.glow, delay: t.fill * 0.5 }}
                  />
                )}
                <motion.g
                  initial={false}
                  animate={{ scale: isActive ? 1.16 : isHovered ? 1.12 : isSelected ? 1.08 : 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <motion.circle
                    r={r}
                    initial={false}
                    animate={{ fill }}
                    transition={{ duration: justAssigned ? t.fill : t.ui }}
                    stroke={stroke}
                    strokeWidth={isActive || isConflict || isSelected ? 3.5 : isNeighbor ? 3 : 2}
                    className="node-circle"
                  />
                  <text
                    className={`node-label ${color && colorInk(color) === '#FFFFFF' ? 'on-dark' : ''}`}
                    textAnchor="middle"
                    dy="0.35em"
                    fontSize={r * 0.72}
                    fill={color ? colorInk(color) : '#172033'}
                  >
                    {graph.labels[v] ?? v}
                  </text>
                </motion.g>
              </g>
            );
          })}
        </g>

        {/* Hover tooltip with the full vertex name */}
        <AnimatePresence>
          {hoveredPos && (
            <motion.g
              key={hovered}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              pointerEvents="none"
              transform={`translate(${tipX} ${tipAbove ? hoveredPos.y - r - 18 : hoveredPos.y + r + 26})`}
            >
              <rect x={-tipWidth / 2} y={-15} width={tipWidth} height={25} rx={7} fill="#172033" opacity={0.94} />
              <text className="tooltip-text" textAnchor="middle" dy="0.1em" fontSize="12" fill="#fff">
                {tipText}
              </text>
            </motion.g>
          )}
        </AnimatePresence>
      </svg>

      {draggable && moved && (
        <button
          className="btn btn-ghost btn-sm layout-reset"
          onClick={() => {
            setPositions(initialPositions(graph));
            setMoved(false);
          }}
        >
          Reset layout
        </button>
      )}
    </div>
  );
}
