import {
  ArrowDownWideNarrow,
  Eraser,
  Footprints,
  Gauge,
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
  Zap,
} from 'lucide-react';
import { SHORTCUTS } from '../hooks/useShortcuts';
import { SPEEDS, STRATEGIES } from '../utils/constants';
import { pad2 } from '../utils/helpers';
import Button from './Button';
import Segmented from './Segmented';

/**
 * Playback bar.
 *   Execution modes (each asks the backend for a fresh run):
 *     Auto Play      replay every phase automatically
 *     Step-by-Step   stop after each phase; Next / Previous move through it
 *     Instant        show the final coloring at once
 *   Transport: Previous, Play/Pause, Next, Restart (replay the same run).
 */
export default function ColoringControls({ coloringState }) {
  const {
    graph, runState, run, playPause, stepForward, stepBack, restart, reset, result, cursor, totalSteps,
    speed, setSpeed, strategy, setStrategy,
  } = coloringState;
  const busy = runState === 'requesting';
  const animating = runState === 'playing' || runState === 'paused';
  const done = runState === 'done';
  const total = totalSteps || graph.vertices.length;
  const current = done ? total : animating ? cursor.step + 1 : 0;
  const atStart = animating && cursor.step === 0 && cursor.phase === 0;
  const playLabel = runState === 'playing' ? 'Pause' : done ? 'Replay' : 'Play';

  return (
    <div className="card control-bar" role="group" aria-label="Algorithm controls">
      <div className="control-row">
        <div className="mode-buttons" role="group" aria-label="Execution mode">
          <Button
            icon={Play}
            onClick={() => run('animate')}
            disabled={busy}
            className="btn-run"
            aria-pressed={runState === 'playing'}
            title="Ask the backend for a run and replay it automatically"
          >
            {busy ? 'Starting…' : 'Auto Play'}
          </Button>
          <Button
            variant="secondary"
            icon={Footprints}
            onClick={() => run('paused')}
            disabled={busy}
            aria-pressed={runState === 'paused'}
            title="Ask the backend for a run and go through it one phase at a time"
          >
            Step-by-Step
          </Button>
          <Button
            variant="secondary"
            icon={Zap}
            onClick={() => run('instant')}
            disabled={busy}
            title="Ask the backend for a run and show the final coloring immediately"
          >
            Instant
          </Button>
        </div>

        <div className="transport" role="group" aria-label="Playback">
          <Button
            variant="ghost"
            icon={SkipBack}
            className="btn-icon"
            onClick={stepBack}
            disabled={busy || !result || runState === 'idle' || atStart}
            aria-label="Previous phase"
            title="Previous phase (←)"
          >
            <span className="t-label">Previous</span>
          </Button>
          <Button
            variant="secondary"
            icon={runState === 'playing' ? Pause : Play}
            className="btn-icon btn-play"
            onClick={playPause}
            disabled={busy}
            aria-label={playLabel}
            title={`${playLabel} (Space)`}
          >
            <span className="t-label">{playLabel}</span>
          </Button>
          <Button
            variant="ghost"
            icon={SkipForward}
            className="btn-icon"
            onClick={stepForward}
            disabled={busy || done}
            aria-label="Next phase"
            title="Next phase (→)"
          >
            <span className="t-label">Next</span>
          </Button>
          <Button
            variant="ghost"
            icon={RotateCcw}
            className="btn-icon"
            onClick={restart}
            disabled={busy || !result?.steps.length}
            aria-label="Restart the replay"
            title="Restart: replay this run from step 1"
          >
            <span className="t-label">Restart</span>
          </Button>
          <Button
            variant="ghost"
            icon={Eraser}
            className="btn-icon"
            onClick={reset}
            disabled={runState === 'idle'}
            aria-label="Clear the coloring"
            title="Clear the coloring (R)"
          />
          <span className="step-readout" aria-live="off">
            Step <strong>{pad2(current)}</strong> / {pad2(total)}
          </span>
        </div>
      </div>

      <div className="control-settings">
        <div className="setting">
          <Gauge size={16} className="muted" aria-hidden="true" />
          <Segmented
            options={SPEEDS.map((s) => ({ value: s.id, label: s.label, title: `${s.label} speed: ${s.ms} ms per phase` }))}
            value={speed}
            onChange={setSpeed}
            ariaLabel="Playback speed"
          />
        </div>
        <label className="setting" title="Order in which greedy coloring visits the vertices">
          <ArrowDownWideNarrow size={16} className="muted" aria-hidden="true" />
          <span className="select-wrap">
            <select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              disabled={busy}
              aria-label="Vertex ordering strategy"
            >
              {STRATEGIES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </span>
        </label>
      </div>
    </div>
  );
}

/** Small legend of the keyboard shortcuts (see hooks/useShortcuts.js). */
export function ShortcutHint() {
  return (
    <p className="shortcut-hint" aria-label="Keyboard shortcuts">
      {SHORTCUTS.map((s) => (
        <span key={s.keys}>
          <kbd>{s.keys}</kbd> {s.action}
        </span>
      ))}
    </p>
  );
}
