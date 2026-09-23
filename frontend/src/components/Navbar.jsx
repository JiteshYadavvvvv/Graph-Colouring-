import { RotateCcw } from 'lucide-react';
import Button from './Button';

const RUN_LABELS = {
  idle: 'Ready',
  requesting: 'Contacting engine…',
  playing: 'Running',
  paused: 'Paused',
  done: 'Completed',
};

function Logo() {
  return (
    <svg viewBox="0 0 40 40" width="38" height="38" aria-hidden="true">
      <rect width="40" height="40" rx="11" fill="#172033" />
      <path d="M12 13 L28 15 L20 29 Z M12 13 L20 29" stroke="#5B6B8C" strokeWidth="2" fill="none" />
      <circle cx="12" cy="13" r="5" fill="#3B6FE0" />
      <circle cx="28" cy="15" r="5" fill="#18B7A0" />
      <circle cx="20" cy="29" r="5" fill="#8B5CF6" />
    </svg>
  );
}

export default function Navbar({ datasets, datasetKey, onDatasetChange, runState, strategy, onReset }) {
  const strategyLabel = strategy === 'largest_first' ? 'Largest-first' : 'Natural order';
  return (
    <header className="navbar">
      <div className="brand">
        <Logo />
        <div>
          <div className="brand-title">Interactive Map Coloring</div>
          <div className="brand-sub">Graph Coloring • DSA Visualization</div>
        </div>
      </div>

      <div className="navbar-actions">
        <div className={`algo-indicator state-${runState}`} aria-live="polite">
          <span className="dot" aria-hidden="true" />
          <span className="algo-name">Greedy</span>
          <span className="algo-meta">
            {strategyLabel} · {RUN_LABELS[runState]}
          </span>
        </div>

        <label className="select-field">
          <span>Dataset</span>
          <select
            value={datasetKey}
            onChange={(e) => onDatasetChange(e.target.value)}
            aria-label="Select dataset"
          >
            {datasets.length === 0 && <option value={datasetKey}>Loading…</option>}
            {datasets.map((d) => (
              <option key={d.key} value={d.key}>
                {d.name}
              </option>
            ))}
          </select>
        </label>

        <Button variant="secondary" icon={RotateCcw} onClick={onReset} aria-label="Reset coloring">
          <span className="hide-sm">Reset</span>
        </Button>
      </div>
    </header>
  );
}
