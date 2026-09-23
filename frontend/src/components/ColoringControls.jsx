import { ArrowDownWideNarrow, ChevronsRight, Gauge, Pause, Play, RotateCcw, StepForward } from 'lucide-react';
import { SHORTCUTS } from '../hooks/useShortcuts';
import { SPEEDS, STRATEGIES } from '../utils/constants';
import Button from './Button';
import Segmented from './Segmented';

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
          {runState === 'done' ? 'Run Again' : busy ? 'Starting…' : animating ? 'Restart' : 'Run Greedy Coloring'}
        </Button>
        <Button
          variant="secondary"
          icon={runState === 'paused' ? Play : Pause}
          onClick={togglePause}
          disabled={!animating}
          aria-label={runState === 'paused' ? 'Resume animation' : 'Pause animation'}
          className="btn-pause"
        >
          {runState === 'paused' ? 'Resume' : 'Pause'}
        </Button>
        <Button
          variant="secondary"
          icon={StepForward}
          onClick={stepForward}
          disabled={busy || runState === 'done'}
          title="Advance one phase (select → check neighbors → choose → assign)"
          aria-label="Advance one phase"
        >
          Step
        </Button>
        <Button
          variant="ghost"
          icon={ChevronsRight}
          onClick={skipToEnd}
          disabled={busy || runState === 'done'}
          aria-label="Skip to the final coloring"
          title="Finish: skip to the final coloring"
          className="btn-icon"
        />
        <Button
          variant="ghost"
          icon={RotateCcw}
          onClick={reset}
          aria-label="Reset coloring"
          title="Reset: clear the coloring and start over"
          className="btn-icon"
        />
      </div>

      <div className="control-settings">
        <div className="setting">
          <Gauge size={16} className="muted" aria-hidden="true" />
          <Segmented
            options={SPEEDS.map((s) => ({ value: s.id, label: s.label, title: `${s.label}: ${s.ms} ms per phase` }))}
            value={speed}
            onChange={setSpeed}
            ariaLabel="Animation speed"
          />
        </div>
        <label className="setting" title="Order in which greedy visits the vertices">
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
