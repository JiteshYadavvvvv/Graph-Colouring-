import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useRef, useState } from 'react';
import {
  ACTIVE_RING,
  CONFLICT_RED,
  NEIGHBOR_FILL,
  NEIGHBOR_RING,
  NEUTRAL_FILL,
} from '../utils/constants';
import { colorFill, edgeKey, slug } from '../utils/helpers';

/*
 * Stylized, hand-drawn geometry for each state (not GIS-accurate).
 *
 * This file contains SHAPES ONLY. Which states are adjacent comes from the
 * backend graph (GET /api/graph/india). The polygons were drawn so that two
 * shapes share a border segment exactly when the backend lists them as
 * neighbors, which was checked with a script during development.
 */
const SHAPES = {
  Punjab: [[135, 140], [130, 100], [200, 70], [215, 110], [205, 140], [170, 160]],
  'Himachal Pradesh': [[200, 70], [240, 40], [285, 60], [275, 105], [240, 120], [215, 110]],
  Uttarakhand: [[285, 60], [320, 80], [345, 115], [330, 150], [290, 150], [275, 105]],
  Haryana: [[215, 110], [240, 120], [250, 150], [255, 200], [225, 215], [205, 185], [205, 140]],
  Rajasthan: [[70, 220], [100, 170], [135, 140], [170, 160], [205, 140], [205, 185], [225, 215], [255, 200], [280, 250], [270, 290], [230, 310], [180, 300], [140, 290], [100, 260]],
  'Uttar Pradesh': [[240, 120], [275, 105], [290, 150], [330, 150], [360, 175], [410, 200], [420, 240], [400, 270], [360, 280], [330, 300], [300, 280], [280, 250], [255, 200], [250, 150]],
  Bihar: [[410, 200], [460, 210], [490, 225], [480, 255], [440, 265], [400, 270], [420, 240]],
  'West Bengal': [[495, 180], [515, 185], [515, 240], [525, 290], [510, 330], [480, 320], [470, 300], [480, 255], [490, 225]],
  Jharkhand: [[360, 280], [400, 270], [440, 265], [480, 255], [470, 300], [440, 320], [400, 330], [370, 310]],
  Odisha: [[400, 330], [440, 320], [470, 300], [480, 320], [470, 360], [440, 400], [400, 420], [370, 410], [390, 370]],
  Chhattisgarh: [[330, 300], [360, 280], [370, 310], [400, 330], [390, 370], [370, 410], [345, 420], [320, 390], [315, 340]],
  'Madhya Pradesh': [[230, 310], [270, 290], [280, 250], [300, 280], [330, 300], [315, 340], [290, 350], [240, 350], [210, 330]],
  Gujarat: [[100, 260], [140, 290], [180, 300], [230, 310], [210, 330], [200, 360], [170, 380], [130, 350], [90, 330], [60, 290]],
  Maharashtra: [[200, 360], [210, 330], [240, 350], [290, 350], [315, 340], [320, 390], [300, 420], [260, 440], [230, 450], [205, 440], [195, 400]],
  Goa: [[205, 440], [230, 450], [225, 470], [205, 465]],
  Telangana: [[320, 390], [345, 420], [360, 450], [330, 470], [300, 460], [300, 420]],
  'Andhra Pradesh': [[345, 420], [370, 410], [400, 420], [390, 450], [370, 490], [340, 520], [320, 540], [300, 530], [310, 500], [330, 470], [360, 450]],
  Karnataka: [[230, 450], [260, 440], [300, 420], [300, 460], [330, 470], [310, 500], [300, 530], [270, 540], [245, 520], [225, 470]],
  Kerala: [[245, 520], [270, 540], [285, 590], [275, 620], [255, 580]],
  'Tamil Nadu': [[300, 530], [320, 540], [330, 580], [310, 620], [285, 640], [275, 620], [285, 590], [270, 540]],
};

// Label anchor points (centroid, hand-adjusted for thin shapes).
const LABEL_AT = {
  Punjab: [172, 118], 'Himachal Pradesh': [243, 80], Uttarakhand: [308, 112], Haryana: [228, 168],
  Rajasthan: [170, 228], 'Uttar Pradesh': [330, 212], Bihar: [447, 237], 'West Bengal': [501, 268],
  Jharkhand: [421, 294], Odisha: [432, 364], Chhattisgarh: [355, 353], 'Madhya Pradesh': [272, 316],
  Gujarat: [140, 322], Maharashtra: [255, 395], Goa: [216, 457], Telangana: [327, 436],
  'Andhra Pradesh': [360, 480], Karnataka: [272, 484], Kerala: [266, 575], 'Tamil Nadu': [301, 585],
};

const VIEWBOX = '40 25 510 635';
const EMPTY = new Set();

const toPath = (points) => `M${points.map(([x, y]) => `${x} ${y}`).join(' L')} Z`;

