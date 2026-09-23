import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDown, Pause, Play, RotateCcw, StepBack, StepForward } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { getGraph, runColoring } from '../api/client';
import Button from '../components/Button';
import ColorChip from '../components/ColorChip';
import LoadingState, { ErrorState } from '../components/LoadingState';
import Pseudocode from '../components/Pseudocode';
import { PALETTE } from '../utils/constants';
import GraphSVG from '../visualization/GraphSVG';

const CONCEPTS = [
  {
    term: 'Vertex',
    meaning: 'Represents a region',
    art: <circle cx="30" cy="30" r="14" fill="#E6EAF2" stroke="#3157D5" strokeWidth="3" />,
  },
  {
    term: 'Edge',
    meaning: 'Represents a shared boundary',
    art: (
      <>
        <line x1="12" y1="30" x2="48" y2="30" stroke="#6C5CE7" strokeWidth="4" strokeLinecap="round" />
        <circle cx="12" cy="30" r="7" fill="#E6EAF2" stroke="#172033" strokeWidth="2" />
        <circle cx="48" cy="30" r="7" fill="#E6EAF2" stroke="#172033" strokeWidth="2" />
      </>
    ),
  },
  {
    term: 'Color',
    meaning: 'Represents an assigned color',
    art: (
      <>
        <circle cx="18" cy="30" r="10" fill={PALETTE[0].fill} />
        <circle cx="42" cy="30" r="10" fill={PALETTE[1].fill} />
      </>
    ),
  },
];

const FACTS = [
  { title: 'Always valid', text: 'A vertex never takes a color that one of its colored neighbors already has.' },
  { title: 'At most Δ + 1 colors', text: 'A vertex with d neighbors can have at most d colors blocked, so color d + 1 is always free.' },
  { title: 'Not always optimal', text: 'Greedy never looks ahead. A poor vertex order can use more colors than the chromatic number.' },
  { title: 'Order matters', text: 'Welsh–Powell colors high-degree vertices first, which often uses fewer colors.' },
];

function describe(step) {
  if (!step.used_colors.length) return 'no colored neighbors';
  const blocked = step.rejected_colors.join(', ');
  return `neighbors use ${step.used_colors.join(', ')}${blocked ? `, so Color ${blocked} ${step.rejected_colors.length > 1 ? 'are' : 'is'} unavailable` : ''}`;
}

