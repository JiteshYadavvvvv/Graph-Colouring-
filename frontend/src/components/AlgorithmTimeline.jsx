import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { colorFill, pad2 } from '../utils/helpers';

/** The vertex visiting order, showing which steps are done, current, and pending. */
export default function AlgorithmTimeline({ coloringState, labels }) {
  const { result, runState, cursor } = coloringState;
  const listRef = useRef(null);

  useEffect(() => {
    // Scroll only the timeline strip horizontally (scrollIntoView would also scroll the page).
    const list = listRef.current;
    const current = list?.querySelector('.tl-item.current');
    if (list && current) {
      list.scrollTo({ left: current.offsetLeft - list.clientWidth / 2 + current.clientWidth / 2, behavior: 'smooth' });
    }
  }, [cursor.step]);

  if (!result) return null;
  const done = runState === 'done';

  return (
    <div className="card timeline">
      <div className="card-title-row">
        <h3 className="card-title">Visiting order</h3>
        <span className="muted small">{result.strategy_label}</span>
      </div>
      <ol className="tl-list" ref={listRef}>
        {result.steps.map((s, i) => {
          const finished = done || i < cursor.step || (i === cursor.step && cursor.phase >= 3);
          const current = !done && i === cursor.step;
          return (
            <motion.li
              key={s.vertex}
              className={`tl-item ${finished ? 'finished' : ''} ${current ? 'current' : ''}`}
              title={`${s.vertex}: ${s.message}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.02, 0.4) }}
            >
              <span className="tl-num">{pad2(s.step)}</span>
              <span className="tl-name">{labels?.[s.vertex] ?? s.vertex}</span>
              <span
                className="tl-color"
                style={{ background: finished ? colorFill(s.assigned_color) : undefined }}
                aria-label={finished ? `Color ${s.assigned_color}` : 'Not yet colored'}
              >
                {finished ? s.assigned_color : ''}
              </span>
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}
