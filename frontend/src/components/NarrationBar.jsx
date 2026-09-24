import { motion } from 'framer-motion';
import { CircleCheck, Info, LoaderCircle, MousePointerClick, TriangleAlert } from 'lucide-react';
import { PHASE_LABELS } from '../utils/constants';
import { nameOf, pad2 } from '../utils/helpers';
import { listText, narrate } from '../utils/narration';

/** What the workspace should say right now, from the real application state. */
function currentMessage(cs) {
  const { graph, result, runState, cursor, selected, coloring, verification, verifying, animating } = cs;
  const name = (v) => nameOf(graph, v);

  if (runState === 'requesting') {
    return { tone: 'info', icon: LoaderCircle, spin: true, title: 'Asking the backend to run greedy coloring…', detail: '' };
  }
  if (animating && result) {
    const text = narrate(graph, result.steps, cursor);
    return {
      tone: 'live',
      phase: cursor.phase,
      step: `Step ${pad2(cursor.step + 1)} / ${pad2(result.steps.length)}`,
      ...text,
    };
  }
  if (selected) {
    const neighbors = graph.adjacency[selected] ?? [];
    return {
      tone: 'info',
      icon: MousePointerClick,
      title: `${name(selected)} (${selected})${coloring[selected] ? ` · Color ${coloring[selected]}` : ''}`,
      detail: `Degree ${neighbors.length}. Neighbors: ${listText(neighbors.map(name)) || 'none'}.`,
    };
  }
  if (runState === 'done' && result) {
    if (verifying) return { tone: 'info', icon: LoaderCircle, spin: true, title: 'Checking every edge for conflicts…', detail: '' };
    if (verification?.conflicts.length) {
      const [first] = verification.conflicts;
      return {
        tone: 'danger',
        icon: TriangleAlert,
        title: `Conflict detected: ${name(first.region_a)} ↔ ${name(first.region_b)}.`,
        detail: `Same color (Color ${first.color}) assigned to adjacent vertices.`,
      };
    }
    if (verification?.valid) {
      return {
        tone: 'success',
        icon: CircleCheck,
        title: `Coloring complete: ${result.colors_used} colors, no conflicts.`,
        detail: `All ${verification.checked_edges} edges were checked by the backend.`,
      };
    }
  }
  return {
    tone: 'neutral',
    icon: Info,
    title: graph.kind === 'map' ? 'Select a state on the map or a vertex in the graph.' : 'Select a vertex in the graph.',
    detail: 'Its neighbors and edges are highlighted in every view. Use Auto Play or Step-by-Step to run the algorithm.',
  };
}

/**
 * One-line narration of the workspace: the current phase of the algorithm
 * while it runs, the verdict when it finishes, or the selected vertex.
 */
export default function NarrationBar({ cs }) {
  const message = currentMessage(cs);
  const Icon = message.icon;
  const key = `${message.title}|${message.detail}`;

  return (
    <div className={`narration tone-${message.tone}`} role="status" aria-live="polite">
      {message.phase !== undefined ? (
        <span className="narration-phase" aria-hidden="true">
          {message.phase + 1}
        </span>
      ) : (
        <Icon size={18} className={`narration-icon ${message.spin ? 'spin' : ''}`} aria-hidden="true" />
      )}
      {/* Remounted with a fade-in on every change; no exit animation, so a
          fast sequence of steps can never leave an old sentence on screen. */}
      <motion.div
        key={key}
        className="narration-text"
        initial={{ opacity: 0, y: 3 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.16 }}
      >
        <strong>{message.title}</strong>
        {message.detail && <span>{message.detail}</span>}
      </motion.div>
      {message.step && (
        <span className="narration-meta">
          {message.step}
          <small>{PHASE_LABELS[message.phase]}</small>
        </span>
      )}
    </div>
  );
}
