import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ACTIVE_RING,
  CONFLICT_RED,
  NEIGHBOR_FILL,
  NEIGHBOR_RING,
  NEUTRAL_FILL,
} from '../utils/constants';
import { colorFill, edgeKey, layoutViewBox } from '../utils/helpers';

const EMPTY = new Set();

function initialPositions(graph) {
  return Object.fromEntries(graph.vertices.map((v) => [v, { ...graph.layout[v] }]));
}

/**
 * Interactive node-link diagram. Node positions start from the backend
 * layout, and users can drag nodes with a mouse, pen, or touch.
 */
export default function GraphSVG({
  graph,
  coloring = {},
  highlight = { active: null, neighbors: EMPTY, phase: 0 },
  selected = null,
  onSelect,
  conflicts = { vertices: EMPTY, edges: EMPTY },
  nodeRadius,
  draggable = true,
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

  // A different dataset means a different set of nodes: start from its layout.
  useEffect(() => {
    setPositions(initialPositions(graph));
    setMoved(false);
  }, [graph]);

  // During the animation the current vertex is in focus; otherwise the selection is.
  const focus = highlight.active ?? selected;
  const focusNeighbors = useMemo(() => {
    if (highlight.active) return highlight.neighbors;
    if (selected) return new Set(graph.adjacency[selected] ?? []);
    return EMPTY;
  }, [highlight, selected, graph]);
  const dimOthers = !highlight.active && Boolean(selected);

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

  // Draw focused vertices last so their rings sit on top.
  const drawOrder = useMemo(() => {
    const weight = (v) =>
      (conflicts.vertices.has(v) ? 4 : 0) + (v === focus ? 3 : 0) + (focusNeighbors.has(v) ? 1 : 0);
    return [...graph.vertices].sort((a, b) => weight(a) - weight(b));
  }, [graph.vertices, conflicts.vertices, focus, focusNeighbors]);

  const hoveredPos = hovered && positions[hovered];
  const tipText = hovered
    ? `${hovered} · deg ${graph.adjacency[hovered]?.length ?? 0}${coloring[hovered] ? ` · Color ${coloring[hovered]}` : ''}`
    : '';
  const tipWidth = tipText.length * 6.7 + 20;

  return (
    <div className={`graph-svg-wrap ${className}`}>
      <svg
        ref={svgRef}
        className="graph-svg"
        viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`}
        role="img"
        aria-label={ariaLabel ?? `Graph with ${graph.vertices.length} vertices and ${graph.edges.length} edges`}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <defs>
          <pattern id="graph-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="#D9DFEA" />
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
            const faded = dimOthers && !touchesFocus && !isConflict;
            return (
              <motion.line
                key={key}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                strokeLinecap="round"
                strokeDasharray={isConflict ? '7 5' : undefined}
                initial={false}
                animate={{
                  stroke: isConflict ? CONFLICT_RED : touchesFocus ? (highlight.active ? NEIGHBOR_RING : '#3157D5') : '#B8C2D6',
                  strokeWidth: isConflict ? 4 : touchesFocus ? 3.2 : 1.6,
                  opacity: faded ? 0.25 : 1,
                }}
                transition={{ duration: 0.25 }}
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
            const isNeighbor = focusNeighbors.has(v);
            const isConflict = conflicts.vertices.has(v);
            const faded = dimOthers && !isSelected && !isNeighbor && !isConflict;
            const justAssigned = isActive && highlight.phase === 3;
            const fill = color ? colorFill(color) : isNeighbor && highlight.active ? NEIGHBOR_FILL : isActive ? '#EEEAFE' : NEUTRAL_FILL;
            const stroke = isConflict
              ? CONFLICT_RED
              : isActive
                ? ACTIVE_RING
                : isSelected
                  ? '#172033'
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
                aria-label={`${v}${color ? `, color ${color}` : ', uncolored'}, degree ${graph.adjacency[v].length}`}
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
                style={{ opacity: faded ? 0.35 : 1 }}
              >
                {isConflict && (
                  <motion.circle
                    r={r + 7}
                    fill="none"
                    stroke={CONFLICT_RED}
                    strokeWidth={3}
                    animate={{ opacity: [0.9, 0.2, 0.9], scale: [1, 1.18, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  />
                )}
                {isActive && (
                  <motion.circle
                    r={r + 6}
                    fill="none"
                    stroke={ACTIVE_RING}
                    strokeWidth={3}
                    animate={{ opacity: [0.8, 0.15, 0.8], scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.1, repeat: Infinity }}
                  />
                )}
                {justAssigned && (
                  <motion.circle
                    key={`ripple-${color}`}
                    r={r}
                    fill="none"
                    stroke={fill}
                    strokeWidth={4}
                    initial={{ scale: 1, opacity: 0.9 }}
                    animate={{ scale: 2, opacity: 0 }}
                    transition={{ duration: 0.8 }}
                  />
                )}
                <motion.circle
                  r={r}
                  initial={false}
                  animate={{
                    fill,
                    stroke,
                    strokeWidth: isActive || isConflict || isSelected ? 3.5 : isNeighbor ? 3 : 2,
                    scale: isActive ? 1.14 : isSelected ? 1.08 : 1,
                  }}
                  transition={{ duration: 0.45 }}
                  style={{ filter: 'drop-shadow(0 2px 3px rgba(23,32,51,0.18))' }}
                />
                <text
                  className="node-label"
                  textAnchor="middle"
                  dy="0.35em"
                  fontSize={r * 0.72}
                  fill={color ? '#FFFFFF' : '#172033'}
                >
                  {graph.labels[v] ?? v}
                </text>
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
              pointerEvents="none"
              transform={`translate(${hoveredPos.x} ${hoveredPos.y - r - 16})`}
            >
              <rect x={-tipWidth / 2} y={-15} width={tipWidth} height={24} rx={7} fill="#172033" opacity={0.92} />
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
