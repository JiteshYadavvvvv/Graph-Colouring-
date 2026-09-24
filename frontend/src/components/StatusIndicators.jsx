import { coloringStatus } from './GraphInfoPanel';

const ENGINE = {
  checking: { tone: 'pending', text: 'Connecting to backend…', short: 'Connecting…' },
  online: { tone: 'ok', text: 'Backend connected', short: 'Backend' },
  offline: { tone: 'down', text: 'Backend unreachable', short: 'Backend offline' },
  error: { tone: 'down', text: 'Backend error', short: 'Backend error' },
};

const COLORING_TONE = { success: 'ok', danger: 'down', info: 'pending', neutral: 'idle' };

/**
 * Three live indicators, each derived from real application state:
 * GET /api/health, the dataset load, and the verified coloring. `compact`
 * shows short wording (the full wording stays in the tooltip and for screen
 * readers); the state is always spelled out, never shown by color alone.
 */
export default function StatusIndicators({ cs, className = '', compact = false }) {
  const engine = ENGINE[cs.engine] ?? ENGINE.checking;
  const dataset =
    cs.load.status === 'error'
      ? { tone: 'down', text: 'Dataset failed to load', short: 'Dataset error' }
      : cs.graph && cs.load.status === 'ready'
        ? { tone: 'ok', text: 'Dataset loaded', short: 'Dataset' }
        : { tone: 'pending', text: 'Loading dataset…', short: 'Loading…' };
  const status = coloringStatus(cs);
  const coloring = {
    tone: COLORING_TONE[status.tone],
    text: status.tone === 'success' ? 'Coloring valid' : status.tone === 'danger' ? 'Coloring invalid' : status.text,
    short: status.tone === 'success' ? 'Valid' : status.tone === 'danger' ? 'Invalid' : status.text,
  };

  return (
    <ul className={`status-indicators ${className}`} aria-label="System status">
      {[engine, dataset, coloring].map((item) => (
        <li key={item.text} className={`indicator tone-${item.tone}`} title={item.text}>
          <span className="dot" aria-hidden="true" />
          {compact ? (
            <>
              <span aria-hidden="true">{item.short}</span>
              <span className="sr-only">{item.text}</span>
            </>
          ) : (
            item.text
          )}
        </li>
      ))}
    </ul>
  );
}