/** Replays the backend's steps for the 5-vertex tutorial graph. */
function MiniDemo() {
  const [data, setData] = useState({ status: 'loading' });
  const [position, setPosition] = useState(0); // 0 … 2n (two ticks per vertex)
  const [playing, setPlaying] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setData({ status: 'loading' });
    Promise.all([getGraph('mini'), runColoring('mini')])
      .then(([graph, result]) => !cancelled && setData({ status: 'ready', graph, result }))
      .catch((error) => !cancelled && setData({ status: 'error', error }));
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const steps = data.result?.steps ?? [];
  const end = steps.length * 2;
  const stepIndex = Math.floor(position / 2);
  const assigned = position % 2 === 1;
  const active = position < end ? steps[stepIndex] : null;

  useEffect(() => {
    if (!playing) return undefined;
    if (position >= end) {
      setPlaying(false);
      return undefined;
    }
    const timer = setTimeout(() => setPosition((p) => p + 1), 1100);
    return () => clearTimeout(timer);
  }, [playing, position, end]);

  const coloring = useMemo(() => {
    const c = {};
    steps.forEach((s, i) => {
      if (i < stepIndex || (i === stepIndex && assigned)) c[s.vertex] = s.assigned_color;
    });
    return c;
  }, [steps, stepIndex, assigned]);

  const highlight = useMemo(
    () => ({
      active: active?.vertex ?? null,
      neighbors: new Set(active ? active.neighbors : []),
      phase: assigned ? 3 : 1,
    }),
    [active, assigned],
  );

  if (data.status === 'loading') return <LoadingState label="Loading tutorial graph…" />;
  if (data.status === 'error') {
    return <ErrorState title="Tutorial unavailable" message={data.error.message} onRetry={() => setAttempt((a) => a + 1)} />;
  }

  return (
    <div className="mini-demo">
      <div className="card mini-graph-card">
        <div className="card-title-row wrap">
          <h3 className="card-title">Live walkthrough</h3>
          <span className="muted small">Steps from POST /api/color (dataset “mini”)</span>
        </div>
        <GraphSVG graph={data.graph} coloring={coloring} highlight={highlight} nodeRadius={26} draggable={false} />
        <div className="mini-controls">
          <Button variant="secondary" size="sm" icon={StepBack} onClick={() => { setPlaying(false); setPosition((p) => Math.max(0, p - 1)); }} disabled={position === 0} aria-label="Previous">
            Back
          </Button>
          <Button size="sm" icon={playing ? Pause : Play} onClick={() => { if (position >= end) setPosition(0); setPlaying((p) => !p); }}>
            {playing ? 'Pause' : position >= end ? 'Replay' : 'Play'}
          </Button>
          <Button variant="secondary" size="sm" icon={StepForward} onClick={() => { setPlaying(false); setPosition((p) => Math.min(end, p + 1)); }} disabled={position >= end} aria-label="Next">
            Next
          </Button>
          <Button variant="ghost" size="sm" icon={RotateCcw} onClick={() => { setPlaying(false); setPosition(0); }}>
            Restart
          </Button>
        </div>
      </div>

      <div className="mini-side">
        <ol className="walk-list">
          {steps.map((s, i) => {
            const state = i < stepIndex || (i === stepIndex && assigned) ? 'done' : i === stepIndex && position < end ? 'current' : '';
            return (
              <motion.li key={s.vertex} className={`walk-item ${state}`} layout>
                <span className="walk-num">Step {s.step}</span>
                <span className="walk-text">
                  <strong>{s.vertex}</strong>: {describe(s)} → {state ? <ColorChip color={s.assigned_color} /> : null}
                  <strong>Color {s.assigned_color}</strong>
                </span>
              </motion.li>
            );
          })}
        </ol>
        <AnimatePresence mode="wait">
          <motion.p
            key={position}
            className="step-message"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {active
              ? assigned
                ? `${active.vertex} gets Color ${active.assigned_color}. ${active.message}`
                : `Looking at ${active.vertex}: checking neighbors ${active.neighbors.join(', ')}.`
              : position === 0
                ? 'Press Play or Next to begin.'
                : `Done: ${data.result.colors_used} colors, valid = ${data.result.valid}.`}
          </motion.p>
        </AnimatePresence>
        <Pseudocode phase={active ? (assigned ? 3 : 1) : null} />
      </div>
    </div>
  );
}

export default function HowItWorks() {
  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Learn</span>
          <h1>How Graph Coloring Works</h1>
          <p className="muted">
            Graph coloring gives every vertex a color so that the two ends of every edge have different colors.
            Coloring a map this way means no two neighboring regions look the same.
          </p>
        </div>
      </header>

      <section className="concepts">
        {CONCEPTS.map((c, i) => (
          <motion.div
            key={c.term}
            className="card concept"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.12 }}
          >
            <svg viewBox="0 0 60 60" width="60" height="60" aria-hidden="true">
              {c.art}
            </svg>
            <h3>{c.term}</h3>
            <ArrowDown size={16} className="muted" aria-hidden="true" />
            <p>{c.meaning}</p>
          </motion.div>
        ))}
      </section>

      <section>
        <h2 className="section-title">The greedy strategy, one vertex at a time</h2>
        <p className="muted section-sub">
          The mini graph below has edges A–B, A–C, B–D, C–D, C–E and D–E. Each step is computed by the backend.
        </p>
        <MiniDemo />
      </section>

      <section>
        <h2 className="section-title">Key properties</h2>
        <div className="facts">
          {FACTS.map((f, i) => (
            <motion.div
              key={f.title}
              className="card fact"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
            >
              <h3>{f.title}</h3>
              <p className="muted small">{f.text}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
