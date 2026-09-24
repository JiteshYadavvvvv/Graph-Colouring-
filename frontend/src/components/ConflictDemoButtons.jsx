import { Bug, Wrench } from 'lucide-react';
import Button from './Button';

/**
 * "Simulate Conflict" breaks the finished coloring on purpose (in the browser
 * only) so the backend's conflict detector can be demonstrated; "Fix
 * Coloring" restores the algorithm's own coloring. Both re-verify through
 * POST /api/conflicts.
 */
export default function ConflictDemoButtons({ cs, size = 'md' }) {
  const { runState, verifying, simulated, simulateConflict, restoreColoring } = cs;
  const done = runState === 'done';
  return (
    <div className="hero-actions">
      <Button variant="debug" size={size} icon={Bug} onClick={simulateConflict} disabled={!done || verifying}>
        {simulated ? 'Simulate Another' : 'Simulate Conflict'}
      </Button>
      {simulated && (
        <Button variant="secondary" size={size} icon={Wrench} onClick={restoreColoring} disabled={verifying}>
          Fix Coloring
        </Button>
      )}
    </div>
  );
}
