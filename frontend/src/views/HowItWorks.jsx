import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDown, Pause, Play, RotateCcw, StepBack, StepForward } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { getGraph, runColoring } from '../api/client';
import Button from '../components/Button';
import ColorChip from '../components/ColorChip';
import LoadingState, { ErrorState } from '../components/LoadingState';
import Pseudocode from '../components/Pseudocode';
import { PALETTE, PHASE_LABELS, speedMs } from '../utils/constants';
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

const TICKS = 4; // one tick per phase: select, inspect, choose, assign
const TUTORIAL_MS = speedMs('normal');

function phaseMessage(step, phase) {
  const colored = Object.entries(step.neighbor_colors);
  if (phase === 0) return `Select vertex ${step.vertex} (step ${step.step}).`;
  if (phase === 1) {
    if (!step.neighbors.length) return `${step.vertex} has no neighbors.`;
    const parts = step.neighbors.map((n) =>
      step.neighbor_colors[n] ? `${n} has Color ${step.neighbor_colors[n]}` : `${n} is not colored yet`,
    );
    return `Inspect the neighbors of ${step.vertex}: ${parts.join(', ')}.`;
  }
  if (phase === 2) {
    return colored.length
      ? `Colors ${step.used_colors.join(', ')} are taken by neighbors, so the smallest unused color is ${step.assigned_color}.`
      : `No neighbor is colored, so the smallest unused color is ${step.assigned_color}.`;
  }
  return `${step.vertex} is colored with Color ${step.assigned_color}.`;
}

/** Replays the backend's steps for the 5-vertex tutorial graph, phase by phase. */
function MiniDemo() {
  const [data, setData] = useState({ status: 'loading' });
  const [position, setPosition] = useState(0); // 0 … TICKS·n
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
  const end = steps.length * TICKS;
  const stepIndex = Math.floor(position / TICKS);
  const phase = position % TICKS;
  const active = position < end ? steps[stepIndex] : null;

  useEffect(() => {
    if (!playing) return undefined;
    if (position >= end) {
      setPlaying(false);
      return undefined;
    }
    const timer = setTimeout(() => setPosition((p) => p + 1), TUTORIAL_MS);
    return () => clearTimeout(timer);
  }, [playing, position, end]);

  const coloring = useMemo(() => {
    const c = {};
    steps.forEach((s, i) => {
      if (i < stepIndex || (i === stepIndex && phase === 3)) c[s.vertex] = s.assigned_color;
    });
    return c;
  }, [steps, stepIndex, phase]);

  const highlight = useMemo(
    () => ({
      active: active?.vertex ?? null,
      neighbors: new Set(active && phase >= 1 ? active.neighbors : []),
      phase,
      recent: null,
    }),
    [active, phase],
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
        <ol className="phase-track mini-phases" aria-label="Phase of the current step">
          {PHASE_LABELS.map((label, i) => (
            <li key={label} className={active ? (i < phase ? 'past' : i === phase ? 'now' : '') : ''}>
              <span className="phase-dot">{i + 1}</span>
              <span className="phase-label">{label}</span>
            </li>
          ))}
        </ol>
        <GraphSVG
          graph={data.graph}
          coloring={coloring}
          highlight={highlight}
          nodeRadius={26}
          draggable={false}
          phaseMs={TUTORIAL_MS}
        />
        {active && phase >= 2 && (
          <div className="mini-chips">
            <span className="muted small">Taken</span>
            {active.used_colors.length ? (
              active.used_colors.map((c) => <ColorChip key={c} color={c} state="blocked" label={`Color ${c} is taken`} />)
            ) : (
              <span className="muted small">none</span>
            )}
            <span className="muted small">Smallest unused</span>
            <ColorChip color={active.assigned_color} state="chosen" label={`Color ${active.assigned_color}`} />
          </div>
        )}
        <div className="mini-controls">
          <Button variant="secondary" size="sm" icon={StepBack} onClick={() => { setPlaying(false); setPosition((p) => Math.max(0, p - 1)); }} disabled={position === 0} aria-label="Previous phase">
            Back
          </Button>
          <Button size="sm" icon={playing ? Pause : Play} onClick={() => { if (position >= end) setPosition(0); setPlaying((p) => !p); }}>
            {playing ? 'Pause' : position >= end ? 'Replay' : 'Play'}
          </Button>
          <Button variant="secondary" size="sm" icon={StepForward} onClick={() => { setPlaying(false); setPosition((p) => Math.min(end, p + 1)); }} disabled={position >= end} aria-label="Next phase">
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
            const done = i < stepIndex || (i === stepIndex && phase === 3);
            const state = done ? 'done' : i === stepIndex && position < end ? 'current' : '';
            return (
              <motion.li key={s.vertex} className={`walk-item ${state}`} layout>
                <span className="walk-num">Step {s.step}</span>
                <span className="walk-text">
                  <strong>{s.vertex}</strong>: {describe(s)} → {done ? <ColorChip color={s.assigned_color} /> : null}
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
            aria-live="polite"
          >
            {active
              ? phaseMessage(active, phase)
              : position === 0
                ? 'Press Play or Next to begin.'
                : `Done: ${data.result.colors_used} colors, valid = ${data.result.valid}.`}
          </motion.p>
        </AnimatePresence>
        <Pseudocode phase={active ? phase : null} />
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
