import { AnimatePresence, motion } from 'framer-motion';
import { ACTIVE_RING, CONFLICT_RED, NEIGHBOR_FILL, NEIGHBOR_RING, NEUTRAL_FILL } from '../utils/constants';
import { colorFill, colorName, usedColors } from '../utils/helpers';

const STATES = [
  { label: 'Uncolored', swatch: { background: NEUTRAL_FILL } },
  { label: 'Current vertex', swatch: { background: '#fff', boxShadow: `0 0 0 3px ${ACTIVE_RING}` } },
  { label: 'Neighbor being checked', swatch: { background: NEIGHBOR_FILL, boxShadow: `0 0 0 2px ${NEIGHBOR_RING}` } },
  { label: 'Conflict', swatch: { background: '#fff', boxShadow: `0 0 0 3px ${CONFLICT_RED}` } },
];

/**
 * Shows only the colors actually used, with how many vertices use each.
 * `pulse` ({ color, key }) briefly emphasizes an entry when the algorithm
 * reuses an existing color; a brand-new color animates into the list.
 */
export default function Legend({ coloring, showStates = true, title = 'Legend', pulse = null }) {
  const colors = usedColors(coloring);
  const counts = Object.values(coloring).reduce((acc, c) => ({ ...acc, [c]: (acc[c] || 0) + 1 }), {});

  return (
    <div className="card legend">
      <div className="card-title-row">
        <h3 className="card-title">{title}</h3>
        <span className="pill">{colors.length} color{colors.length === 1 ? '' : 's'}</span>
      </div>
      {colors.length === 0 ? (
        <p className="muted small">No colors assigned yet. Run the algorithm to fill the legend.</p>
      ) : (
        <ul className="legend-list">
          <AnimatePresence initial={false}>
            {colors.map((c) => (
              <motion.li
                key={c}
                layout
                initial={{ opacity: 0, x: -10, scale: 0.96 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                exit={{ opacity: 0 }}
              >
                {pulse?.color === c && (
                  <motion.span
                    key={pulse.key}
                    className="legend-flash"
                    style={{ '--chip': colorFill(c) }}
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 0 }}
                    transition={{ duration: 1.1, ease: 'easeOut' }}
                    aria-hidden="true"
                  />
                )}
                <span className="swatch" style={{ background: colorFill(c) }} aria-hidden="true" />
                <span>
                  Color {c} <span className="muted">· {colorName(c)}</span>
                </span>
                <span className="legend-count">{counts[c]}</span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
      {showStates && (
        <ul className="legend-states">
          {STATES.map((s) => (
            <li key={s.label}>
              <span className="swatch" style={s.swatch} aria-hidden="true" />
              {s.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
