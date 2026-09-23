import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { memo, useId, useMemo, useRef, useState } from 'react';
import INDIA_GEOMETRY from '../data/indiaGeometry';
import {
  ACTIVE_FILL,
  ACTIVE_RING,
  CONFLICT_RED,
  CONTEXT_FILL,
  NEIGHBOR_FILL,
  NEIGHBOR_RING,
  NEUTRAL_FILL,
  SELECT_RING,
  phaseTiming,
} from '../utils/constants';
import { colorFill, colorInk, edgeKey } from '../utils/helpers';

/*
 * Real state / UT boundaries, generated from GIS data by
 * tools/build_india_map.py and stored locally (no map service at runtime).
 *
 * This file draws SHAPES ONLY. Which states are adjacent always comes from
 * the backend graph (GET /api/graph/india). Regions are matched to graph
 * vertices through their state code (graph.labels[vertex] === region.id).
 */

const { width: MAP_W, height: MAP_H } = INDIA_GEOMETRY;
const EMPTY = new Set();

/*
 * Label positions that differ from the automatic anchor (pole of
 * inaccessibility). Regions too small for a label get one outside the
 * shape plus a leader line; geography is never distorted to make room.
 */
const LABEL_OVERRIDES = {
  DL: { x: 362, y: 316, leader: true },
  GA: { x: 158, y: 826, leader: true },
  SK: { x: 704, y: 334, leader: true },
  TR: { x: 772, y: 548, leader: true },
  MZ: { y: 508 },
  HR: { x: 292, y: 300 },
  KL: { x: 246, y: 1034, leader: true },
};

function boundsOf(path) {
  const nums = path.match(/-?\d+(\.\d+)?/g).map(Number);
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < nums.length; i += 2) {
    minX = Math.min(minX, nums[i]);
    maxX = Math.max(maxX, nums[i]);
    minY = Math.min(minY, nums[i + 1]);
    maxY = Math.max(maxY, nums[i + 1]);
  }
  return { minX, minY, maxX, maxY };
}

// Static per-region data, computed once.
const REGIONS = INDIA_GEOMETRY.regions.map((r) => {
  const [ax, ay] = r.anchor;
  const o = LABEL_OVERRIDES[r.id] ?? {};
  const b = boundsOf(r.path);
  return {
    ...r,
    anchorX: ax,
    anchorY: ay,
    labelX: o.x ?? ax,
    labelY: o.y ?? ay,
    leader: Boolean(o.leader),
    fontSize: Math.min(34, Math.max(24, Math.sqrt(r.area) * 0.19)),
    // Radius that lets a circle centered on the anchor cover the whole shape.
    revealRadius: Math.max(
      Math.hypot(ax - b.minX, ay - b.minY),
      Math.hypot(ax - b.maxX, ay - b.minY),
      Math.hypot(ax - b.minX, ay - b.maxY),
      Math.hypot(ax - b.maxX, ay - b.maxY),
    ),
  };
});
const REGION_BY_ID = Object.fromEntries(REGIONS.map((r) => [r.id, r]));

/** Static drop-shadow silhouette. Memoized so the SVG filter never re-renders. */
const Silhouette = memo(function Silhouette({ filterId }) {
  return (
    <g filter={`url(#${filterId})`} aria-hidden="true">
      {REGIONS.map((r) => (
        <path key={r.id} d={r.path} fill="#FFFFFF" />
      ))}
    </g>
  );
});

