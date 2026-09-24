import { AnimatePresence, motion } from 'framer-motion';
import { TriangleAlert, X } from 'lucide-react';
import { nameOf } from '../utils/helpers';
import ColorChip from './ColorChip';

/**
 * Details of the vertex the user clicked: degree, neighbors and their colors,
 * and any neighbor that has the same color (a conflict).
 */
export default function VertexCard({ graph, vertex, coloring, onClose, onSelect }) {
  const neighbors = vertex ? graph.adjacency[vertex] ?? [] : [];
  const color = vertex ? coloring[vertex] : null;
  const clashes = color ? neighbors.filter((n) => coloring[n] === color) : [];

  return (
    <AnimatePresence mode="wait">
      {vertex && (
        <motion.div
          key={vertex}
          className="card vertex-card"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22 }}
          aria-label={`Selected vertex ${nameOf(graph, vertex)}`}
        >
          <div className="card-title-row">
            <span className="eyebrow">Selected vertex</span>
            <button className="icon-btn" onClick={onClose} aria-label="Clear selection">
              <X size={16} />
            </button>
          </div>
          <div className="vertex-name">
            {color && <ColorChip color={color} />}
            {nameOf(graph, vertex)}
          </div>
          <dl className="vertex-facts">
            <div>
              <dt>ID</dt>
              <dd>
                <code>{vertex}</code>
              </dd>
            </div>
            <div>
              <dt>Degree</dt>
              <dd>{neighbors.length}</dd>
            </div>
            <div>
              <dt>Color</dt>
              <dd>{color ? `Color ${color}` : 'not assigned yet'}</dd>
            </div>
          </dl>
          {clashes.length > 0 && (
            <p className="vertex-clash" role="alert">
              <TriangleAlert size={15} aria-hidden="true" />
              Conflict: same color as {clashes.map((n) => nameOf(graph, n)).join(', ')}
            </p>
          )}
          <div className="step-section-title">Neighbors ({neighbors.length})</div>
          <ul className="vertex-neighbors">
            {neighbors.map((n) => (
              <li key={n}>
                <button className="link-btn" onClick={() => onSelect(n)}>
                  {coloring[n] ? <ColorChip color={coloring[n]} /> : <span className="dot-neutral" aria-hidden="true" />}
                  {nameOf(graph, n)}
                  {coloring[n] && coloring[n] === color && <TriangleAlert size={13} className="danger-text" aria-label="same color" />}
                </button>
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
