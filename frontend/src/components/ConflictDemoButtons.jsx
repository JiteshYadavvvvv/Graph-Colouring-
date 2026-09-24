import { Bug, Wrench } from 'lucide-react';
import Button from './Button';

/**
 * "Simulate Conflict" breaks the finished coloring on purpose (in the browser
 * only) so the backend's conflict detector can be demonstrated; "Fix
 * Coloring" reruns the coloring algorithm on the backend. Both results are
 * verified through POST /api/conflicts.
 */
export default function ConflictDemoButtons({ cs, size = 'md' }) {
  const { runState, verifying, simulated, simulateConflict, fixColoring } = cs;
  const done = runState === 'done';
  return (
    <div className="hero-actions">
      <Button variant="debug" size={size} icon={Bug} onClick={simulateConflict} disabled={!done || verifying}>
        {simulated ? 'Simulate Another' : 'Simulate Conflict'}
      </Button>
      {simulated && (
        <Button
          variant="secondary"
          size={size}
          icon={Wrench}
          onClick={fixColoring}
          disabled={verifying}
          title="Run the coloring algorithm again on the backend and verify the new result"
        >
          Fix Coloring
        </Button>
      )}
    </div>
  );
}
