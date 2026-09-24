import { motion } from 'framer-motion';
import { colorClasses, colorFill, nameOf, plural } from '../utils/helpers';

/** How many vertices received each color, as horizontal bars. */
export default function ColorDistribution({ graph, coloring, order }) {
  const classes = colorClasses(coloring, order);
  const max = Math.max(1, ...classes.map((c) => c.members.length));

  if (!classes.length) return <p className="muted small">No colors assigned yet.</p>;

  return (
    <ul className="distribution" aria-label="Number of vertices per color">
      {classes.map(({ color, members }, i) => (
        <li key={color}>
          <span className="dist-label">Color {color}</span>
          <div className="dist-track">
            <motion.div
              className="dist-bar"
              style={{ background: colorFill(color) }}
              initial={{ width: 0 }}
              animate={{ width: `${(members.length / max) * 100}%` }}
              transition={{ delay: i * 0.06, duration: 0.5, ease: 'easeOut' }}
            />
          </div>
          <span className="dist-count">{plural(members.length, 'vertex', 'vertices')}</span>
          <span className="dist-members muted small">{members.map((v) => nameOf(graph, v)).join(', ')}</span>
        </li>
      ))}
    </ul>
  );
}
