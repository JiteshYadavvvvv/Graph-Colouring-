import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDown, Check, CircleDashed, Cpu, Sparkles } from 'lucide-react';
import { PHASE_LABELS } from '../utils/constants';
import { colorFill, pad2 } from '../utils/helpers';
import ColorChip from './ColorChip';

function Section({ title, reached, children }) {
  return (
    <div className={`step-section ${reached ? '' : 'pending'}`}>
      <div className="step-section-title">{title}</div>
      {reached ? children : <div className="muted small">Waiting…</div>}
    </div>
  );
}

function ProgressBar({ value }) {
  return (
    <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value * 100)}>
      <motion.div className="progress-fill" animate={{ width: `${value * 100}%` }} transition={{ duration: 0.35 }} />
    </div>
  );
}

/**
 * Explains the step currently being replayed. Everything shown here is
 * read from the backend's step record, not computed in the browser.
 */
export default function StepPanel({ coloringState }) {
  const { result, runState, activeStep, cursor, totalSteps, completedSteps } = coloringState;
  const progress = totalSteps ? completedSteps / totalSteps : 0;

  if (!result || runState === 'idle' || runState === 'requesting') {
    return (
      <div className="card step-panel empty">
        <Cpu size={26} className="muted" aria-hidden="true" />
        <h3>Algorithm panel</h3>
        <p className="muted small">
          {runState === 'requesting'
            ? 'Asking the FastAPI engine to run greedy coloring…'
            : 'Press “Run Greedy Coloring”. The backend runs the algorithm and this panel replays every decision it made.'}
        </p>
      </div>
    );
  }

  if (runState === 'done' || !activeStep) {
    return (
      <div className="card step-panel done">
        <div className="step-head">
          <span className="step-counter">
            STEP {pad2(totalSteps)} / {pad2(totalSteps)}
          </span>
          <span className="pill pill-success">Completed</span>
        </div>
        <ProgressBar value={1} />
        <div className="done-summary">
          <Sparkles size={22} aria-hidden="true" />
          <div>
            <strong>{result.steps.length} vertices colored</strong>
            <p className="muted small">
              Greedy used <strong>{result.colors_used}</strong> color{result.colors_used === 1 ? '' : 's'}{' '}
              ({result.strategy_label.toLowerCase()}).
            </p>
          </div>
        </div>
        <div className="chip-row">
          {Array.from({ length: result.colors_used }, (_, i) => (
            <ColorChip key={i} color={i + 1} />
          ))}
        </div>
      </div>
    );
  }

  const step = activeStep;
  const phase = cursor.phase;

  return (
    <div className="card step-panel" aria-live="polite">
      <div className="step-head">
        <span className="step-counter">
          STEP {pad2(step.step)} / {pad2(totalSteps)}
        </span>
        <span className={`pill ${runState === 'paused' ? 'pill-warn' : 'pill-live'}`}>
          {runState === 'paused' ? 'Paused' : 'Running'}
        </span>
      </div>
      <ProgressBar value={progress} />

      <ol className="phase-track" aria-label="Phases of this step">
        {PHASE_LABELS.map((label, i) => (
          <li key={label} className={i < phase ? 'past' : i === phase ? 'now' : ''}>
            <span className="phase-dot">{i < phase ? <Check size={11} /> : i + 1}</span>
            <span className="phase-label">{label}</span>
          </li>
        ))}
      </ol>

      <div className="step-section">
        <div className="step-section-title">Current Vertex</div>
        <AnimatePresence mode="wait">
          <motion.div
            key={step.vertex}
            className="current-vertex"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
          >
            {step.vertex}
            <span className="degree-badge">degree {step.degree}</span>
          </motion.div>
        </AnimatePresence>
      </div>

      <Section title="Checking Neighbors" reached={phase >= 1}>
        <ul className="neighbor-list">
          {step.neighbors.map((n, i) => {
            const c = step.neighbor_colors[n];
            return (
              <motion.li
                key={n}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                {c ? <Check size={14} className="ok" aria-hidden="true" /> : <CircleDashed size={14} className="muted" aria-hidden="true" />}
                <span className="neighbor-name">{n}</span>
                {c ? (
                  <span className="neighbor-color">
                    → <ColorChip color={c} /> Color {c}
                  </span>
                ) : (
                  <span className="muted small">not colored yet (ignored)</span>
                )}
              </motion.li>
            );
          })}
          {step.neighbors.length === 0 && <li className="muted small">No neighbors: nothing is blocked.</li>}
        </ul>
      </Section>

      <div className="step-grid">
        <Section title="Colors Used by Neighbors" reached={phase >= 2}>
          <div className="chip-row">
            {step.used_colors.length ? (
              step.used_colors.map((c) => <ColorChip key={c} color={c} state="blocked" label={`Color ${c} is blocked`} />)
            ) : (
              <span className="muted small">None</span>
            )}
          </div>
        </Section>
        <Section title="Available Colors" reached={phase >= 2}>
          <div className="chip-row">
            {step.available_colors.map((c, i) => (
              <ColorChip key={c} color={c} state={i === 0 ? 'chosen' : 'available'} label={i === 0 ? `Color ${c}: smallest available` : `Color ${c} is available`} />
            ))}
          </div>
        </Section>
      </div>

      {phase >= 2 && (
        <motion.div
          className="decision"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ '--chip': colorFill(step.assigned_color) }}
        >
          <ArrowDown size={14} aria-hidden="true" />
          Smallest available color = <strong>{step.assigned_color}</strong>
        </motion.div>
      )}

      <Section title={phase >= 3 ? 'Assigned' : 'Assigning'} reached={phase >= 3}>
        <motion.div
          className="assigned"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{ '--chip': colorFill(step.assigned_color) }}
        >
          <span className="assigned-swatch" aria-hidden="true" />
          COLOR {step.assigned_color}
          {step.is_new_color && <span className="pill pill-accent">new color</span>}
        </motion.div>
      </Section>

      {phase >= 2 && <p className="step-message">{step.message}</p>}
    </div>
  );
}
