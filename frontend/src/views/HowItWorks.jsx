import { motion } from 'framer-motion';
import { Pause, Play, RotateCcw, StepBack, StepForward } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { getGraph, runColoring } from '../api/client';
import Button from '../components/Button';
import ColorChip from '../components/ColorChip';
import LoadingState, { ErrorState } from '../components/LoadingState';
import Pseudocode from '../components/Pseudocode';
import { LAST_PHASE, PHASE_LABELS, PHASES, phaseDuration, speedMs } from '../utils/constants';
import { ALGORITHM_STEPS, FACTS, FULL_PSEUDOCODE, LESSONS } from '../content/learning';
import { narrate } from '../utils/narration';
import { coloringAtCursor, highlightAt } from '../utils/replay';
import GraphSVG from '../visualization/GraphSVG';

function describe(step) {
  if (!step.used_colors.length) return 'no colored neighbors';
  const blocked = step.rejected_colors.join(', ');
  return `neighbors use ${step.used_colors.join(', ')}${blocked ? `, so Color ${blocked} ${step.rejected_colors.length > 1 ? 'are' : 'is'} unavailable` : ''}`;
}

const TICKS = PHASES.length; // one tick per phase
const TUTORIAL_MS = speedMs('1x');

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
  // The tutorial counts phases linearly; the cursor is the same {step, phase}
  // the main player uses, so both replay the backend steps identically.
  const cursor = useMemo(() => ({ step: Math.floor(position / TICKS), phase: position % TICKS }), [position]);
  const { step: stepIndex, phase } = cursor;
  const active = position < end ? steps[stepIndex] : null;

  useEffect(() => {
    if (!playing) return undefined;
    if (position >= end) {
      setPlaying(false);
      return undefined;
    }
    const timer = setTimeout(() => setPosition((p) => p + 1), phaseDuration(position % TICKS, TUTORIAL_MS));
    return () => clearTimeout(timer);
  }, [playing, position, end]);

  const coloring = useMemo(() => coloringAtCursor(steps, cursor), [steps, cursor]);
  const highlight = useMemo(() => highlightAt(steps, cursor), [steps, cursor]);

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
        <ol className="phase-track five mini-phases" aria-label="Phase of the current step">
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
        {active && phase >= 2 && phase < LAST_PHASE && (
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
            const done = i < stepIndex || (i === stepIndex && phase >= 3);
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
        <motion.p
          key={position}
          className="step-message"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          aria-live="polite"
        >
            {active
              ? (({ title, detail }) => `${title} ${detail}`)(narrate(data.graph, steps, cursor))
              : position === 0
                ? 'Press Play or Next to begin.'
                : `Done: ${data.result.colors_used} colors, valid = ${data.result.valid}.`}
        </motion.p>
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
          <span className="eyebrow">Educational mode</span>
          <h1>Learn Graph Coloring</h1>
          <p className="muted">
            From a map to a graph, from a graph to a coloring: seven short lessons with examples, then the greedy
            algorithm step by step, computed live by the backend.
          </p>
        </div>
      </header>

      <section aria-labelledby="lessons-title">
        <h2 id="lessons-title" className="section-title">Seven questions</h2>
        <ol className="lessons">
          {LESSONS.map((lesson, i) => (
            <motion.li
              key={lesson.id}
              className={`card lesson ${lesson.id === 'map-to-graph' ? 'wide' : ''}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.05, 0.3) }}
            >
              <div className="lesson-text">
                <span className="lesson-num">{i + 1}</span>
                <h3>{lesson.question}</h3>
                <p>{lesson.text}</p>
                <p className="lesson-example">
                  <strong>Example.</strong> {lesson.example}
                </p>
              </div>
              <div className="lesson-art">{lesson.art}</div>
            </motion.li>
          ))}
        </ol>
      </section>

      <section>
        <h2 className="section-title">The greedy algorithm in six steps</h2>
        <ol className="algo-steps">
          {ALGORITHM_STEPS.map((step, i) => (
            <motion.li
              key={step.title}
              className="card"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
            >
              <span className="step-num">{i + 1}</span>
              <div>
                <h3>{step.title}</h3>
                <p className="muted small">{step.text}</p>
              </div>
            </motion.li>
          ))}
        </ol>
      </section>

      <section>
        <h2 className="section-title">Watch it, one vertex at a time</h2>
        <p className="muted section-sub">
          The mini graph below has edges A–B, A–C, B–D, C–D, C–E and D–E. Each step is computed by the backend and
          replayed in five phases: choose a vertex, check its neighbors’ colors, find the smallest available color,
          assign it, and move to the next vertex.
        </p>
        <MiniDemo />
      </section>

      <section className="how-code">
        <div className="card pseudocode full">
          <h3 className="card-title">Pseudocode</h3>
          <pre aria-label="Greedy coloring pseudocode">
            <code>{FULL_PSEUDOCODE}</code>
          </pre>
        </div>
        <div className="card complexity">
          <h3 className="card-title">Complexity</h3>
          <div className="complexity-grid">
            <div className="complexity-box">
              <span className="eyebrow">Time</span>
              <span className="big-o">O(V + E)</span>
            </div>
            <div className="complexity-box">
              <span className="eyebrow">Extra space</span>
              <span className="big-o">O(V)</span>
            </div>
          </div>
          <ul className="explain-list">
            <li>
              The outer loop runs once per vertex: <strong>V</strong> iterations.
            </li>
            <li>
              The inner loop runs once per neighbor. Summed over all vertices that is the sum of the degrees,{' '}
              <strong>2E</strong>, because every edge is seen from both ends.
            </li>
            <li>
              The while loop stops within deg(v) + 1 tries, since at most deg(v) colors can be blocked. That adds at
              most another 2E + V steps.
            </li>
            <li>
              Total: V + 2E + (2E + V) = <strong>O(V + E)</strong>. Memory: one color per vertex plus a set of at most
              Δ colors, <strong>O(V)</strong>.
            </li>
            <li className="muted">
              The app’s backend additionally records each step for the animation, which adds O(V·C) time and O(V + E)
              space (see the Statistics page).
            </li>
          </ul>
        </div>
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