export default function IndiaMapSVG({
  graph,
  coloring = {},
  highlight = { active: null, neighbors: EMPTY, phase: 0, recent: null },
  selected = null,
  onSelect,
  conflicts = { vertices: EMPTY, edges: EMPTY },
  showEdges = false,
  phaseMs = 600,
  interactive = true,
}) {
  // Only the hovered region's id is state; the tooltip follows the pointer
  // through a ref, so moving the mouse inside a region causes no re-render.
  const [hoverId, setHoverId] = useState(null);
  const wrapRef = useRef(null);
  const tipRef = useRef(null);
  const tipPos = useRef({ x: 0, y: 0 });
  const uid = useId().replace(/:/g, '');
  const reduceMotion = useReducedMotion();
  const t = phaseTiming(phaseMs);

  // vertex name <-> region, joined through the state code.
  const { vertexOf, regionOf } = useMemo(() => {
    const vOf = {};
    const rOf = {};
    for (const v of graph.vertices) {
      const region = REGION_BY_ID[graph.labels[v]];
      if (region) {
        vOf[region.id] = v;
        rOf[v] = region;
      }
    }
    return { vertexOf: vOf, regionOf: rOf };
  }, [graph]);

  const animating = Boolean(highlight.active);
  const focus = highlight.active ?? selected;
  const focusNeighbors = useMemo(() => {
    if (highlight.active) return highlight.phase >= 1 ? highlight.neighbors : EMPTY;
    if (selected) return new Set(graph.adjacency[selected] ?? []);
    return EMPTY;
  }, [highlight, selected, graph]);
  const dimOthers = !animating && Boolean(selected);

  const select = (v) => interactive && onSelect?.(selected === v ? null : v);

  const showTip = (region, event) => {
    const rect = wrapRef.current.getBoundingClientRect();
    tipPos.current = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    if (tipRef.current) {
      tipRef.current.style.left = `${tipPos.current.x}px`;
      tipRef.current.style.top = `${tipPos.current.y}px`;
    }
    if (hoverId !== region.id) setHoverId(region.id);
  };
  const hideTip = () => setHoverId(null);

  const active = highlight.active ? regionOf[highlight.active] : null;
  const assigning = active && highlight.phase === 3 && coloring[highlight.active];
  const recent = highlight.recent ? regionOf[highlight.recent] : null;

  // Outline layer: drawn above every fill so thick borders are never covered.
  const outlines = [];
  for (const v of graph.vertices) {
    const region = regionOf[v];
    if (!region) continue;
    if (conflicts.vertices.has(v)) outlines.push({ v, region, kind: 'conflict' });
    else if (v === highlight.active) outlines.push({ v, region, kind: 'active' });
    else if (v === selected && !animating) outlines.push({ v, region, kind: 'selected' });
    else if (focusNeighbors.has(v)) outlines.push({ v, region, kind: 'neighbor' });
    else if (region.id === hoverId) outlines.push({ v, region, kind: 'hover' });
  }
  const outlineOrder = { hover: 0, neighbor: 1, selected: 2, active: 3, conflict: 4 };
  outlines.sort((a, b) => outlineOrder[a.kind] - outlineOrder[b.kind]);

  // showEdges: true = every edge, 'conflicts' = only the conflicting ones.
  const conflictEdgesOnly = showEdges === 'conflicts';

  const hoverRegion = hoverId ? REGION_BY_ID[hoverId] : null;
  const hoverVertex = hoverRegion ? vertexOf[hoverRegion.id] : null;

  return (
    <div className="map-wrap" ref={wrapRef}>
      <svg
        className="india-map"
        viewBox={`0 0 ${MAP_W} ${MAP_H}`}
        role="group"
        aria-label={`Map of India with ${graph.vertices.length} colorable regions`}
      >
        <defs>
          <filter id={`${uid}-shadow`} x="-5%" y="-5%" width="110%" height="110%">
            <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#1E2A4A" floodOpacity="0.16" />
          </filter>
          {assigning && !reduceMotion && (
            <clipPath id={`${uid}-reveal`}>
              <path d={active.path} />
            </clipPath>
          )}
        </defs>

        <rect width={MAP_W} height={MAP_H} fill="transparent" onClick={() => interactive && onSelect?.(null)} />
        <Silhouette filterId={`${uid}-shadow`} />

        {/* Fills */}
        <g className="map-fills">
          {REGIONS.map((region) => {
            const v = vertexOf[region.id];
            if (!v) {
              return (
                <path
                  key={region.id}
                  className="map-context"
                  d={region.path}
                  fill={CONTEXT_FILL}
                  stroke="#FFFFFF"
                  strokeWidth={1}
                  vectorEffect="non-scaling-stroke"
                  onPointerMove={(e) => showTip(region, e)}
                  onPointerLeave={hideTip}
                />
              );
            }
            const color = coloring[v];
            const isActive = v === highlight.active;
            const isNeighbor = focusNeighbors.has(v);
            const isConflict = conflicts.vertices.has(v);
            const related = v === focus || isNeighbor || isConflict;
            const fill = color
              ? colorFill(color)
              : isActive
                ? ACTIVE_FILL
                : isNeighbor && animating
                  ? NEIGHBOR_FILL
                  : NEUTRAL_FILL;
            // While the new color spreads through the region, the base fill
            // waits and switches only once the spreading circle covers it.
            const fillDelay = isActive && assigning && !reduceMotion ? t.fill : 0;

            return (
              <motion.path
                key={region.id}
                className={`map-state ${interactive ? 'interactive' : ''}`}
                d={region.path}
                stroke="#FFFFFF"
                strokeWidth={1.1}
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                initial={false}
                animate={{ fill, opacity: dimOthers && !related ? 0.42 : 1 }}
                transition={{
                  fill: { duration: fillDelay ? 0.12 : t.ui, delay: fillDelay },
                  opacity: { duration: 0.25 },
                }}
                role={interactive ? 'button' : undefined}
                tabIndex={interactive ? 0 : undefined}
                aria-label={`${v}, degree ${graph.adjacency[v].length}, ${color ? `color ${color}` : 'uncolored'}${isConflict ? ', in conflict' : ''}`}
                aria-pressed={interactive ? v === selected : undefined}
                onClick={() => select(v)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    select(v);
                  }
                }}
                onPointerMove={(e) => showTip(region, e)}
                onPointerLeave={hideTip}
              />
            );
          })}
        </g>

        {/* The new color spreads outward from the region's center. */}
        {assigning && !reduceMotion && (
          <motion.circle
            key={`reveal-${highlight.active}`}
            cx={active.anchorX}
            cy={active.anchorY}
            fill={colorFill(coloring[highlight.active])}
            clipPath={`url(#${uid}-reveal)`}
            initial={{ r: 0 }}
            animate={{ r: active.revealRadius }}
            transition={{ duration: t.fill, ease: [0.3, 0.7, 0.4, 1] }}
            pointerEvents="none"
          />
        )}

        {/* Soft halo in the assigned color that fades after assignment. */}
        {recent && coloring[highlight.recent] && !reduceMotion && (
          <motion.path
            key={`glow-${highlight.recent}`}
            d={recent.path}
            fill="none"
            stroke={colorFill(coloring[highlight.recent])}
            strokeWidth={9}
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            initial={{ opacity: 0.55 }}
            animate={{ opacity: 0 }}
            transition={{ duration: t.glow, delay: highlight.recent === highlight.active ? t.fill : 0 }}
            pointerEvents="none"
          />
        )}

        {/* Outlines for the current vertex, its neighbors, selection, and conflicts. */}
        <g pointerEvents="none">
          {outlines.map(({ v, region, kind }) => (
            <g key={`${kind}-${v}`} className={`map-outline ${kind}`}>
              {(kind === 'active' || kind === 'conflict') && (
                <path
                  className="outline-halo"
                  d={region.path}
                  fill="none"
                  stroke={kind === 'conflict' ? CONFLICT_RED : ACTIVE_RING}
                  strokeWidth={9}
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              )}
              <path
                d={region.path}
                fill="none"
                stroke={
                  kind === 'conflict'
                    ? CONFLICT_RED
                    : kind === 'active'
                      ? ACTIVE_RING
                      : kind === 'neighbor'
                        ? NEIGHBOR_RING
                        : kind === 'hover'
                          ? '#8391AD'
                          : SELECT_RING
                }
                strokeWidth={kind === 'hover' ? 1.6 : kind === 'neighbor' ? 2.2 : 2.8}
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            </g>
          ))}
        </g>

        {/* Optional overlay: the graph's edges drawn between region centers. */}
        {showEdges && (
          <g className="map-edges" pointerEvents="none">
            {graph.edges.map(([u, v]) => {
              const a = regionOf[u];
              const b = regionOf[v];
              if (!a || !b) return null;
              const isConflict = conflicts.edges.has(edgeKey(u, v));
              if (conflictEdgesOnly && !isConflict) return null;
              const checking =
                highlight.phase >= 1 &&
                highlight.phase <= 2 &&
                (u === highlight.active || v === highlight.active);
              return (
                <line
                  key={edgeKey(u, v)}
                  className={checking ? 'edge-flow' : undefined}
                  x1={a.anchorX}
                  y1={a.anchorY}
                  x2={b.anchorX}
                  y2={b.anchorY}
                  stroke={isConflict ? CONFLICT_RED : checking ? NEIGHBOR_RING : '#172033'}
                  strokeOpacity={isConflict || checking ? 0.95 : 0.35}
                  strokeWidth={isConflict || checking ? 2.6 : 1.3}
                  strokeDasharray={isConflict ? '6 4' : checking ? '5 5' : '3 3'}
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}
            {graph.vertices.map((v) =>
              regionOf[v] && (!conflictEdgesOnly || conflicts.vertices.has(v)) ? (
                <circle key={v} cx={regionOf[v].anchorX} cy={regionOf[v].anchorY} r={4} fill="#172033" opacity={0.55} />
              ) : null,
            )}
          </g>
        )}

        {/* Labels (state codes). Small regions get a leader line. */}
        <g className="map-labels" pointerEvents="none" aria-hidden="true">
          {graph.vertices.map((v) => {
            const region = regionOf[v];
            if (!region) return null;
            const color = coloring[v];
            const ink = region.leader ? '#172033' : color ? colorInk(color) : '#172033';
            const dimmed = dimOthers && v !== focus && !focusNeighbors.has(v) && !conflicts.vertices.has(v);
            return (
              <g key={v} opacity={dimmed ? 0.45 : 1} className="map-label-group">
                {region.leader && (
                  <>
                    <line
                      x1={region.anchorX}
                      y1={region.anchorY}
                      x2={region.labelX}
                      y2={region.labelY}
                      stroke="#5B6781"
                      strokeWidth={1}
                      vectorEffect="non-scaling-stroke"
                    />
                    <circle cx={region.anchorX} cy={region.anchorY} r={3.2} fill="#5B6781" />
                  </>
                )}
                <text
                  x={region.labelX}
                  y={region.labelY}
                  textAnchor="middle"
                  dy="0.35em"
                  fontSize={region.fontSize}
                  className={`map-label ${ink === '#FFFFFF' ? 'on-dark' : ''} ${region.leader ? 'leader' : ''}`}
                  fill={ink}
                >
                  {region.id}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      <AnimatePresence>
        {hoverRegion && (
          <motion.div
            ref={tipRef}
            className="map-tooltip"
            style={{ left: tipPos.current.x, top: tipPos.current.y }}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 2 }}
            transition={{ duration: 0.14 }}
            role="tooltip"
          >
            <strong>{hoverVertex ?? hoverRegion.name}</strong>
            {hoverVertex ? (
              <>
                <span>Degree: {graph.adjacency[hoverVertex]?.length ?? 0}</span>
                <span>
                  Color:{' '}
                  {coloring[hoverVertex] ? (
                    <>
                      <i className="tip-swatch" style={{ background: colorFill(coloring[hoverVertex]) }} />
                      {coloring[hoverVertex]}
                    </>
                  ) : (
                    'not assigned'
                  )}
                </span>
              </>
            ) : (
              <span>Union territory · not a graph vertex</span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
