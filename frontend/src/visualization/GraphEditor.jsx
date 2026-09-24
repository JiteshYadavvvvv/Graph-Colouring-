import { useRef, useState } from 'react';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { CANVAS } from '../hooks/usePlayground';

/** Same rule as the backend's node labels: initials of several words, else 3 letters. */
function shortLabel(name) {
  const words = name.split(' ');
  return words.length > 1 ? words.slice(0, 3).map((w) => w[0]).join('').toUpperCase() : name.slice(0, 3);
}

/**
 * Canvas of the Graph Playground.
 *   select  drag a vertex to move it, click to select it
 *   vertex  click empty space to add a vertex there
 *   edge    click one vertex, then another, to connect them
 *   erase   click a vertex or an edge to delete it
 * Keyboard: Tab to a vertex; Enter acts with the current tool; Delete removes
 * it; arrow keys move the selected vertex; Escape cancels a pending edge.
 */
export default function GraphEditor({ pg, tool, onMessage }) {
  const svgRef = useRef(null);
  const drag = useRef(null);
  const [pending, setPending] = useState(null); // first vertex of a new edge
  // On phones the canvas is drawn at about half size, so vertices get bigger
  // to stay comfortable touch targets.
  const R = useMediaQuery('(max-width: 600px)') ? 32 : 22;

  const toPoint = (event) => {
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  };

  const report = (error, success) => onMessage(error ? { tone: 'error', text: error } : success ? { tone: 'info', text: success } : null);

  const activateVertex = (id) => {
    const vertex = pg.byId[id];
    if (tool === 'erase') {
      pg.removeVertex(id);
      report(null, `Deleted vertex ${vertex.name} and its edges.`);
    } else if (tool === 'edge') {
      if (!pending) {
        setPending(id);
        report(null, `Edge from ${vertex.name}: now choose the second vertex (Esc cancels).`);
      } else if (pending === id) {
        setPending(null);
        report(null, 'Edge cancelled.');
      } else {
        const error = pg.addEdge(pending, id);
        report(error, error ? null : `Connected ${pg.byId[pending].name} – ${vertex.name}.`);
        setPending(null);
      }
    } else {
      pg.setSelected(pg.selected === id ? null : id);
    }
  };

  const onCanvasClick = (event) => {
    if (event.target !== event.currentTarget) return;
    if (tool === 'vertex') {
      const p = toPoint(event);
      const error = pg.addVertex({ x: p.x, y: p.y });
      report(error, error ? null : 'Vertex added. Rename it in the panel on the right.');
    } else {
      pg.setSelected(null);
      if (pending) {
        setPending(null);
        report(null, 'Edge cancelled.');
      }
    }
  };

  const onVertexPointerDown = (id, event) => {
    if (event.button !== undefined && event.button !== 0) return;
    event.stopPropagation();
    if (tool !== 'select') return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const p = toPoint(event);
    const v = pg.byId[id];
    drag.current = { id, dx: v.x - p.x, dy: v.y - p.y, startX: event.clientX, startY: event.clientY, moved: false };
  };

  const onPointerMove = (event) => {
    const d = drag.current;
    if (!d) return;
    if (!d.moved && Math.hypot(event.clientX - d.startX, event.clientY - d.startY) < 4) return;
    d.moved = true;
    const p = toPoint(event);
    pg.moveVertex(d.id, p.x + d.dx, p.y + d.dy);
  };

  const onVertexPointerUp = (id) => {
    const d = drag.current;
    drag.current = null;
    if (!d || !d.moved) activateVertex(id);
  };

  const onVertexKey = (id, event) => {
    const v = pg.byId[id];
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      activateVertex(id);
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      pg.removeVertex(id);
      report(null, `Deleted vertex ${v.name} and its edges.`);
    } else if (event.key === 'Escape' && pending) {
      setPending(null);
      report(null, 'Edge cancelled.');
    } else if (event.key.startsWith('Arrow')) {
      event.preventDefault();
      const step = event.shiftKey ? 30 : 10;
      const dx = event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0;
      const dy = event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0;
      pg.moveVertex(id, v.x + dx, v.y + dy);
    }
  };

  const degree = (id) => pg.edges.filter(([a, b]) => a === id || b === id).length;

  return (
    <div className={`editor-wrap tool-${tool}`}>
      <svg
        ref={svgRef}
        className="graph-editor"
        viewBox={`0 0 ${CANVAS.width} ${CANVAS.height}`}
        role="group"
        aria-label={`Graph editor with ${pg.vertices.length} vertices and ${pg.edges.length} edges`}
        onPointerMove={onPointerMove}
        onPointerUp={() => (drag.current = null)}
      >
        <defs>
          <pattern id="editor-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="#DCE2EC" />
          </pattern>
        </defs>
        <rect width={CANVAS.width} height={CANVAS.height} fill="url(#editor-grid)" onClick={onCanvasClick} />

        {pg.edges.map(([a, b]) => {
          const u = pg.byId[a];
          const v = pg.byId[b];
          const touchesSelected = pg.selected && (a === pg.selected || b === pg.selected);
          return (
            <g key={`${a}|${b}`} className="editor-edge">
              <line x1={u.x} y1={u.y} x2={v.x} y2={v.y} className={touchesSelected ? 'selected' : ''} />
              {tool === 'erase' && (
                <line
                  x1={u.x}
                  y1={u.y}
                  x2={v.x}
                  y2={v.y}
                  className="edge-hit"
                  onClick={() => {
                    pg.removeEdge(a, b);
                    report(null, `Deleted edge ${u.name} – ${v.name}.`);
                  }}
                >
                  <title>{`Delete edge ${u.name} – ${v.name}`}</title>
                </line>
              )}
            </g>
          );
        })}

        {pg.vertices.map((v) => {
          const isSelected = pg.selected === v.id;
          const isPending = pending === v.id;
          return (
            <g
              key={v.id}
              className={`editor-vertex ${isSelected ? 'selected' : ''} ${isPending ? 'pending' : ''}`}
              transform={`translate(${v.x} ${v.y})`}
              role="button"
              tabIndex={0}
              aria-pressed={isSelected || isPending}
              aria-label={`${v.name}, degree ${degree(v.id)}${isPending ? ', edge start' : ''}`}
              onPointerDown={(e) => onVertexPointerDown(v.id, e)}
              onPointerUp={() => onVertexPointerUp(v.id)}
              onKeyDown={(e) => onVertexKey(v.id, e)}
            >
              <circle r={R} />
              <text className="editor-label" textAnchor="middle" dy="0.35em">
                {v.name.length > 3 ? shortLabel(v.name) : v.name}
              </text>
              {v.name.length > 3 && (
                <text className="editor-fullname" textAnchor="middle" y={R + 15}>
                  {v.name}
                </text>
              )}
            </g>
          );
        })}

        {pg.vertices.length === 0 && (
          <text x={CANVAS.width / 2} y={CANVAS.height / 2} textAnchor="middle" className="editor-empty">
            {tool === 'vertex' ? 'Click anywhere to add a vertex' : 'Empty graph: add vertices to begin'}
          </text>
        )}
      </svg>
    </div>
  );
}
