import { AnimatePresence, motion } from 'framer-motion';
import { CircleCheck, LoaderCircle, TriangleAlert } from 'lucide-react';
import { nameOf } from '../utils/helpers';

/**
 * Shows the verdict returned by POST /api/conflicts, with an icon and text so
 * the result never depends on color alone.
 */
export default function ConflictBanner({ graph, verification, verifying }) {
  const name = (v) => nameOf(graph, v);
  let content = null;

  if (verifying) {
    content = (
      <div key="checking" className="banner banner-info" role="status">
        <LoaderCircle className="spin" size={20} aria-hidden="true" />
        <div>
          <strong>Checking every edge…</strong>
          <p>POST /api/conflicts is comparing the colors at both ends of each edge.</p>
        </div>
      </div>
    );
  } else if (verification?.valid) {
    content = (
      <div key="valid" className="banner banner-success" role="status">
        <CircleCheck size={22} aria-hidden="true" />
        <div>
          <strong>Valid coloring: no conflicts</strong>
          <p>
            All {verification.checked_edges} edges were checked, and no two adjacent regions share a color.
          </p>
        </div>
      </div>
    );
  } else if (verification && verification.conflicts.length > 0) {
    const [first, ...rest] = verification.conflicts;
    content = (
      <div key="conflict" className="banner banner-danger" role="alert">
        <TriangleAlert size={22} aria-hidden="true" />
        <div>
          <strong className="banner-title">
            Conflict detected
            {verification.conflicts.length > 1 && (
              <span className="pill pill-danger">{verification.conflicts.length} conflicting edges</span>
            )}
          </strong>
          <p className="conflict-pair">
            {name(first.region_a)} <span aria-label="and">↔</span> {name(first.region_b)}
          </p>
          <p>
            {name(first.region_a)} and {name(first.region_b)} have the same color (<b>Color {first.color}</b>) but
            are adjacent{graph?.kind === 'map' ? ' (they share a border)' : ''}. Adjacent vertices must get
            different colors. The backend found this by checking all {verification.checked_edges} edges.
          </p>
          {rest.length > 0 && (
            <p className="small">
              Also:{' '}
              {rest.map((c) => `${name(c.region_a)} – ${name(c.region_b)} (Color ${c.color})`).join('; ')}
            </p>
          )}
        </div>
      </div>
    );
  } else if (verification) {
    content = (
      <div key="incomplete" className="banner banner-warn" role="status">
        <TriangleAlert size={22} aria-hidden="true" />
        <div>
          <strong>Incomplete coloring</strong>
          <p>
            No two colored neighbors clash, but {verification.uncolored.length} vertex
            {verification.uncolored.length === 1 ? ' is' : 'es are'} still uncolored, so the coloring isn't complete yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {content && (
        <motion.div
          key={content.key}
          initial={{ opacity: 0, y: -8, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25 }}
        >
          {content}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
