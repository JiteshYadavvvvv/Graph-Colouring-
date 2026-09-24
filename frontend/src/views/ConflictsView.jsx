import { motion } from 'framer-motion';
import { Bug, ScanSearch, ShieldCheck, Zap } from 'lucide-react';
import Button from '../components/Button';
import ColorChip from '../components/ColorChip';
import ConflictBanner from '../components/ConflictBanner';
import ConflictDemoButtons from '../components/ConflictDemoButtons';
import VizStage from '../components/VizStage';
import { nameOf } from '../utils/helpers';

export default function ConflictsView({ cs }) {
  const { graph, result, runState, coloring, verification, verifying, simulated } = cs;
  const done = runState === 'done';
  const name = (v) => nameOf(graph, v);
  const hasColoring = Object.keys(coloring).length > 0;

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Verification</span>
          <h1>Conflict Detection</h1>
          <p className="muted">
            A coloring is valid when no edge joins two vertices of the same color. The backend checks every edge
            once, so the check costs O(V + E).
          </p>
        </div>
      </header>

      <div className="conflict-actions">
        <div className="card action-card">
          <div className="action-icon">
            <ScanSearch size={22} aria-hidden="true" />
          </div>
          <div className="action-body">
            <h3>Run Conflict Detection</h3>
            <p className="muted small">
              Sends the colors on screen to <code>POST /api/conflicts</code>, which checks whether
              color[u] ≠ color[v] for every edge (u, v).
            </p>
            <div className="hero-actions">
              <Button icon={ShieldCheck} onClick={cs.detectConflicts} disabled={!hasColoring || verifying}>
                Detect Conflicts
              </Button>
              {!result && (
                <Button variant="secondary" icon={Zap} onClick={() => cs.run('instant')} disabled={runState === 'requesting'}>
                  Generate coloring first
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="card action-card debug-card">
          <span className="debug-tag">DEMO / DEBUG FEATURE</span>
          <div className="action-icon debug">
            <Bug size={22} aria-hidden="true" />
          </div>
          <div className="action-body">
            <h3>Simulate Conflict</h3>
            <p className="muted small">
              Picks a random edge (u, v) and gives u the same color as v, <strong>in the browser only</strong>. The
              backend graph is not changed. The detector then has to find the conflict on its own.{' '}
              <strong>Fix Coloring</strong> runs the coloring algorithm again on the backend and verifies the new result.
            </p>
            <ConflictDemoButtons cs={cs} />
            {!done && <p className="muted small">Available once the coloring has finished.</p>}
          </div>
        </div>
      </div>

      {simulated && (
        <motion.p className="note warn" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          Simulated change: <strong>{name(simulated.vertex)}</strong> changed from <ColorChip color={simulated.from} /> Color{' '}
          {simulated.from} to <ColorChip color={simulated.to} /> Color {simulated.to} (copied from its neighbor{' '}
          <strong>{name(simulated.partner)}</strong>).
        </motion.p>
      )}

      <ConflictBanner graph={graph} verification={verification} verifying={verifying} />

      <div className="viz-layout">
        <div className="viz-main">
          <VizStage cs={cs} title="Conflicts highlighted" edges="conflicts" defaultMode="split" />
        </div>
        <aside className="viz-side">
          <div className="card">
            <h3 className="card-title">Conflicting edges</h3>
            {!verification ? (
              <p className="muted small">Run the detector to see results.</p>
            ) : verification.conflicts.length === 0 ? (
              <p className="muted small">
                None. All {verification.checked_edges} edges connect differently colored vertices.
              </p>
            ) : (
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th scope="col">Region A</th>
                      <th scope="col">Region B</th>
                      <th scope="col">Shared color</th>
                    </tr>
                  </thead>
                  <tbody>
                    {verification.conflicts.map((c) => (
                      <tr key={`${c.region_a}-${c.region_b}`} className="conflict">
                        <td>{name(c.region_a)}</td>
                        <td>{name(c.region_b)}</td>
                        <td className="nowrap">
                          <ColorChip color={c.color} /> Color {c.color}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          {verification && (
            <div className="card">
              <h3 className="card-title">Raw API response</h3>
              <pre className="json">{JSON.stringify(verification, null, 2)}</pre>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
