import { motion } from 'framer-motion';
import { Check, ChevronsRight, CircleX, LoaderCircle, Play, Table2, Zap } from 'lucide-react';
import Button from '../components/Button';
import ChromaticCard from '../components/ChromaticCard';
import ColorDistribution from '../components/ColorDistribution';
import ConflictDemoButtons from '../components/ConflictDemoButtons';
import CountUp from '../components/CountUp';
import ExportPanel from '../components/ExportPanel';
import { EmptyState } from '../components/LoadingState';
import ResultsTable from '../components/ResultsTable';
import { formatMs, usedColors } from '../utils/helpers';
import GraphSVG from '../visualization/GraphSVG';
import IndiaMapSVG from '../visualization/IndiaMapSVG';

export default function ResultsView({ cs, navigate }) {
  const { result, runState, graph, coloring, verification, verifying, simulated } = cs;

  if (!result || runState === 'requesting') {
    return (
      <div className="page">
        <EmptyState
          icon={Table2}
          title="No results yet"
          message="Run the greedy coloring algorithm to see which color each region received."
        >
          <div className="hero-actions center">
            <Button
              icon={Play}
              onClick={() => {
                navigate('map');
                cs.run('animate');
              }}
            >
              Watch it run
            </Button>
            <Button variant="secondary" icon={Zap} onClick={() => cs.run('instant')} disabled={runState === 'requesting'}>
              Compute instantly
            </Button>
          </div>
        </EmptyState>
      </div>
    );
  }

  if (runState !== 'done') {
    return (
      <div className="page">
        <EmptyState
          icon={LoaderCircle}
          title="The algorithm is still running"
          message={`Step ${cs.completedSteps} of ${cs.totalSteps} is complete. Results appear once every vertex is colored.`}
        >
          <div className="hero-actions center">
            <Button variant="secondary" onClick={() => navigate('map')}>
              Watch the animation
            </Button>
            <Button icon={ChevronsRight} onClick={cs.skipToEnd}>
              Skip to the result
            </Button>
          </div>
        </EmptyState>
      </div>
    );
  }

  const colorCount = usedColors(coloring).length;
  const conflictCount = verification?.conflicts.length;
  const valid = verification?.valid;
  const st = result.statistics;

  const stats = [
    { label: graph.kind === 'map' ? 'Regions' : 'Vertices', value: result.steps.length },
    { label: 'Colors used', value: colorCount },
    { label: 'Conflicts', value: verifying ? '…' : conflictCount ?? '—', danger: Boolean(conflictCount) },
  ];

  return (
    <div className="page">
      <motion.section
        className={`card completion ${valid === false ? 'invalid' : ''}`}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        aria-live="polite"
      >
        <motion.div
          className="completion-mark"
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 320, damping: 18, delay: 0.1 }}
          aria-hidden="true"
        >
          {verifying ? <LoaderCircle className="spin" size={30} /> : valid === false ? <CircleX size={30} /> : <Check size={30} strokeWidth={3} />}
        </motion.div>
        <div className="completion-text">
          <span className="eyebrow">Results · {result.strategy_label}</span>
          <h1>Graph Coloring Completed</h1>
          <p className="muted">
            {graph.name}. The coloring was verified by <code>POST /api/conflicts</code>, which checks every edge on the
            backend.
            {simulated && <span className="pill pill-danger">Simulated conflict active</span>}
          </p>
        </div>
        <dl className="completion-stats">
          {stats.map((st, i) => (
            <motion.div
              key={st.label}
              className={st.danger ? 'danger' : ''}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.08 }}
            >
              <dt>{st.label}</dt>
              <dd>
                <CountUp value={st.value} />
              </dd>
            </motion.div>
          ))}
        </dl>
        <div className={`verdict ${verifying ? 'pending' : valid ? 'ok' : valid === false ? 'bad' : 'pending'}`}>
          {verifying ? 'Verifying…' : valid ? 'Valid coloring' : valid === false ? 'Invalid coloring' : 'Not verified'}
        </div>
      </motion.section>

      <div className="viz-layout">
        <div className="viz-main">
          <section className="card analytics" aria-label="Coloring analytics">
            <div className="card-title-row wrap">
              <h3 className="card-title">Coloring analytics</h3>
              <span className="muted small">
                From the backend run · {result.strategy_label}
              </span>
            </div>
            <dl className="analytics-grid">
              <div>
                <dt>Colors used</dt>
                <dd>{colorCount}</dd>
              </div>
              <div className={conflictCount ? 'danger' : ''}>
                <dt>Conflicts</dt>
                <dd>{verifying ? '…' : conflictCount ?? '—'}</dd>
              </div>
              <div>
                <dt>Vertices processed</dt>
                <dd>{result.steps.length}</dd>
              </div>
              <div>
                <dt>Neighbor checks</dt>
                <dd>{st.neighbor_checks}</dd>
                <span className="muted small">each edge seen from both ends = 2E</span>
              </div>
              <div>
                <dt>Edges verified</dt>
                <dd>{verification ? verification.checked_edges : '—'}</dd>
                <span className="muted small">by POST /api/conflicts</span>
              </div>
              <div>
                <dt>Execution time</dt>
                <dd>{formatMs(st.execution_ms)}</dd>
                <span className="muted small">measured on the backend</span>
              </div>
            </dl>
            <h4 className="subhead">Color distribution</h4>
            <ColorDistribution graph={graph} coloring={coloring} order={result.order} />
            <p className="muted small">
              Each color class is an <em>independent set</em>: no two of its members are adjacent. Greedy never
              exceeds Δ + 1 = {graph.statistics.greedy_upper_bound} colors on this graph.
            </p>
          </section>
          <div className="card">
            <div className="card-title-row">
              <h3 className="card-title">Assigned colors</h3>
              <span className="muted small">Click a column header to sort</span>
            </div>
            <ResultsTable result={result} graph={graph} coloring={coloring} conflictVertices={cs.conflicts.vertices} />
          </div>
        </div>
        <aside className="viz-side">
          <div className="card preview-card">
            <h3 className="card-title">Final {graph.kind === 'map' ? 'map' : 'graph'}</h3>
            {graph.kind === 'map' ? (
              <IndiaMapSVG graph={graph} coloring={coloring} conflicts={cs.conflicts} interactive={false} />
            ) : (
              <GraphSVG key={graph.key} graph={graph} coloring={coloring} conflicts={cs.conflicts} draggable={false} interactive={false} />
            )}
          </div>
          <ChromaticCard graph={graph} colorsUsed={colorCount} />
          <div className="card">
            <h3 className="card-title">Conflict demo</h3>
            <p className="muted small">
              Break the coloring on purpose and let the backend detector find the problem, then fix it again.
            </p>
            <ConflictDemoButtons cs={cs} size="sm" />
          </div>
          <ExportPanel cs={cs} />
        </aside>
      </div>
    </div>
  );
}
