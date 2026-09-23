import { motion } from 'framer-motion';
import { ChevronsRight, CircleCheck, CircleX, LoaderCircle, MapPin, Palette, Play, ShieldAlert, Table2, Zap } from 'lucide-react';
import Button from '../components/Button';
import ColorChip from '../components/ColorChip';
import Legend from '../components/Legend';
import { EmptyState } from '../components/LoadingState';
import ResultsTable from '../components/ResultsTable';
import StatCard from '../components/StatCard';
import { usedColors } from '../utils/helpers';
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
  const classes = usedColors(coloring).map((c) => ({
    color: c,
    members: result.order.filter((v) => coloring[v] === c),
  }));

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Results</span>
          <motion.h1 initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
            Graph Coloring Completed
          </motion.h1>
          <p className="muted">
            {graph.name} · {result.strategy_label}
            {simulated && <span className="pill pill-danger">Simulated conflict active</span>}
          </p>
        </div>
      </header>

      <div className="stat-grid">
        <StatCard icon={MapPin} label="Regions" value={result.steps.length} hint="Vertices colored" />
        <StatCard icon={Palette} label="Colors Used" value={colorCount} hint={`Upper bound Δ + 1 = ${graph.statistics.greedy_upper_bound}`} tone="secondary" delay={0.05} />
        <StatCard
          icon={ShieldAlert}
          label="Conflicts"
          value={verifying ? '…' : conflictCount ?? '—'}
          hint="Checked by POST /api/conflicts"
          tone={conflictCount ? 'danger' : 'success'}
          delay={0.1}
        />
        <StatCard
          icon={verifying ? LoaderCircle : valid ? CircleCheck : CircleX}
          label="Verdict"
          value={verifying ? 'Checking' : valid === undefined ? '—' : valid ? 'Valid Coloring' : 'Invalid'}
          hint={valid ? 'No adjacent regions share a color' : valid === false ? 'Adjacent regions share a color' : ''}
          tone={valid === false ? 'danger' : 'success'}
          delay={0.15}
        />
      </div>

      <div className="viz-layout">
        <div className="viz-main">
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
              <IndiaMapSVG graph={graph} coloring={coloring} conflicts={cs.conflicts} />
            ) : (
              <GraphSVG key={graph.key} graph={graph} coloring={coloring} conflicts={cs.conflicts} draggable={false} />
            )}
          </div>
          <div className="card">
            <h3 className="card-title">Color classes</h3>
            <p className="muted small">
              Each color class is an <em>independent set</em>: no two of its members are adjacent.
            </p>
            <ul className="class-list">
              {classes.map(({ color, members }) => (
                <li key={color}>
                  <ColorChip color={color} />
                  <span>{members.join(', ')}</span>
                </li>
              ))}
            </ul>
          </div>
          <Legend coloring={coloring} showStates={false} />
        </aside>
      </div>
    </div>
  );
}
