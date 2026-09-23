import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import ColorChip from './ColorChip';

/** Details of the vertex the user clicked: degree, neighbors, and their colors. */
export default function VertexCard({ graph, vertex, coloring, onClose, onSelect }) {
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
        >
          <div className="card-title-row">
            <span className="eyebrow">Selected Vertex</span>
            <button className="icon-btn" onClick={onClose} aria-label="Clear selection">
              <X size={16} />
            </button>
          </div>
          <div className="vertex-name">
            {coloring[vertex] && <ColorChip color={coloring[vertex]} />}
            {vertex}
          </div>
          <div className="vertex-meta">
            <span className="degree-badge">Degree {graph.adjacency[vertex].length}</span>
            <span className="muted small">
              {coloring[vertex] ? `Color ${coloring[vertex]}` : 'Not colored yet'}
            </span>
          </div>
          <div className="step-section-title">Neighbors</div>
          <ul className="vertex-neighbors">
            {graph.adjacency[vertex].map((n) => (
              <li key={n}>
                <button className="link-btn" onClick={() => onSelect(n)}>
                  {coloring[n] ? <ColorChip color={coloring[n]} /> : <span className="dot-neutral" aria-hidden="true" />}
                  {n}
                </button>
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
