import { AnimatePresence, motion } from 'framer-motion';
import { CircleCheck, CircleDashed, LoaderCircle, TriangleAlert } from 'lucide-react';
import { strategyInfo } from '../utils/constants';
import { nameOf, usedColors } from '../utils/helpers';
import { chromaticText, coloringStatus } from '../utils/status';

const STATUS_ICONS = { neutral: CircleDashed, info: LoaderCircle, success: CircleCheck, danger: TriangleAlert };

function Value({ children }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.dd
        key={String(children)}
        initial={{ opacity: 0, y: 3 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -3 }}
        transition={{ duration: 0.18 }}
      >
        {children}
      </motion.dd>
    </AnimatePresence>
  );
}

/**
 * Compact summary of the active graph and the current coloring. Every number
 * comes from the backend (graph statistics, coloring result, verification).
 */
export default function GraphInfoPanel({ cs, title = 'Graph statistics' }) {
  const { graph, runState, coloring, verification, strategy, result } = cs;
  const s = graph.statistics;
  const hubs = graph.vertices.filter((v) => graph.adjacency[v].length === s.max_degree);
  const status = coloringStatus(cs);
  const StatusIcon = STATUS_ICONS[status.tone];
  const colored = usedColors(coloring).length;
  const colorsUsed =
    runState === 'done' ? colored : runState === 'playing' || runState === 'paused' ? `${colored} so far` : '—';
  const algorithm = result ? strategyInfo(result.strategy) : strategyInfo(strategy);

  const rows = [
    ['Dataset', graph.name],
    ['Algorithm', `Greedy coloring · ${algorithm.short}`],
    ['Vertices', s.vertices],
    ['Edges', s.edges],
    ['Max degree (Δ)', hubs.length === 1 ? `${s.max_degree} · ${nameOf(graph, hubs[0])}` : s.max_degree],
    ['Min degree', s.min_degree],
    ['Avg degree', s.average_degree.toFixed(2)],
    ['Colors used', colorsUsed],
    [<>Minimum colors <span className="nocase">(χ)</span></>, `${chromaticText(graph.chromatic)}${graph.chromatic?.exact ? '' : ' (bounds)'}`],
    ['Conflicts', verification ? verification.conflicts.length : '—'],
  ];

  return (
    <section className="card info-panel" aria-label={title}>
      <div className="card-title-row">
        <h3 className="card-title">{title}</h3>
        <span className={`status-badge tone-${status.tone}`} role="status">
          <StatusIcon size={14} className={status.busy ? 'spin' : ''} aria-hidden="true" />
          {status.text}
        </span>
      </div>
      <dl className="info-grid">
        {rows.map(([label, value], i) => (
          <div key={i} className={label === 'Conflicts' && verification?.conflicts.length ? 'danger' : ''}>
            <dt>{label}</dt>
            <Value>{value}</Value>
          </div>
        ))}
      </dl>
    </section>
  );
}