export default function IndiaMapSVG({
  graph,
  coloring = {},
  highlight = { active: null, neighbors: EMPTY, phase: 0 },
  selected = null,
  onSelect,
  conflicts = { vertices: EMPTY, edges: EMPTY },
  showEdges = false,
}) {
  const [hover, setHover] = useState(null);
  const wrapRef = useRef(null);

  const focus = highlight.active ?? selected;
  const focusNeighbors = useMemo(() => {
    if (highlight.active) return highlight.neighbors;
    if (selected) return new Set(graph.adjacency[selected] ?? []);
    return EMPTY;
  }, [highlight, selected, graph]);

  // Only states that exist in the backend graph AND have geometry are drawn.
  const states = graph.vertices.filter((v) => SHAPES[v]);

  // Paint emphasized states last so their thick outlines are not covered.
  const drawOrder = useMemo(() => {
    const weight = (v) =>
      (conflicts.vertices.has(v) ? 4 : 0) + (v === focus ? 3 : 0) + (focusNeighbors.has(v) ? 1 : 0);
    return [...states].sort((a, b) => weight(a) - weight(b));
  }, [states, conflicts.vertices, focus, focusNeighbors]);

  const updateHover = (state, event) => {
    const rect = wrapRef.current.getBoundingClientRect();
    setHover({ state, x: event.clientX - rect.left, y: event.clientY - rect.top });
  };

  return (
    <div className="map-wrap" ref={wrapRef}>
      <svg
        className="india-map"
        viewBox={VIEWBOX}
        role="img"
        aria-label="Stylized map of Indian states"
      >
        <defs>
          <filter id="land-shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#1E2A4A" floodOpacity="0.14" />
          </filter>
          <filter id="conflict-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
          <filter id="active-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
        </defs>

        <rect x="40" y="25" width="510" height="635" fill="transparent" onClick={() => onSelect?.(null)} />

        <g filter="url(#land-shadow)">
          {drawOrder.map((state) => {
            const color = coloring[state];
            const isActive = state === highlight.active;
            const isSelected = state === selected;
            const isNeighbor = focusNeighbors.has(state);
            const isConflict = conflicts.vertices.has(state);
            const fill = color
              ? colorFill(color)
              : isNeighbor && highlight.active
                ? NEIGHBOR_FILL
                : isActive
                  ? '#EEEAFE'
                  : NEUTRAL_FILL;
            const stroke = isConflict
              ? CONFLICT_RED
              : isActive
                ? ACTIVE_RING
                : isSelected
                  ? '#172033'
                  : isNeighbor
                    ? NEIGHBOR_RING
                    : '#FFFFFF';
            const d = toPath(SHAPES[state]);

            return (
              <g
                key={state}
                className="map-state"
                role="button"
                tabIndex={0}
                aria-label={`${state}${color ? `, color ${color}` : ', uncolored'}${isConflict ? ', in conflict' : ''}`}
                aria-pressed={isSelected}
                onClick={() => onSelect?.(isSelected ? null : state)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect?.(isSelected ? null : state);
                  }
                }}
                onPointerMove={(e) => updateHover(state, e)}
                onPointerLeave={() => setHover((h) => (h?.state === state ? null : h))}
              >
                {(isConflict || isActive) && (
                  <motion.path
                    d={d}
                    fill="none"
                    stroke={isConflict ? CONFLICT_RED : ACTIVE_RING}
                    strokeWidth={10}
                    filter={`url(#${isConflict ? 'conflict' : 'active'}-glow)`}
                    animate={{ opacity: [0.85, 0.25, 0.85] }}
                    transition={{ duration: isConflict ? 1.1 : 1.4, repeat: Infinity }}
                    pointerEvents="none"
                  />
                )}
                <motion.path
                  id={`state-${slug(state)}`}
                  data-name={state}
                  d={d}
                  strokeLinejoin="round"
                  initial={false}
                  animate={{
                    fill,
                    stroke,
                    strokeWidth: isConflict || isActive ? 3.5 : isSelected ? 3 : isNeighbor ? 2.6 : 1.5,
                  }}
                  transition={{ duration: 0.55, ease: 'easeOut' }}
                />
                {isActive && highlight.phase === 3 && (
                  // Brief white flash when the color is assigned.
                  <motion.path
                    key={`flash-${color}`}
                    d={d}
                    fill="#FFFFFF"
                    initial={{ opacity: 0.75 }}
                    animate={{ opacity: 0 }}
                    transition={{ duration: 0.6 }}
                    pointerEvents="none"
                  />
                )}
              </g>
            );
          })}
        </g>

        {/* Optional overlay: the graph edges drawn between state centers. */}
        {showEdges && (
          <g className="map-edges" pointerEvents="none">
            {graph.edges.map(([u, v]) => {
              if (!LABEL_AT[u] || !LABEL_AT[v]) return null;
              const isConflict = conflicts.edges.has(edgeKey(u, v));
              return (
                <line
                  key={edgeKey(u, v)}
                  x1={LABEL_AT[u][0]}
                  y1={LABEL_AT[u][1]}
                  x2={LABEL_AT[v][0]}
                  y2={LABEL_AT[v][1]}
                  stroke={isConflict ? CONFLICT_RED : '#172033'}
                  strokeOpacity={isConflict ? 0.95 : 0.4}
                  strokeWidth={isConflict ? 3 : 1.4}
                  strokeDasharray={isConflict ? '6 4' : '3 3'}
                />
              );
            })}
          </g>
        )}

        {/* Labels */}
        <g pointerEvents="none">
          {states.map((state) => {
            const [x, y] = LABEL_AT[state];
            const colored = Boolean(coloring[state]);
            return (
              <text
                key={state}
                x={x}
                y={y}
                textAnchor="middle"
                dy="0.35em"
                className={`map-label ${colored ? 'on-color' : ''}`}
                fontSize={state === 'Goa' ? 9 : 12}
              >
                {graph.labels[state]}
              </text>
            );
          })}
        </g>

        <text x="545" y="652" textAnchor="end" className="map-note">
          Stylized · not to scale
        </text>
      </svg>

      <AnimatePresence>
        {hover && (
          <motion.div
            className="map-tooltip"
            style={{ left: hover.x, top: hover.y }}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
          >
            <strong>{hover.state}</strong>
            <span>
              Degree {graph.adjacency[hover.state]?.length ?? 0}
              {coloring[hover.state] ? ` · Color ${coloring[hover.state]}` : ' · uncolored'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Names of backend vertices that have no drawable shape (should be empty). */
export function missingShapes(graph) {
  return graph.vertices.filter((v) => !SHAPES[v]);
}
