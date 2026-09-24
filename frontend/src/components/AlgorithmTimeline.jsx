import { motion } from 'framer-motion';
import { ListOrdered } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { colorFill, colorInk, nameOf, pad2 } from '../utils/helpers';

/**
 * Vertical timeline of the backend's visiting order: completed steps show
 * the color they received, the current step glows, pending steps stay muted.
 */
export default function AlgorithmTimeline({ coloringState }) {
  const { graph, result, runState, cursor, completedSteps, totalSteps, selected, setSelected, animating } = coloringState;
  const listRef = useRef(null);
  const done = runState === 'done';

  useEffect(() => {
    // Keep the current step visible by scrolling only the list itself
    // (scrollIntoView would also scroll the page).
    const list = listRef.current;
    const current = list?.querySelector('.tl-row.current');
    if (!list || !current) return;
    // Position of the row inside the scrolling list, whatever its offsetParent is.
    const rowTop = current.getBoundingClientRect().top - list.getBoundingClientRect().top + list.scrollTop;
    const top = rowTop - list.clientHeight / 2 + current.clientHeight / 2;
    list.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  }, [cursor.step]);

  if (!result) {
    return (
      <div className="card timeline">
        <div className="card-title-row">
          <h3 className="card-title">Algorithm timeline</h3>
        </div>
        <p className="muted small timeline-empty">
          <ListOrdered size={16} aria-hidden="true" /> The visiting order appears here once the backend returns its
          steps.
        </p>
      </div>
    );
  }

  const progress = totalSteps ? completedSteps / totalSteps : 0;

  return (
    <div className="card timeline">
      <div className="card-title-row">
        <h3 className="card-title">Greedy coloring</h3>
        <span className="step-counter">
          Step {pad2(done ? totalSteps : Math.max(1, cursor.step + 1))} / {pad2(totalSteps)}
        </span>
      </div>
      <div className="progress thin" role="progressbar" aria-label="Algorithm progress" aria-valuemin={0} aria-valuemax={totalSteps} aria-valuenow={completedSteps}>
        <motion.div className="progress-fill" animate={{ width: `${progress * 100}%` }} transition={{ duration: 0.3 }} />
      </div>
      <ol className="tl-vertical" ref={listRef} aria-label={`Visiting order: ${result.strategy_label}`}>
        {result.steps.map((s, i) => {
          const finished = done || i < cursor.step || (i === cursor.step && cursor.phase >= 3);
          const current = !done && i === cursor.step;
          const state = current ? 'current' : finished ? 'done' : 'pending';
          const fill = finished ? colorFill(s.assigned_color) : undefined;
          return (
            <li key={s.vertex} className={`tl-row ${state} ${selected === s.vertex ? 'selected' : ''}`}>
              <span className="tl-marker" style={{ background: fill, borderColor: fill }} aria-hidden="true" />
              <button
                type="button"
                className="tl-body"
                onClick={() => !animating && setSelected(selected === s.vertex ? null : s.vertex)}
                disabled={animating}
                title={s.message}
              >
                <span className="tl-step">Step {pad2(s.step)}</span>
                <span className="tl-vertex">{nameOf(graph, s.vertex)}</span>
                {finished ? (
                  <span className="tl-color" style={{ background: fill, color: colorInk(s.assigned_color) }}>
                    {s.assigned_color}
                  </span>
                ) : (
                  <span className="tl-status">{current ? 'now' : 'pending'}</span>
                )}
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
