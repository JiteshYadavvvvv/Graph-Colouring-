import { ChevronsRight, Pause, Play, RotateCcw, StepForward } from 'lucide-react';
import { SPEED_NAMES, STRATEGIES } from '../utils/constants';
import Button from './Button';

/** Run / pause / step / finish / reset controls plus speed and vertex order. */
export default function ColoringControls({ coloringState }) {
  const {
    runState, run, togglePause, stepForward, skipToEnd, reset, speed, setSpeed, strategy, setStrategy,
  } = coloringState;
  const busy = runState === 'requesting';
  const animating = runState === 'playing' || runState === 'paused';

  return (
    <div className="card control-bar" role="group" aria-label="Algorithm controls">
      <div className="control-buttons">
        <Button
          icon={Play}
          onClick={() => run('animate')}
          disabled={busy}
          className="btn-run"
          aria-label={runState === 'done' ? 'Run greedy coloring again' : 'Run greedy coloring'}
        >
          {runState === 'done' ? 'Run Again' : busy ? 'Starting…' : 'Run Greedy Coloring'}
        </Button>
        <Button
          variant="secondary"
          icon={runState === 'paused' ? Play : Pause}
          onClick={togglePause}
          disabled={!animating}
          aria-label={runState === 'paused' ? 'Resume animation' : 'Pause animation'}
        >
          {runState === 'paused' ? 'Resume' : 'Pause'}
        </Button>
        <Button
          variant="secondary"
          icon={StepForward}
          onClick={stepForward}
          disabled={busy || runState === 'done'}
          title="Advance one micro-step (select → check neighbors → choose → assign)"
          aria-label="Advance one step"
        >
          Step
        </Button>
        <Button
          variant="ghost"
          icon={ChevronsRight}
          onClick={skipToEnd}
          disabled={busy || runState === 'done'}
          aria-label="Skip to the final coloring"
        >
          Finish
        </Button>
        <Button variant="ghost" icon={RotateCcw} onClick={reset} aria-label="Reset coloring">
          Reset
        </Button>
      </div>

      <div className="control-settings">
        <label className="range-field">
          <span className="range-label">
            Speed <strong>{SPEED_NAMES[speed - 1]}</strong>
          </span>
          <span className="range-row">
            <span className="muted small">Slow</span>
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              aria-label="Animation speed"
            />
            <span className="muted small">Fast</span>
          </span>
        </label>
        <label className="select-field compact">
          <span>Vertex order</span>
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
        </label>
      </div>
    </div>
  );
}
